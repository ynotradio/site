/**
 * Pre-cutover admin fixes for the deejays page on dev Neon:
 *
 *  1. Issue #598: duplicate "Josh T. Landow" — there are two DJ rows
 *     (legacy_id=1, on_air=false) and (legacy_id=79, on_air=true). The
 *     legacy import created the first one; the active record is the
 *     second. Soft-delete the duplicate by setting _status='draft' so
 *     admins still see it for reference but it never renders publicly.
 *
 *  2. Issue #596: Judy G. has no photo in dev Neon. The legacy production
 *     site uses https://i.imgur.com/MARUqpa.jpg. Create a media record
 *     pointing at that URL and link Judy (id=75) to it.
 *
 * Idempotent. Run with --env dev (default) or --env prod.
 */

// eslint-disable-next-line import/no-extraneous-dependencies
import { Command } from 'commander';
import { getPayloadClient } from './shared/payloadClient';
import { createLogger } from './shared/logger';

const logger = createLogger('FixDeejaysAdmin');

const JUDY_LEGACY_NAME = 'Judy G.';
const JUDY_PHOTO_URL = 'https://i.imgur.com/MARUqpa.jpg';
const DUPLICATE_JOSH_LEGACY_ID = 1;

interface Options {
  env: 'dev' | 'prod';
  dryRun: boolean;
}

async function fixDuplicateJosh(payload: any, dryRun: boolean): Promise<void> {
  const found = await payload.find({
    collection: 'djs',
    where: { legacyId: { equals: DUPLICATE_JOSH_LEGACY_ID } },
    limit: 1,
  });
  const dj = found.docs[0];
  if (!dj) {
    logger.warn(`No DJ with legacyId=${DUPLICATE_JOSH_LEGACY_ID} found — nothing to do.`);
    return;
  }
  if (dj._status === 'draft') {
    logger.info(`Duplicate Josh (id=${dj.id}) is already draft — skip.`);
    return;
  }
  logger.info(
    `Setting duplicate Josh (id=${dj.id}, displayName="${dj.displayName}") to _status=draft`,
  );
  if (!dryRun) {
    await payload.update({
      collection: 'djs',
      id: dj.id,
      data: { _status: 'draft' },
    });
  }
}

async function fixJudyPhoto(payload: any, dryRun: boolean): Promise<void> {
  const found = await payload.find({
    collection: 'djs',
    where: { displayName: { equals: JUDY_LEGACY_NAME } },
    limit: 1,
  });
  const judy = found.docs[0];
  if (!judy) {
    logger.warn(`Could not find DJ "${JUDY_LEGACY_NAME}" — nothing to do.`);
    return;
  }
  if (judy.photo) {
    logger.info(
      `${JUDY_LEGACY_NAME} (id=${judy.id}) already has a photo (id=${typeof judy.photo === 'object' ? judy.photo.id : judy.photo}). Skip.`,
    );
    return;
  }

  // Payload's media collection is upload-only via the API. Drop down to SQL
  // for a legacy-URL-only media row that PostgresDeejay's CASE expression
  // will surface via m.legacy_url.
  const db = payload.db.drizzle.session.client;
  const existing = await db.query('SELECT id FROM media WHERE legacy_url = $1 LIMIT 1', [
    JUDY_PHOTO_URL,
  ]);
  let mediaId: number;
  if (existing.rows[0]) {
    mediaId = existing.rows[0].id;
    logger.info(`Reusing existing media id=${mediaId}`);
  } else {
    logger.info(`Creating media row with legacy_url=${JUDY_PHOTO_URL}`);
    if (dryRun) {
      mediaId = -1;
    } else {
      const ins = await db.query(
        'INSERT INTO media (alt, legacy_url, mime_type, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW()) RETURNING id',
        [`Photo of ${JUDY_LEGACY_NAME}`, JUDY_PHOTO_URL, 'image/jpeg'],
      );
      mediaId = ins.rows[0].id;
      logger.info(`Created media id=${mediaId}`);
    }
  }

  logger.info(`Linking ${JUDY_LEGACY_NAME} (id=${judy.id}) to media id=${mediaId}`);
  if (!dryRun) {
    await db.query('UPDATE djs SET photo_id = $1, updated_at = NOW() WHERE id = $2', [
      mediaId,
      judy.id,
    ]);
  }
}

async function run(options: Options) {
  logger.info(`Starting deejays admin fixes (env=${options.env}, dryRun=${options.dryRun})`);
  process.env.PAYLOAD_MIGRATING = 'true';
  const payload = await getPayloadClient(options.env);
  await fixDuplicateJosh(payload, options.dryRun);
  await fixJudyPhoto(payload, options.dryRun);
  logger.info('Done.');
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
