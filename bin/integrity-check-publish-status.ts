/* eslint-disable no-console, no-underscore-dangle */
/**
 * Publish Status Integrity Check
 *
 * For every OnDemand and Posts (Stories) record that was migrated from MySQL
 * (has a legacyId), verifies that records live in MySQL are set to
 * _status: 'published' in Payload. Optionally fixes draft records that
 * should be published.
 *
 * Usage:
 *   node --import ./bin/preload-nextenv-fix.mjs --import tsx \
 *     bin/integrity-check-publish-status.ts                         # Dry run
 *   node --import ./bin/preload-nextenv-fix.mjs --import tsx \
 *     bin/integrity-check-publish-status.ts --fix                   # Fix mode
 *   node --import ./bin/preload-nextenv-fix.mjs --import tsx \
 *     bin/integrity-check-publish-status.ts --limit 50 --verbose    # Limited verbose run
 */

import * as mysql from 'mysql2/promise';
import { getPayload, type Payload } from 'payload';
import config from '@payload-config';
import { getMySQLConfig, type MySQLSource } from '../config/databases';
import {
  parseArgs,
  emptyReport,
  addResult,
  printCheckReport,
  writeReport,
  withSinceFilter,
  type CheckReport,
  type IntegrityReport,
} from './content-integrity-utils';
import { isMysqlRecordLive, resolvePostLegacyId } from './integrity-check-publish-status-utils';

// Skip Drizzle pushDevSchema — this script only reads/writes data, never alters schema
process.env.PAYLOAD_MIGRATING = 'true';

const PAGE_SIZE = 100;
type PublishStatusScope = 'all' | 'posts' | 'ondemand';

// ---------------------------------------------------------------------------
// MySQL helpers
// ---------------------------------------------------------------------------

/**
 * Bulk-fetch MySQL `deleted` values from a table by IDs.
 */
async function fetchDeletedByIds(
  mysqlConn: mysql.Connection,
  table: 'ondemand' | 'stories',
  ids: number[],
): Promise<Map<number, string>> {
  if (ids.length === 0) return new Map();

  const placeholders = ids.map(() => '?').join(',');
  const [rows] = await mysqlConn.query<mysql.RowDataPacket[]>(
    `SELECT id, deleted FROM ${table} WHERE id IN (${placeholders})`,
    ids,
  );

  const map = new Map<number, string>();
  for (const row of rows) {
    map.set(row.id as number, row.deleted as string);
  }
  return map;
}

/**
 * Bulk-fetch MySQL `status` values from the custom_texts table.
 * Returns synthetic deleted flags: 'n' if active, 'y' otherwise.
 */
async function fetchCustomTextsDeleted(
  mysqlConn: mysql.Connection,
  mysqlIds: number[],
): Promise<Map<number, string>> {
  if (mysqlIds.length === 0) return new Map();

  const placeholders = mysqlIds.map(() => '?').join(',');
  const [rows] = await mysqlConn.query<mysql.RowDataPacket[]>(
    `SELECT id, status FROM custom_texts WHERE id IN (${placeholders})`,
    mysqlIds,
  );

  const map = new Map<number, string>();
  for (const row of rows) {
    map.set(row.id as number, (row.status as string) === 'active' ? 'n' : 'y');
  }
  return map;
}

// ---------------------------------------------------------------------------
// Shared status check/fix helper
// ---------------------------------------------------------------------------

