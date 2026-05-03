/**
 * Realign legacy custom_text post slugs in Postgres so they match the
 * MySQL permalink (e.g. "donate", "quarantine-takeovers"). Earlier import
 * runs prefixed slugs with a YYYY-MM-DD-- prefix which broke legacy PHP
 * lookups in donate.php, the quarantine.php redirect, etc.
 */

// eslint-disable-next-line import/no-extraneous-dependencies
import { Command } from 'commander';
import mysql from 'mysql2/promise';
import { getPayloadClient } from './shared/payloadClient';
import { getLegacyDbConfig } from '../../config/databases';
import { createLogger } from './shared/logger';

const logger = createLogger('FixCustomTextSlugs');

interface Options {
  env: 'dev' | 'prod';
  dryRun: boolean;
}

async function run(options: Options) {
  logger.info(`Starting slug realignment (env=${options.env}, dryRun=${options.dryRun})`);

  const cfg = getLegacyDbConfig();
  const conn = await mysql.createConnection({
    host: cfg.host,
    port: cfg.port,
    user: cfg.user,
    password: cfg.password,
    database: cfg.database,
  });

  const [rows] = await conn.execute<any[]>(
    "SELECT id, permalink FROM custom_texts WHERE permalink IS NOT NULL AND permalink != '' AND status = 'active'",
  );
  await conn.end();

  process.env.PAYLOAD_MIGRATING = 'true';
  const payload = await getPayloadClient(options.env);

  let updated = 0;
  let alreadyOk = 0;
  let notFound = 0;
  let conflicts = 0;

  // eslint-disable-next-line no-restricted-syntax
  for (const r of rows) {
    const legacyId = (r.id as number) + 10000;
    const target = r.permalink as string;

    // eslint-disable-next-line no-await-in-loop
    const found = await payload.find({
      collection: 'posts',
      where: { legacyId: { equals: legacyId } },
      limit: 1,
    });
    const post = found.docs[0];
    if (!post) {
      notFound++;
    } else if (post.slug === target) {
      alreadyOk++;
    } else {
      // eslint-disable-next-line no-await-in-loop
      const conflict = await payload.find({
        collection: 'posts',
        where: { slug: { equals: target } },
        limit: 1,
      });
      if (conflict.docs[0] && conflict.docs[0].id !== post.id) {
        logger.warn(
          `Conflict: post ${post.id} (legacyId ${legacyId}) wants slug "${target}" but it's already used by post ${conflict.docs[0].id}`,
        );
        conflicts++;
      } else {
        logger.info(
          `Updating post ${post.id}: "${post.slug}" → "${target}" (legacyId ${legacyId})`,
        );
        if (!options.dryRun) {
          // eslint-disable-next-line no-await-in-loop
          await payload.update({
            collection: 'posts',
            id: post.id,
            data: { slug: target },
          });
        }
        updated++;
      }
    }
  }

  logger.info(
    `Done. updated=${updated} alreadyOk=${alreadyOk} notFound=${notFound} conflicts=${conflicts}`,
  );
}

const program = new Command();
program
  .option('--env <env>', 'dev or prod', 'dev')
  .option('--dry-run', 'do not write changes', false)
  .action(async (opts) => {
    try {
      await run({ env: opts.env, dryRun: !!opts.dryRun });
      process.exit(0);
    } catch (e) {
      logger.error('Failed:', e);
      process.exit(1);
    }
  });
program.parse(process.argv);
