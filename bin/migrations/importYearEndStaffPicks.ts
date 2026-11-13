#!/usr/bin/env tsx
/* eslint-disable no-await-in-loop */
/**
 * Import legacy Year End staff picks (MySQL `year_end_staff_picks`, one HTML
 * table per staff member) into the structured `year-end-staff-picks` collection.
 *
 * Usage:
 *   yarn import:staff-picks --year 2025 [--from local-mysql|prod-mysql]
 *     [--to local-postgres|dev-neon|prod-neon] [--dry-run]
 *
 * Defaults: --from local-mysql --to local-postgres. Prod targets require the
 * confirmation env enforced by getPayloadClient. The legacy table has no year,
 * so --year is required. Deleted rows are skipped.
 *
 * Idempotent: a pick with the same year and name is updated, not duplicated.
 */
import * as mysql from 'mysql2/promise';
import { getPayloadClient } from './shared/payloadClient';
import type { PostgresTarget } from './shared/payloadClient';
import { createLogger } from './shared/logger';
import { parseStaffPickHtml } from './shared/parseStaffPickHtml';
import { getMySQLConfig, type MySQLSource } from '../../config/databases';

const logger = createLogger('StaffPicksImport');

interface Options {
  from: MySQLSource;
  to: PostgresTarget;
  year: number;
  dryRun: boolean;
}

function parseArgs(args: string[]): Options {
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
    from,
    to,
    year,
    dryRun: args.includes('--dry-run'),
  };
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  logger.info(
    `Staff picks ${options.year}: ${options.from} -> ${options.dryRun ? 'dry run' : options.to}`,
  );

  const connection = await mysql.createConnection({
    ...getMySQLConfig(options.from),
    charset: 'utf8mb4',
  });
  const [rows] = await connection.query<mysql.RowDataPacket[]>(
    "SELECT id, order_id, html FROM year_end_staff_picks WHERE deleted <> 'y' ORDER BY order_id, id",
  );
  await connection.end();

  const parsed = rows.map((row) => ({
    legacyId: row.id as number,
    sortOrder: row.order_id as number,
    ...parseStaffPickHtml(row.html),
  }));
  parsed.forEach((pick) => {
    const players = pick.mixcloudUrls ? pick.mixcloudUrls.split('\n').length : 0;
    const notes = [...(pick.hidden ? ['hidden on legacy page, skipped'] : []), ...pick.warnings];
    logger.info(
      `#${pick.legacyId} ${pick.name}: ${pick.songs.length} songs, ${pick.albums.length} albums, `
        + `${players} player(s)${notes.length ? `  ⚠ ${notes.join('; ')}` : ''}`,
    );
  });

  const picks = parsed.filter((pick) => !pick.hidden);
  const unnamed = picks.filter((pick) => !pick.name);
  if (unnamed.length) throw new Error(`Legacy rows without a name: ${unnamed.map((p) => p.legacyId).join(', ')}`);
  if (options.dryRun) return;

  const payload = await getPayloadClient(options.to);
  const djs = await payload.find({
    collection: 'djs',
    limit: 0,
    depth: 0,
    pagination: false,
    sort: '-onAir',
  });
  const djByName = new Map<string, number | string>();
  djs.docs.forEach((dj) => {
    const key = String(dj.displayName ?? '')
      .trim()
      .toLowerCase();
    if (key && !djByName.has(key)) djByName.set(key, dj.id);
  });

  let created = 0;
  let updated = 0;
  for (const pick of picks) {
    const data = {
      year: options.year,
      name: pick.name,
      dj: djByName.get(pick.name.toLowerCase()) ?? null,
      showName: pick.showName,
      details: pick.details,
      mixcloudUrls: pick.mixcloudUrls,
      sortOrder: pick.sortOrder,
      songs: pick.songs,
      albums: pick.albums,
    };
    const existing = await payload.find({
      collection: 'year-end-staff-picks',
      where: { and: [{ year: { equals: options.year } }, { name: { equals: pick.name } }] },
      limit: 1,
      depth: 0,
    });
    if (existing.docs[0]) {
      await payload.update({ collection: 'year-end-staff-picks', id: existing.docs[0].id, data });
      updated += 1;
    } else {
      await payload.create({ collection: 'year-end-staff-picks', data });
      created += 1;
    }
  }

  const linked = picks.filter((pick) => djByName.has(pick.name.toLowerCase())).length;
  logger.info(
    `Done: ${created} created, ${updated} updated, ${linked}/${picks.length} linked to a DJ`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    logger.error((err as Error).message);
    process.exit(1);
  });
