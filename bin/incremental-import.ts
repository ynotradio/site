#!/usr/bin/env tsx
/**
 * Incremental import script - imports only NEW records since last run
 *
 * This script tracks the last imported MySQL ID for each collection and only
 * imports records with higher IDs. This is much faster than re-checking all
 * records from the last 3 months.
 *
 * Usage:
 *   tsx bin/incremental-import.ts [--from SOURCE] [--to TARGET] [--reset]
 *
 * Options:
 *   --from       MySQL source: 'local-mysql' (default) or 'prod-mysql'
 *   --to         Database target: 'production-db' (default), 'preview-db', or 'local-postgres'
 *   --reset      Reset tracking and import everything from scratch
 *   --verbose    Show detailed output including skip reasons
 */

import * as fs from 'fs';
import * as path from 'path';
import * as mysql from 'mysql2/promise';
import { spawn } from 'child_process';
import {
  getMySQLConfig,
  parseFromToArgs,
  type MySQLSource,
  type PostgresTarget,
} from '../config/databases';

interface LastImportIds {
  music: number;
  concerts: number;
  posts: number;
  ondemand: number;
  cdotw: number;
  ads: number;
  djs: number;
  schedule: number;
  lastUpdated: string;
}

interface ImportOptions {
  from: MySQLSource;
  to: PostgresTarget;
  reset: boolean;
  verbose: boolean;
  output: string | null;
}

interface ImportResult {
  collection: string;
  script: string;
  success: boolean;
  imported: number;
  skipped: number;
  errors: number;
  newMaxId: number;
  skipReasons: string[];
  errorDetails: string[];
}

const TRACKING_FILE = path.join(process.cwd(), '.last-import-ids.json');

const COLLECTION_LABELS: Record<string, string> = {
  Music: 'Songs',
  Concerts: 'Concerts',
  Posts: 'Posts (Stories)',
  OnDemand: 'On Demand',
  Cdotw: 'CD of the Week',
  Ads: 'Ads (Sponsors)',
  DJs: 'DJs',
  Schedule: 'Schedule',
};

/**
 * Generate a markdown summary of the import run for posting as a GitHub comment
 */
function generateMarkdownSummary(
  results: ImportResult[],
  totalImported: number,
  totalSkipped: number,
  totalErrors: number,
  options: ImportOptions,
  noNewRecords: boolean,
): string {
  const now = new Date().toISOString();
  const lines: string[] = [];

  lines.push('## 📦 Import Run Summary');
  lines.push('');
  lines.push(`**Date:** ${now}`);
  lines.push(`**Source:** ${options.from} → ${options.to}`);
  lines.push(`**Mode:** ${options.reset ? 'Full scan (reset)' : 'Incremental'}`);
  lines.push('');

  if (noNewRecords) {
    lines.push('### Results');
    lines.push('');
    lines.push('✅ No new records to import — all collections are up to date.');
    return lines.join('\n');
  }

  lines.push('### Results');
  lines.push('');
  lines.push('| Collection | Imported | Skipped | Errors | Status |');
  lines.push('|------------|----------|---------|--------|--------|');

  for (const result of results) {
    const label = COLLECTION_LABELS[result.collection] || result.collection;
    let status: string;
    if (!result.success) {
      status = '❌ Failed';
    } else if (result.errors > 0) {
      status = '⚠️ Errors';
    } else if (result.imported > 0) {
      status = '✅ Imported';
    } else {
      status = '✅ Up to date';
    }
    lines.push(
      `| ${label} | ${result.imported.toLocaleString()} | ${result.skipped.toLocaleString()} | ${result.errors.toLocaleString()} | ${status} |`,
    );
  }

  lines.push('');
  lines.push(
    `**Total: ${totalImported.toLocaleString()} imported, ${totalSkipped.toLocaleString()} skipped, ${totalErrors.toLocaleString()} errors**`,
  );

  // Add error details if any
  const collectionsWithErrors = results.filter((r) => r.errorDetails.length > 0);
  if (collectionsWithErrors.length > 0) {
    lines.push('');
    lines.push('### Errors');
    lines.push('');
    for (const result of collectionsWithErrors) {
      const label = COLLECTION_LABELS[result.collection] || result.collection;
      lines.push(`**${label}:**`);
      for (const error of result.errorDetails.slice(0, 5)) {
        lines.push(`- ${error}`);
      }
      if (result.errorDetails.length > 5) {
        lines.push(`- *(${result.errorDetails.length - 5} more errors, see build log)*`);
      }
      lines.push('');
    }
  }

  return lines.join('\n');
}

