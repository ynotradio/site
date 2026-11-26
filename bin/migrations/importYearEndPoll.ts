#!/usr/bin/env tsx
/* eslint-disable no-await-in-loop */
/**
 * Import a past Year End Poll from legacy MySQL (one `year_end_<category>`
 * table per category, with a running `votes` column) into Payload as an
 * archived poll whose nominees are text labels with their final vote counts.
 * Archived, not closed: yearendpoll.php shows the newest open or closed poll,
 * so a closed import would replace the current poll on the public page.
 *
 * Usage:
 *   yarn import:yep --year 2025 [--from local-mysql|prod-mysql]
 *     [--to local-postgres|dev-neon|prod-neon] [--dry-run]
 *
 * The legacy tables hold one year only, so --year is required. Only the
 * categories in bin/seed-data/yearEndPoll.ts are imported, and empty ones are
 * skipped. Voters, IPs, write-ins and prize entrants are not copied.
 * Re-runnable: an existing poll with the same slug is left alone.
 */
import * as mysql from 'mysql2/promise';
import { getPayloadClient } from './shared/payloadClient';
import type { PostgresTarget } from './shared/payloadClient';
import { createLogger } from './shared/logger';
import { getMySQLConfig, type MySQLSource } from '../../config/databases';
import { CATEGORIES, SEED_POLL_YEAR } from '../seed-data/yearEndPoll';
import { legacyNomineeLabel, legacyCategory } from './shared/legacyYearEndPoll';

const logger = createLogger('YearEndPollImport');

const KNOWN_CATEGORIES = { year: SEED_POLL_YEAR, categories: CATEGORIES };

const NOT_CATEGORIES = new Set([
  'year_end_contestants',
  'year_end_ips',
  'year_end_song_votes',
  'year_end_staff_picks',
  'year_end_write_ins',
]);

function parseArgs(args: string[]) {
  const value = (flag: string) => {
    const i = args.indexOf(flag);
    return i >= 0 ? args[i + 1] : undefined;
  };
  const from = (value('--from') ?? 'local-mysql') as MySQLSource;
  const to = (value('--to') ?? 'local-postgres') as PostgresTarget;
  const year = Number(value('--year'));
  if (!['local-mysql', 'prod-mysql'].includes(from)) throw new Error('--from must be local-mysql or prod-mysql');
  if (!['local-postgres', 'dev-neon', 'prod-neon'].includes(to)) {
    throw new Error('--to must be local-postgres, dev-neon or prod-neon');
  }
  if (!Number.isInteger(year) || year < 2000 || year > 2100) throw new Error('--year YYYY is required');
  return {
    from, to, year, dryRun: args.includes('--dry-run'),
  };
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  logger.info(`Year End Poll ${options.year}: ${options.from} -> ${options.dryRun ? 'dry run' : options.to}`);

  const connection = await mysql.createConnection({ ...getMySQLConfig(options.from), charset: 'utf8mb4' });
  const [tables] = await connection.query<mysql.RowDataPacket[]>("SHOW TABLES LIKE 'year\\_end\\_%'");
  const categories = [];
  for (const tableRow of tables) {
    const table = String(Object.values(tableRow)[0]);
    const slug = table.replace(/^year_end_/, '');
    const settings = legacyCategory(slug, options.year, KNOWN_CATEGORIES);
    if (!settings && !NOT_CATEGORIES.has(table)) logger.info(`${table}: not a current category, skipped`);
    if (settings) {
      const [rows] = await connection.query<mysql.RowDataPacket[]>(
        `SELECT * FROM \`${table}\` ORDER BY votes DESC, id`,
      );
      if (rows.length) {
        const nominees = rows
          .map((row) => ({
            customLabel: legacyNomineeLabel(row),
            voteCount: Number(row.votes) || 0,
          }))
          .filter((nominee) => nominee.customLabel);
        const votes = nominees.reduce((n, x) => n + x.voteCount, 0);
        categories.push({ ...settings, nominees });
        logger.info(`${slug}: ${nominees.length} nominees, ${votes} votes`);
      }
    }
  }
  await connection.end();
  if (options.dryRun) return;

  const payload = await getPayloadClient(options.to);
  const slug = `yep-${options.year}`;
  const existing = await payload.find({
    collection: 'year-end-polls', where: { slug: { equals: slug } }, limit: 1, depth: 0,
  });
  if (existing.docs[0]) {
    logger.info(`Poll ${slug} already exists (id ${existing.docs[0].id}); nothing to do`);
    return;
  }

  const poll = await payload.create({
    collection: 'year-end-polls',
    data: {
      name: `${options.year} Year End Poll`,
      year: options.year,
      slug,
      status: 'archived',
    },
  });
  for (const category of categories) {
    await payload.create({ collection: 'year-end-poll-categories', data: { ...category, poll: poll.id } });
  }
  logger.info(`Done: poll ${slug} (id ${poll.id}) with ${categories.length} categories`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    logger.error((err as Error).message);
    process.exit(1);
  });