async function applyStatusCheck(
  payload: Payload,
  report: CheckReport,
  docId: number | string,
  collection: 'ondemand' | 'posts',
  legacyId: number,
  identifier: string,
  deleted: string | undefined,
  skipDetail: string,
  currentStatus: string | undefined,
  fix: boolean,
  verbose: boolean,
): Promise<void> {
  if (deleted === undefined) {
    addResult(report, {
      id: docId,
      collection,
      identifier,
      field: '_status',
      status: 'skipped',
      detail: skipDetail,
    });
    if (verbose) console.log(`  ⏭️  [${collection} ${legacyId}] ${identifier} — MySQL record not found`);
    return;
  }

  const shouldPublish = isMysqlRecordLive(deleted);
  const expectedStatus = shouldPublish ? 'published' : 'draft';

  if (currentStatus === expectedStatus) {
    addResult(report, {
      id: docId, collection, identifier, field: '_status', status: 'ok',
    });
    if (verbose) console.log(`  ✅ [${collection} ${legacyId}] ${identifier} — _status=${currentStatus}`);
  } else if (shouldPublish && currentStatus !== 'published') {
    if (fix) {
      try {
        await payload.update({ collection, id: docId, data: { _status: 'published' } });
        addResult(report, {
          id: docId,
          collection,
          identifier,
          field: '_status',
          status: 'fixed',
          currentValue: currentStatus || '(unknown)',
          expectedValue: 'published',
        });
        if (verbose) console.log(`  🔧 [${collection} ${legacyId}] ${identifier} — ${currentStatus} → published`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        addResult(report, {
          id: docId,
          collection,
          identifier,
          field: '_status',
          status: 'fix-failed',
          currentValue: currentStatus || '(unknown)',
          expectedValue: 'published',
          detail: msg,
        });
        if (verbose) console.log(`  💥 [${collection} ${legacyId}] ${identifier} — fix failed: ${msg}`);
      }
    } else {
      addResult(report, {
        id: docId,
        collection,
        identifier,
        field: '_status',
        status: 'mismatch',
        currentValue: currentStatus || '(unknown)',
        expectedValue: 'published',
      });
      if (verbose) console.log(`  ⚠️  [${collection} ${legacyId}] ${identifier} — _status=${currentStatus}, should be published`);
    }
  } else {
    addResult(report, {
      id: docId,
      collection,
      identifier,
      field: '_status',
      status: 'ok',
      detail: 'Deleted in MySQL, draft status acceptable',
    });
    if (verbose) console.log(`  ✅ [${collection} ${legacyId}] ${identifier} — deleted in MySQL, draft is OK`);
  }
}

// ---------------------------------------------------------------------------
// Check logic — OnDemand
// ---------------------------------------------------------------------------

async function checkOnDemandStatus(
  payload: Payload,
  mysqlConn: mysql.Connection,
  report: CheckReport,
  limit: number,
  fix: boolean,
  verbose: boolean,
  since: string,
): Promise<number> {
  let page = 1;
  let processed = 0;
  let hasMore = true;

  while (hasMore) {
    const pageLimit = limit ? Math.min(PAGE_SIZE, limit - processed) : PAGE_SIZE;
    if (pageLimit <= 0) break;

    const batch = await payload.find({
      collection: 'ondemand',
      where: withSinceFilter({ legacyId: { exists: true } }, since),
      limit: pageLimit,
      page,
      sort: 'id',
      depth: 0,
      draft: true,
    });

    if (batch.docs.length === 0) break;

    const legacyIds = batch.docs
      .map((d) => d.legacyId as number | undefined)
      .filter((id): id is number => id != null);

    const mysqlDeleted = await fetchDeletedByIds(mysqlConn, 'ondemand', legacyIds);

    for (const doc of batch.docs.filter((d) => d.legacyId != null)) {
      const legacyId = doc.legacyId as number;

      await applyStatusCheck(
        payload,
        report,
        doc.id,
        'ondemand',
        legacyId,
        (doc.headline as string) || `OnDemand #${doc.id}`,
        mysqlDeleted.get(legacyId),
        `No MySQL record found for legacyId=${legacyId}`,
        (doc as Record<string, unknown>)._status as string | undefined,
        fix,
        verbose,
      );

      processed += 1;
    }

    hasMore = batch.hasNextPage;
    page += 1;
  }

  return processed;
}

// ---------------------------------------------------------------------------
// Check logic — Posts (Stories + Custom Texts)
// ---------------------------------------------------------------------------

async function checkPostsStatus(
  payload: Payload,
  mysqlConn: mysql.Connection,
  report: CheckReport,
  limit: number,
  fix: boolean,
  verbose: boolean,
  since: string,
): Promise<number> {
  let page = 1;
  let processed = 0;
  let hasMore = true;

  while (hasMore) {
    const pageLimit = limit ? Math.min(PAGE_SIZE, limit - processed) : PAGE_SIZE;
    if (pageLimit <= 0) break;

    const batch = await payload.find({
      collection: 'posts',
      where: withSinceFilter({ legacyId: { exists: true } }, since),
      limit: pageLimit,
      page,
      sort: 'id',
      depth: 0,
      draft: true,
    });

    if (batch.docs.length === 0) break;

    const storyIds: number[] = [];
    const customTextIds: number[] = [];
    const docsWithLegacyId = batch.docs.filter((d) => d.legacyId != null);
    for (const doc of docsWithLegacyId) {
      const legacyId = doc.legacyId as number;
      const { table, mysqlId } = resolvePostLegacyId(legacyId);
      if (table === 'stories') {
        storyIds.push(mysqlId);
      } else {
        customTextIds.push(mysqlId);
      }
    }

    const storiesDeleted = await fetchDeletedByIds(mysqlConn, 'stories', storyIds);
    const customTextsDeleted = await fetchCustomTextsDeleted(mysqlConn, customTextIds);

    for (const doc of docsWithLegacyId) {
      const legacyId = doc.legacyId as number;
      const { table, mysqlId } = resolvePostLegacyId(legacyId);
      const deleted = table === 'stories'
        ? storiesDeleted.get(mysqlId)
        : customTextsDeleted.get(mysqlId);

      await applyStatusCheck(
        payload,
        report,
        doc.id,
        'posts',
        legacyId,
        (doc.headline as string) || `Post #${doc.id}`,
        deleted,
        `No MySQL record found in ${table} for id=${mysqlId} (legacyId=${legacyId})`,
        (doc as Record<string, unknown>)._status as string | undefined,
        fix,
        verbose,
      );

      processed += 1;
    }

    hasMore = batch.hasNextPage;
    page += 1;
  }

  return processed;
}

// ---------------------------------------------------------------------------
// CLI argument parsing — extends standard args with --from for MySQL source
// ---------------------------------------------------------------------------

function findFlagValue(argv: string[], flag: string): string | undefined {
  const args = argv.slice(2);
  const idx = args.indexOf(flag);
  return idx >= 0 ? args[idx + 1] : undefined;
}

function parseMysqlSource(argv: string[]): MySQLSource {
  const value = findFlagValue(argv, '--from');
  if (value == null) return 'prod-mysql';
  if (value === 'local-mysql' || value === 'prod-mysql') return value;
  throw new Error('--from must be "local-mysql" or "prod-mysql"');
}

function parseScope(argv: string[]): PublishStatusScope {
  const value = findFlagValue(argv, '--collection');
  if (value == null) return 'all';
  if (value === 'posts' || value === 'ondemand' || value === 'all') return value;
  throw new Error('--collection must be "posts", "ondemand", or "all"');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const options = parseArgs(process.argv);
  const from = parseMysqlSource(process.argv);
  const scope = parseScope(process.argv);

  const mode = options.fix ? '🔧 FIX MODE' : '👀 DRY RUN';
  console.log(`\n📋 Publish Status Integrity Check — ${mode}`);
  if (options.limit) console.log(`   Limit: ${options.limit} records per collection`);
  if (options.since) console.log(`   Since: ${options.since}`);
  if (options.verbose) console.log('   Verbose: on');
  console.log(`   MySQL source: ${from}`);
  console.log(`   Collection scope: ${scope}`);

  const payload = await getPayload({ config });

  // Connect to MySQL
  const mysqlConfig = getMySQLConfig(from);
  const mysqlConn = await mysql.createConnection({
    host: mysqlConfig.host,
    database: mysqlConfig.database,
    user: mysqlConfig.user,
    password: mysqlConfig.password,
    port: mysqlConfig.port,
  });

  const reportTitles: Record<PublishStatusScope, string> = {
    all: 'Publish Status (OnDemand + Stories)',
    posts: 'Publish Status (Stories + Custom Texts)',
    ondemand: 'Publish Status (OnDemand)',
  };
  const report = emptyReport('publish-status', reportTitles[scope]);
  const startTime = Date.now();

  try {
    if (scope === 'all' || scope === 'ondemand') {
      console.log('\n⏳ Checking OnDemand publish status...');
      const odCount = await checkOnDemandStatus(
        payload,
        mysqlConn,
        report,
        options.limit,
        options.fix,
        options.verbose,
        options.since,
      );
      console.log(`   Checked ${odCount} OnDemand records`);
    }

    if (scope === 'all' || scope === 'posts') {
      console.log('\n⏳ Checking Posts (Stories + Custom Texts) publish status...');
      const postsCount = await checkPostsStatus(
        payload,
        mysqlConn,
        report,
        options.limit,
        options.fix,
        options.verbose,
        options.since,
      );
      console.log(`   Checked ${postsCount} Posts records`);
    }
  } finally {
    await mysqlConn.end();
  }

  report.durationMs = Date.now() - startTime;

  printCheckReport(report);

  const integrityReport: IntegrityReport = {
    checks: [report],
    generatedAt: new Date().toISOString(),
    mode: options.fix ? 'fix' : 'check',
  };

  if (options.output) {
    writeReport(integrityReport, options.output);
  }

  console.log(`\nDone. Processed ${report.total} records in ${report.durationMs}ms.`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