/**
 * Parse command line arguments
 */
function parseArgs(): ImportOptions {
  const args = process.argv.slice(2);

  // Parse --from/--to arguments
  const fromTo = parseFromToArgs(args);

  const options: ImportOptions = {
    from: fromTo.from,
    to: fromTo.to,
    reset: false,
    verbose: false,
    output: null,
  };

  let i = 0;
  while (i < args.length) {
    const arg = args[i];
    if (arg === '--reset') {
      options.reset = true;
      i += 1;
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
      i += 1;
    } else if (arg === '--output' || arg === '-o') {
      options.output = args[i + 1] || null;
      i += 2;
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Usage: tsx bin/incremental-import.ts [options]

Options:
  --from SOURCE  MySQL source: 'local-mysql' (default) or 'prod-mysql'
  --to TARGET    Database target: 'production-db' (default), 'preview-db', or 'local-postgres'
  --reset        Reset tracking and import all data
  --output FILE  Write markdown summary to file (for CI posting)
  --verbose      Show detailed output including skip reasons
  --help, -h     Show this help message

Examples:
  # Import from local Docker MySQL to the configured production database (default)
  tsx bin/incremental-import.ts

  # Import from production MySQL to the configured production database
  tsx bin/incremental-import.ts --from prod-mysql --to production-db

  # Reset and re-import everything, save summary
  tsx bin/incremental-import.ts --from prod-mysql --to production-db --reset --output /tmp/import-summary.md
      `);
      process.exit(0);
    } else {
      i += 1;
    }
  }

  return options;
}

/**
 * Load last imported IDs from tracking file
 */
function loadLastImportIds(): LastImportIds | null {
  if (!fs.existsSync(TRACKING_FILE)) {
    return null;
  }

  try {
    const data = fs.readFileSync(TRACKING_FILE, 'utf-8');
    return JSON.parse(data) as LastImportIds;
  } catch (error) {
    console.warn('Failed to load tracking file, starting fresh');
    return null;
  }
}

/**
 * Save last imported IDs to tracking file
 */
function saveLastImportIds(ids: LastImportIds): void {
  fs.writeFileSync(TRACKING_FILE, JSON.stringify(ids, null, 2));
}

/**
 * Get the maximum ID from MySQL for a table
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function getMaxId(connection: mysql.Connection, table: string): Promise<number> {
  const [rows] = await connection.query<mysql.RowDataPacket[]>(
    `SELECT MAX(id) as maxId FROM ${table} WHERE deleted = 'n'`,
  );
  return rows[0]?.maxId || 0;
}

/**
 * Check if there are any new records to import
 */
async function getNewRecordCounts(
  connection: mysql.Connection,
  lastIds: LastImportIds,
): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};

  // Count new records for each collection
  const tables = [
    { key: 'music', table: 'music' },
    { key: 'concerts', table: 'concerts' },
    { key: 'posts', table: 'stories' },
    { key: 'ondemand', table: 'ondemand' },
    { key: 'cdotw', table: 'cdotw' },
    { key: 'ads', table: 'ads' },
    { key: 'schedule', table: 'schedule' },
  ];

  for (const { key, table } of tables) {
    const lastId = lastIds[key as keyof LastImportIds] as number;
    // cdotw and ondemand use 'no'/'yes'; other tables use 'n'/'y'.
    const [rows] = await connection.query<mysql.RowDataPacket[]>(
      `SELECT COUNT(*) as count FROM ${table} WHERE deleted NOT IN ('y', 'yes') AND id > ?`,
      [lastId],
    );
    counts[key] = rows[0]?.count || 0;
  }

  // DJs don't have deleted column
  const lastDjId = lastIds.djs;
  const [djRows] = await connection.query<mysql.RowDataPacket[]>(
    'SELECT COUNT(*) as count FROM deejays WHERE id > ?',
    [lastDjId],
  );
  counts.djs = djRows[0]?.count || 0;

  return counts;
}

/**
 * Run an import script and capture output
 */
function runImportScript(
  script: string,
  from: MySQLSource,
  to: PostgresTarget,
  startId: number,
  verbose: boolean,
  extraArgs?: string[],
): Promise<ImportResult> {
  return new Promise((resolve) => {
    // Pass --to directly to individual import scripts
    // Use preload fix for @next/env ESM/CJS interop issue with Payload
    const args = [
      '--import',
      './bin/preload-nextenv-fix.mjs',
      '--import',
      'tsx',
      script,
      '--to',
      to,
      '--start-id',
      startId.toString(),
      ...(extraArgs ?? []),
    ];

    // Pass MySQL config as env vars so child scripts' getLegacyDbConfig() picks up
    // the correct connection (prod-mysql vs local-mysql)
    const mysqlConfig = getMySQLConfig(from);
    const env = {
      ...process.env,
      IMPORT_DB_HOST: mysqlConfig.host,
      IMPORT_DB_USER: mysqlConfig.user,
      IMPORT_DB_PASSWORD: mysqlConfig.password,
      IMPORT_DB_NAME: mysqlConfig.database,
      ...(mysqlConfig.port ? { IMPORT_DB_PORT: mysqlConfig.port.toString() } : {}),
    };

    const child = spawn('node', args, { stdio: 'pipe', env });

    let output = '';
    const skipReasons: string[] = [];
    const errorDetails: string[] = [];

    child.stdout?.on('data', (data) => {
      const text = data.toString();
      output += text;

      // Capture skip reasons
      const skipMatches = text.matchAll(/already exists, skipping|skipping/gi);
      for (const match of skipMatches) {
        const line = text.split('\n').find((l) => l.includes(match[0]));
        if (line && !skipReasons.includes(line)) {
          skipReasons.push(line.trim());
        }
      }

      // Capture error details
      const errorMatches = text.matchAll(/\[ERROR\].*|ValidationError.*|Failed to.*/gi);
      for (const match of errorMatches) {
        const line = text.split('\n').find((l) => l.includes(match[0]));
        if (line && !errorDetails.includes(line)) {
          errorDetails.push(line.trim());
        }
      }

      if (verbose) {
        process.stdout.write(data); // Echo to console in verbose mode
      }
    });

    child.stderr?.on('data', (data) => {
      const text = data.toString();

      // Capture meaningful errors from stderr, filtering out noise
      const isNoise = (s: string) => !s
        || s.startsWith('(node:')
        || s.startsWith('(Use `node --trace-warnings')
        || s.startsWith('Warning: SECURITY WARNING')
        || s.startsWith('In the next major version')
        || s.startsWith('To prepare for this change')
        || s.startsWith('- If you want')
        || s.startsWith('See https://node-postgres')
        || s.startsWith('See https://www.postgresql.org')
        || s.includes('[WARN]');

      const lines = text.split('\n').filter((l) => l.trim());
      for (const line of lines) {
        const trimmed = line.trim();
        if (!isNoise(trimmed) && !errorDetails.includes(trimmed)) {
          errorDetails.push(trimmed);
        }
      }

      if (verbose) {
        process.stderr.write(data); // Echo to console in verbose mode
      }
    });

    child.on('close', (code) => {
      // Parse output to extract stats
      const imported = parseInt(output.match(/Success(?:ful)?:\s*(\d+)/)?.[1] || '0', 10);
      const skipped = parseInt(output.match(/Skipped:\s*(\d+)/)?.[1] || '0', 10);
      const errors = parseInt(output.match(/Errors:\s*(\d+)/)?.[1] || '0', 10);

      // Extract max ID from output (scripts should log this)
      const maxIdMatch = output.match(/Highest imported ID:\s*(\d+)/);
      const newMaxId = maxIdMatch ? parseInt(maxIdMatch[1], 10) : startId;

      resolve({
        collection: path.basename(script, '.ts').replace('import', ''),
        script,
        success: code === 0,
        imported,
        skipped,
        errors,
        newMaxId,
        skipReasons: skipReasons.slice(0, 5), // Keep first 5 skip reasons
        errorDetails: errorDetails.slice(0, 10), // Keep first 10 errors
      });
    });
  });
}

