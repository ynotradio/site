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
 *   --to         Neon target: 'prod-neon' (default) or 'local-postgres'
 *   --reset      Reset tracking and import everything from scratch
 *   --verbose    Show detailed output including skip reasons
 *
 * Legacy (deprecated):
 *   --env        Environment: 'dev' or 'prod' (maps to --from local-mysql/prod-mysql)
 */

import * as fs from 'fs';
import * as path from 'path';
import * as mysql from 'mysql2/promise';
import { spawn } from 'child_process';
import {
  getMySQLConfig,
  parseFromToArgs,
  parseLegacyEnvArg,
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
  lastUpdated: string;
}

interface ImportOptions {
  from: MySQLSource;
  to: PostgresTarget;
  reset: boolean;
  verbose: boolean;
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

/**
 * Parse command line arguments
 */
function parseArgs(): ImportOptions {
  const args = process.argv.slice(2);

  // Check for new --from/--to syntax first
  const hasFromTo = args.includes('--from') || args.includes('--to');
  const hasEnv = args.includes('--env');

  let fromTo: { from: MySQLSource; to: PostgresTarget };

  if (hasFromTo) {
    fromTo = parseFromToArgs(args);
  } else if (hasEnv) {
    // Legacy --env support with deprecation warning
    console.warn('⚠️  Warning: --env flag is deprecated. Use --from/--to instead.');
    console.warn('   Example: --from local-mysql --to prod-neon');
    fromTo = parseLegacyEnvArg(args);
  } else {
    // Defaults
    fromTo = { from: 'local-mysql', to: 'prod-neon' };
  }

  const options: ImportOptions = {
    from: fromTo.from,
    to: fromTo.to,
    reset: false,
    verbose: false,
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--reset') {
      options.reset = true;
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Usage: tsx bin/incremental-import.ts [options]

Options:
  --from SOURCE  MySQL source: 'local-mysql' (default) or 'prod-mysql'
  --to TARGET    Neon target: 'prod-neon' (default) or 'local-postgres'
  --reset        Reset tracking and import all data
  --verbose      Show detailed output including skip reasons
  --help, -h     Show this help message

Examples:
  # Import from local Docker MySQL to production Neon (default)
  tsx bin/incremental-import.ts

  # Import from production MySQL to production Neon
  tsx bin/incremental-import.ts --from prod-mysql --to prod-neon

  # Reset and re-import everything
  tsx bin/incremental-import.ts --from local-mysql --to prod-neon --reset

Legacy (deprecated):
  --env dev   (equivalent to --from local-mysql --to prod-neon)
  --env prod  (equivalent to --from prod-mysql --to prod-neon)
      `);
      process.exit(0);
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
  ];

  for (const { key, table } of tables) {
    const lastId = lastIds[key as keyof LastImportIds] as number;
    const [rows] = await connection.query<mysql.RowDataPacket[]>(
      `SELECT COUNT(*) as count FROM ${table} WHERE deleted = 'n' AND id > ?`,
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
): Promise<ImportResult> {
  return new Promise((resolve) => {
    // TODO: Update individual import scripts to use --from/--to natively
    // then remove this legacy conversion. Currently the individual scripts
    // still use --env dev|prod, so we convert here for backward compatibility.
    // Tracked in: https://github.com/ynotradio/site/issues - Future work
    const legacyEnv = from === 'prod-mysql' ? 'prod' : 'dev';
    const args = ['tsx', script, '--env', legacyEnv, '--start-id', startId.toString()];
    const child = spawn('yarn', args, { stdio: 'pipe' });

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

      // Capture errors from stderr too
      const lines = text.split('\n').filter((l) => l.trim());
      for (const line of lines) {
        if (line && !errorDetails.includes(line)) {
          errorDetails.push(line.trim());
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
  console.log(`   TOTAL:      ${totalNew}`);
  console.log();

  if (totalNew === 0) {
    console.log('✅ No new records to import!');
    await connection.end();
    return;
  }

  // Run imports for collections with new records
  const results: ImportResult[] = [];

  const imports = [
    { key: 'music', script: 'bin/migrations/importMusic.ts', count: newCounts.music },
    { key: 'concerts', script: 'bin/migrations/importConcerts.ts', count: newCounts.concerts },
    { key: 'posts', script: 'bin/migrations/importPosts.ts', count: newCounts.posts },
    { key: 'ondemand', script: 'bin/migrations/importOnDemand.ts', count: newCounts.ondemand },
    { key: 'cdotw', script: 'bin/migrations/importCdotw.ts', count: newCounts.cdotw },
    { key: 'ads', script: 'bin/migrations/importAds.ts', count: newCounts.ads },
    { key: 'djs', script: 'bin/migrations/importDJs.ts', count: newCounts.djs },
  ];

  for (const { key, script, count } of imports) {
    if (count > 0) {
      const startId = (lastIds[key as keyof LastImportIds] as number) + 1;
      console.log();
      console.log('═'.repeat(80));
      console.log(`Running: ${script} (starting from ID ${startId})`);
      console.log('═'.repeat(80));

      const result = await runImportScript(
        script,
        options.from,
        options.to,
        startId,
        options.verbose,
      );
      results.push(result);

      // Update tracking with new max ID
      if (result.success && result.newMaxId > lastIds[key as keyof LastImportIds]) {
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
    } else {
      console.log(`⏭️  Skipping ${key} (no new records)`);
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