/**
 * Main import function
 */
async function main() {
  const options = parseArgs();

  console.log('🚀 Incremental Import Script');
  console.log(`   MySQL Source: ${options.from}`);
  console.log(`   Neon Target:  ${options.to}`);
  console.log(`   Tracking file: ${TRACKING_FILE}`);
  console.log();

  // Load or initialize tracking
  let lastIds: LastImportIds;

  if (options.reset) {
    console.log('⚠️  Reset requested - starting from ID 0 for all collections');
    lastIds = {
      music: 0,
      concerts: 0,
      posts: 0,
      ondemand: 0,
      cdotw: 0,
      ads: 0,
      djs: 0,
      schedule: 0,
      lastUpdated: new Date().toISOString(),
    };
  } else {
    const loaded = loadLastImportIds();
    if (loaded) {
      console.log(`📋 Loaded last import IDs from ${loaded.lastUpdated}`);
      lastIds = loaded;
    } else {
      console.log('📋 No tracking file found - starting fresh');
      lastIds = {
        music: 0,
        concerts: 0,
        posts: 0,
        ondemand: 0,
        cdotw: 0,
        ads: 0,
        djs: 0,
        schedule: 0,
        lastUpdated: new Date().toISOString(),
      };
    }
  }

  console.log();
  console.log('Last imported IDs:');
  console.log(`   Music:      ${lastIds.music}`);
  console.log(`   Concerts:   ${lastIds.concerts}`);
  console.log(`   Posts:      ${lastIds.posts}`);
  console.log(`   On Demand:  ${lastIds.ondemand}`);
  console.log(`   CD of Week: ${lastIds.cdotw}`);
  console.log(`   Ads:        ${lastIds.ads}`);
  console.log(`   DJs:        ${lastIds.djs}`);
  console.log(`   Schedule:   ${lastIds.schedule}`);
  console.log();

  // Connect to MySQL using the new config system
  console.log(`📡 Connecting to MySQL (${options.from})...`);
  const mysqlConfig = getMySQLConfig(options.from);
  const connection = await mysql.createConnection(mysqlConfig);

  // Check for new records
  const newCounts = await getNewRecordCounts(connection, lastIds);
  const totalNew = Object.values(newCounts).reduce((sum, count) => sum + count, 0);

  console.log();
  console.log('📊 New records available:');
  console.log(`   Music:      ${newCounts.music}`);
  console.log(`   Concerts:   ${newCounts.concerts}`);
  console.log(`   Posts:      ${newCounts.posts}`);
  console.log(`   On Demand:  ${newCounts.ondemand}`);
  console.log(`   CD of Week: ${newCounts.cdotw}`);
  console.log(`   Ads:        ${newCounts.ads}`);
  console.log(`   DJs:        ${newCounts.djs}`);
  console.log(`   Schedule:   ${newCounts.schedule}`);
  console.log(`   TOTAL:      ${totalNew}`);
  console.log();

  if (totalNew === 0) {
    console.log('✅ No new records to import!');
    if (options.output) {
      const markdown = generateMarkdownSummary([], 0, 0, 0, options, true);
      fs.writeFileSync(options.output, markdown);
      console.log(`📄 Summary written to: ${options.output}`);
    }
    await connection.end();
    return;
  }

  // Run imports for collections with new records
  const results: ImportResult[] = [];

  const imports = [
    { key: 'music', script: 'bin/migrations/importMusic.ts', count: newCounts.music },
    { key: 'concerts', script: 'bin/migrations/importConcerts.ts', count: newCounts.concerts },
    {
      key: 'posts',
      script: 'bin/migrations/importPosts.ts',
      count: newCounts.posts,
      extraArgs: ['--sync-active'],
    },
    { key: 'ondemand', script: 'bin/migrations/importOnDemand.ts', count: newCounts.ondemand },
    { key: 'cdotw', script: 'bin/migrations/importCdOfTheWeek.ts', count: newCounts.cdotw },
    { key: 'ads', script: 'bin/migrations/importAds.ts', count: newCounts.ads },
    { key: 'djs', script: 'bin/migrations/importDJs.ts', count: newCounts.djs },
    { key: 'schedule', script: 'bin/migrations/importSchedule.ts', count: newCounts.schedule },
  ];

  for (const {
    key, script, count, extraArgs,
  } of imports) {
    // Always run posts with --sync-active even if no new records
    const hasNewRecords = count > 0;
    const hasSyncActive = extraArgs?.includes('--sync-active');

    if (!hasNewRecords && !hasSyncActive) {
      console.log(`⏭️  Skipping ${key} (no new records)`);
    } else {
      const startId = hasNewRecords
        ? (lastIds[key as keyof LastImportIds] as number) + 1
        : undefined;

      console.log();
      console.log('═'.repeat(80));
      if (hasNewRecords && hasSyncActive) {
        console.log(`Running: ${script} (starting from ID ${startId}, + sync-active)`);
      } else if (hasNewRecords) {
        console.log(`Running: ${script} (starting from ID ${startId})`);
      } else {
        console.log(`Running: ${script} (sync-active only, no new records)`);
      }
      console.log('═'.repeat(80));

      const result = await runImportScript(
        script,
        options.from,
        options.to,
        startId ?? (lastIds[key as keyof LastImportIds] as number),
        options.verbose,
        extraArgs,
      );
      results.push(result);

      // Update tracking with new max ID
      const lastId = lastIds[key as keyof LastImportIds];
      if (hasNewRecords && result.success && result.newMaxId > lastId) {
        lastIds[key as keyof LastImportIds] = result.newMaxId as never;
      }

      // Show skip/error details if present
      if (!options.verbose && (result.skipReasons.length > 0 || result.errorDetails.length > 0)) {
        if (result.skipReasons.length > 0) {
          console.log();
          console.log(`⏭️  Sample skip reasons (${result.skipped} total):`);
          result.skipReasons.forEach((reason) => console.log(`   ${reason}`));
        }
        if (result.errorDetails.length > 0) {
          console.log();
          console.log(`❌ Sample errors (${result.errors} total):`);
          result.errorDetails.forEach((error) => console.log(`   ${error}`));
        }
      }
    }
  }

  await connection.end();

  // Update tracking file
  lastIds.lastUpdated = new Date().toISOString();
  saveLastImportIds(lastIds);

  // Print summary
  console.log();
  console.log('═'.repeat(80));
  console.log('📋 Import Summary');
  console.log('═'.repeat(80));
  console.log();

  let totalImported = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (const result of results) {
    const status = result.success ? '✅' : '❌';
    console.log(
      `${status} ${result.collection.padEnd(15)} - Imported: ${result.imported}, Skipped: ${result.skipped}, Errors: ${result.errors}`,
    );

    // Show details for items with skips or errors
    if (result.skipped > 0 || result.errors > 0) {
      if (result.skipReasons.length > 0) {
        console.log('   Skip reasons:');
        result.skipReasons.forEach((reason) => console.log(`     • ${reason}`));
      }
      if (result.errorDetails.length > 0) {
        console.log('   Errors:');
        result.errorDetails.forEach((error) => console.log(`     • ${error}`));
      }
    }

    totalImported += result.imported;
    totalSkipped += result.skipped;
    totalErrors += result.errors;
  }

  console.log();
  console.log(`Total: ${totalImported} imported, ${totalSkipped} skipped, ${totalErrors} errors`);
  console.log();
  console.log(`✅ Tracking updated: ${TRACKING_FILE}`);
  console.log(`   Last updated: ${lastIds.lastUpdated}`);

  // Write markdown summary if --output specified
  if (options.output) {
    const markdown = generateMarkdownSummary(
      results,
      totalImported,
      totalSkipped,
      totalErrors,
      options,
      false,
    );
    fs.writeFileSync(options.output, markdown);
    console.log(`📄 Summary written to: ${options.output}`);
  }
}

// Run if executed directly
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}
