#!/usr/bin/env tsx
/**
 * Quick import script to run all migrations with last N months of data or all data
 *
 * Usage:
 *   tsx bin/quick-import.ts [--from SOURCE] [--to TARGET] [--months 3] [--all]
 *
 * This script:
 * 1. Calculates the date N months ago (or imports all if --all flag is set)
 * 2. Queries MySQL to find minimum IDs for each table within that date range
 * 3. Runs all import scripts with --start-id parameters
 *
 * Note: This will import ALL records for DJs (no date field), but filter
 * date-based collections like concerts, posts, on-demand, etc.
 */

import * as mysql from 'mysql2/promise';
import { spawn } from 'child_process';
import {
  getMySQLConfig,
  parseFromToArgs,
  parseLegacyEnvArg,
  type MySQLSource,
  type PostgresTarget,
} from '../config/databases';

interface ImportOptions {
  from: MySQLSource;
  to: PostgresTarget;
  months: number;
  all: boolean;
}

interface TableDateInfo {
  table: string;
  dateColumn: string;
  minId: number | null;
}

interface CollectionCount {
  collection: string;
  totalRecords: number;
  dateRangeRecords: number;
}

interface ImportResult {
  collection: string;
  script: string;
  success: boolean;
  imported: number;
  skipped: number;
  errors: number;
  errorMessages: string[];
}

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
    months: 3,
    all: false,
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];

    if (arg === '--months') {
      const months = parseInt(args[i + 1], 10);
      if (Number.isNaN(months) || months < 1) {
        throw new Error('--months must be a positive number');
      }
      options.months = months;
      i += 1;
    } else if (arg === '--all') {
      options.all = true;
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Usage: tsx bin/quick-import.ts [options]

Options:
  --from SOURCE    MySQL source: 'local-mysql' (default) or 'prod-mysql'
  --to TARGET      Neon target: 'prod-neon' (default) or 'local-postgres'
  --months NUM     Number of months back to import (default: 3, ignored if --all is set)
  --all            Import all data regardless of date
  --help, -h       Show this help message

Examples:
  # Import last 3 months from local Docker MySQL to production Neon
  tsx bin/quick-import.ts

  # Import from production MySQL to production Neon
  tsx bin/quick-import.ts --from prod-mysql --to prod-neon --months 6

  # Import all data
  tsx bin/quick-import.ts --from local-mysql --to prod-neon --all

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
 * Get minimum ID for records within date range
 */
async function getMinIdForDateRange(
  connection: mysql.Connection,
  table: string,
  dateColumn: string,
  monthsBack: number,
): Promise<number | null> {
  try {
    const query = `
      SELECT MIN(id) as min_id 
      FROM ${table} 
      WHERE ${dateColumn} >= DATE_SUB(NOW(), INTERVAL ? MONTH)
    `;

    const [rows] = await connection.query<mysql.RowDataPacket[]>(query, [monthsBack]);

    if (rows.length > 0 && rows[0].min_id !== null) {
      return rows[0].min_id;
    }
    return null;
  } catch (error) {
    console.error(`Error querying ${table}:`, error);
    return null;
  }
}

/**
 * Get expected record counts from MySQL for pre-import report
 */
async function getExpectedCounts(
  connection: mysql.Connection,
  monthsBack: number,
  importAll: boolean,
): Promise<CollectionCount[]> {
  const counts: CollectionCount[] = [];

  // Helper to handle both 'n'/'y' and 'no'/'yes' deleted column values
  const getDeletedCondition = (table: string): string => {
    // Tables using 'no'/'yes': cdotw, deejays, ondemand
    if (['cdotw', 'deejays', 'ondemand'].includes(table)) {
      return "deleted = 'no'";
    }
    // Tables using 'n'/'y': ads, concerts, music, stories, schedule
    return "deleted = 'n'";
  };

  // Query each collection
  const queries = [
    {
      collection: 'Ads',
      query: `
        SELECT COUNT(*) as total,
               SUM(CASE WHEN start_date >= DATE_SUB(NOW(), INTERVAL ? MONTH) THEN 1 ELSE 0 END) as in_range
        FROM ads
        WHERE ${getDeletedCondition('ads')}
      `,
      months: monthsBack,
    },
    {
      collection: 'CD of the Week',
      query: `
        SELECT COUNT(*) as total,
               SUM(CASE WHEN date >= DATE_SUB(NOW(), INTERVAL ? MONTH) THEN 1 ELSE 0 END) as in_range
        FROM cdotw
        WHERE ${getDeletedCondition('cdotw')}
      `,
      months: monthsBack,
    },
    {
      collection: 'Concerts',
      query: `
        SELECT COUNT(*) as total,
               SUM(CASE WHEN date >= DATE_SUB(NOW(), INTERVAL ? MONTH) THEN 1 ELSE 0 END) as in_range
        FROM concerts
        WHERE ${getDeletedCondition('concerts')}
      `,
      months: monthsBack,
    },
    {
      collection: 'DJs',
      query: `
        SELECT COUNT(*) as total, COUNT(*) as in_range
        FROM deejays
        WHERE ${getDeletedCondition('deejays')}
      `,
      months: monthsBack, // Not used but required for consistent interface
    },
    {
      collection: 'Music',
      query: `
        SELECT COUNT(*) as total,
               SUM(CASE WHEN date >= DATE_SUB(NOW(), INTERVAL ? MONTH) THEN 1 ELSE 0 END) as in_range
        FROM music
        WHERE ${getDeletedCondition('music')}
      `,
      months: monthsBack,
    },
    {
      collection: 'On Demand',
      query: `
        SELECT COUNT(*) as total,
               SUM(CASE WHEN date >= DATE_SUB(NOW(), INTERVAL ? MONTH) THEN 1 ELSE 0 END) as in_range
        FROM ondemand
        WHERE ${getDeletedCondition('ondemand')}
      `,
      months: monthsBack,
    },
    {
      collection: 'Posts',
      query: `
        SELECT COUNT(*) as total,
               SUM(CASE WHEN start_date >= DATE_SUB(NOW(), INTERVAL ? MONTH) THEN 1 ELSE 0 END) as in_range
        FROM stories
        WHERE ${getDeletedCondition('stories')}
      `,
      months: monthsBack,
    },
    {
      collection: 'Shows',
      query: `
        SELECT COUNT(*) as total,
               SUM(CASE WHEN start >= DATE_SUB(NOW(), INTERVAL 1 MONTH) THEN 1 ELSE 0 END) as in_range
        FROM schedule
        WHERE ${getDeletedCondition('schedule')}
      `,
      months: 1, // Shows always use 30 days
    },
  ];

  // Query each collection sequentially
  const countPromises = queries.map(async ({ collection, query, months }) => {
    try {
      const [rows] = await connection.query<mysql.RowDataPacket[]>(query, [months]);
      if (rows.length > 0) {
        return {
          collection,
          totalRecords: rows[0].total || 0,
          dateRangeRecords: importAll ? rows[0].total : rows[0].in_range || 0,
        };
      }
    } catch (error) {
      console.error(`Error querying ${collection}:`, error);
    }
    return null;
  });

  const results = await Promise.all(countPromises);
  results.forEach((result) => {
    if (result) {
      counts.push(result);
    }
  });

  return counts;
}

/**
 * Print pre-import report showing expected record counts
 */
function printPreImportReport(
  counts: CollectionCount[],
  importAll: boolean,
  monthsBack: number,
): void {
  console.log('\n📊 Expected Import Counts');
  console.log('─'.repeat(60));
  console.log(
    `${'Collection'.padEnd(20)} ${'Total'.padStart(10)} ${'To Import'.padStart(12)}`,
  );
  console.log('─'.repeat(60));

  let totalRecords = 0;
  let totalToImport = 0;

  counts.forEach((count) => {
    console.log(
      `${count.collection.padEnd(20)} ${count.totalRecords.toString().padStart(10)} ${
        count.dateRangeRecords.toString().padStart(12)
      }`,
    );
    totalRecords += count.totalRecords;
    totalToImport += count.dateRangeRecords;
  });

  console.log('─'.repeat(60));
  console.log(
    `${'TOTAL'.padEnd(20)} ${totalRecords.toString().padStart(10)} ${
      totalToImport.toString().padStart(12)
    }`,
  );
  console.log('─'.repeat(60));

  if (importAll) {
    console.log('Note: Importing ALL records (no date filtering)');
  } else {
    const note = `Note: Importing records from last ${monthsBack} months (30 days for Shows)`;
    console.log(note);
  }
  console.log();
}

/**
 * Run an import script and capture results
 */
function runImportScript(
  script: string,
  collection: string,
  from: MySQLSource,
  to: PostgresTarget,
  startId?: number,
): Promise<ImportResult> {
  // Convert from/to to legacy --env format for individual import scripts
  // Note: Individual import scripts still use --env for now
  const legacyEnv = from === 'prod-mysql' ? 'prod' : 'dev';
  return new Promise((resolve, reject) => {
    const args = [`bin/migrations/${script}`, '--env', legacyEnv];
    if (startId !== undefined) {
      args.push('--start-id', startId.toString());
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`Running: tsx ${args.join(' ')}`);
    console.log('='.repeat(60));

    let stdout = '';
    let stderr = '';

    const child = spawn('tsx', args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      cwd: process.cwd(),
    });

    // Capture stdout and display it
    child.stdout?.on('data', (data) => {
      const text = data.toString();
      process.stdout.write(text);
      stdout += text;
    });

    // Capture stderr and display it
    child.stderr?.on('data', (data) => {
      const text = data.toString();
      process.stderr.write(text);
      stderr += text;
    });

    child.on('close', (code) => {
      // Parse the output to extract results
      const result: ImportResult = {
        collection,
        script,
        success: code === 0,
        imported: 0,
        skipped: 0,
        errors: 0,
        errorMessages: [],
      };

      // Extract summary statistics from output
      const summaryMatch = stdout.match(/Migration Summary[\s\S]*?Successful:\s*(\d+)[\s\S]*?Skipped:\s*(\d+)[\s\S]*?Errors:\s*(\d+)/);
      if (summaryMatch) {
        result.imported = parseInt(summaryMatch[1], 10);
        result.skipped = parseInt(summaryMatch[2], 10);
        result.errors = parseInt(summaryMatch[3], 10);
      }

      // Extract error messages
      const errorPattern = /(?:ERROR|Error:|Failed to)/gi;
      const allOutput = `${stdout}${stderr}`;
      const lines = allOutput.split('\n');
      lines.forEach((line) => {
        if (errorPattern.test(line) && !line.includes('Errors: 0')) {
          result.errorMessages.push(line.trim());
        }
      });

      if (code === 0) {
        resolve(result);
      } else {
        result.errorMessages.push(`Script exited with code ${code}`);
        resolve(result); // Resolve instead of reject to continue with other imports
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Print post-import summary with results and errors
 */
function printPostImportSummary(
  results: ImportResult[],
  expectedCounts: CollectionCount[],
): void {
  console.log('\n📋 Import Results Summary');
  console.log('═'.repeat(80));
  const header = [
    'Collection'.padEnd(20),
    'Expected'.padStart(10),
    'Imported'.padStart(10),
    'Skipped'.padStart(10),
    'Errors'.padStart(10),
    'Status'.padStart(10),
  ].join(' ');
  console.log(header);
  console.log('═'.repeat(80));

  let totalExpected = 0;
  let totalImported = 0;
  let totalSkipped = 0;
  let totalErrors = 0;
  let failedScripts = 0;

  results.forEach((result) => {
    const expectedCount = expectedCounts.find((c) => c.collection === result.collection);
    const expected = expectedCount?.dateRangeRecords || 0;
    const status = result.success ? '✅' : '❌';

    const row = [
      result.collection.padEnd(20),
      expected.toString().padStart(10),
      result.imported.toString().padStart(10),
      result.skipped.toString().padStart(10),
      result.errors.toString().padStart(10),
      status.padStart(10),
    ].join(' ');
    console.log(row);

    totalExpected += expected;
    totalImported += result.imported;
    totalSkipped += result.skipped;
    totalErrors += result.errors;
    if (!result.success) {
      failedScripts += 1;
    }
  });

  console.log('═'.repeat(80));
  const totalRow = [
    'TOTAL'.padEnd(20),
    totalExpected.toString().padStart(10),
    totalImported.toString().padStart(10),
    totalSkipped.toString().padStart(10),
    totalErrors.toString().padStart(10),
  ].join(' ');
  console.log(totalRow);
  console.log('═'.repeat(80));

  // Show error details if any
  const resultsWithErrors = results.filter((r) => r.errorMessages.length > 0);
  if (resultsWithErrors.length > 0) {
    console.log('\n⚠️  Error Details:');
    console.log('─'.repeat(80));
    resultsWithErrors.forEach((result) => {
      if (result.errorMessages.length > 0) {
        console.log(`\n${result.collection}:`);
        const errorSlice = result.errorMessages.slice(0, 5);
        errorSlice.forEach((msg) => {
          console.log(`  • ${msg}`);
        });
        if (result.errorMessages.length > 5) {
          const remaining = result.errorMessages.length - 5;
          console.log(`  ... and ${remaining} more errors`);
        }
      }
    });
    console.log();
  }

  // Final status
  if (failedScripts === 0 && totalErrors === 0) {
    console.log('\n✅ All imports completed successfully!');
  } else if (failedScripts > 0) {
    console.log(`\n⚠️  ${failedScripts} script(s) failed with errors`);
  } else {
    console.log(`\n⚠️  Completed with ${totalErrors} errors across all imports`);
  }
  console.log();
}

/**
 * Main function
 */
async function main() {
  const options = parseArgs();

  console.log('🚀 Quick Import Script');
  console.log(`   MySQL Source: ${options.from}`);
  console.log(`   Neon Target:  ${options.to}`);
  if (options.all) {
    console.log('   Date range: All data\n');
  } else {
    console.log(`   Date range: Last ${options.months} months\n`);
  }

  // Connect to MySQL using new config system
  console.log(`📡 Connecting to MySQL (${options.from})...`);
  const mysqlConfig = getMySQLConfig(options.from);
  const connection = await mysql.createConnection(mysqlConfig);

  try {
    // Get expected counts for pre-import report
    const expectedCounts = await getExpectedCounts(connection, options.months, options.all);
    printPreImportReport(expectedCounts, options.all, options.months);

    // Define tables with date columns
    const dateTables: TableDateInfo[] = [
      { table: 'music', dateColumn: 'date', minId: null },
      { table: 'concerts', dateColumn: 'date', minId: null },
      { table: 'stories', dateColumn: 'start_date', minId: null },
      { table: 'ondemand', dateColumn: 'date', minId: null },
      { table: 'cdotw', dateColumn: 'date', minId: null },
      { table: 'ads', dateColumn: 'start_date', minId: null },
    ];

    // Calculate minimum IDs for each table (skip if --all flag is set)
    if (options.all) {
      console.log('\n📊 Finding starting IDs (importing all data)...\n');
      // Set minId to 1 for all tables to import everything
      dateTables.forEach((tableInfo) => {
        // eslint-disable-next-line no-param-reassign
        tableInfo.minId = 1;
        console.log(`   ${tableInfo.table.padEnd(15)} → Start from ID 1`);
      });
    } else {
      console.log(`\n📊 Finding starting IDs for last ${options.months} months...\n`);

      const minIdPromises = dateTables.map(async (tableInfo) => {
        const minId = await getMinIdForDateRange(
          connection,
          tableInfo.table,
          tableInfo.dateColumn,
          options.months,
        );
        // eslint-disable-next-line no-param-reassign
        tableInfo.minId = minId;

        if (minId !== null) {
          console.log(`   ${tableInfo.table.padEnd(15)} → Start from ID ${minId}`);
        } else {
          console.log(`   ${tableInfo.table.padEnd(15)} → No records found (will skip)`);
        }
      });

      await Promise.all(minIdPromises);
    }

    await connection.end();

    // Track results
    const results: ImportResult[] = [];

    // Run import scripts in order
    console.log('\n🔄 Running import scripts...\n');

    // 1. Import Music (artists, records, songs) - with date filter
    const musicInfo = dateTables.find((t) => t.table === 'music');
    if (musicInfo?.minId) {
      console.log(`📀 Importing music data (from ID ${musicInfo.minId})...`);
      results.push(await runImportScript('importMusic.ts', 'Music', options.from, options.to, musicInfo.minId));
    } else {
      console.log('⏭️  Skipping music (no records in date range)');
    }

    // 2. Import DJs - no date filter
    console.log('\n👥 Importing DJs (all records)...');
    results.push(await runImportScript('importDJs.ts', 'DJs', options.from, options.to));

    // 3. Import Concerts - with date filter
    const concertsInfo = dateTables.find((t) => t.table === 'concerts');
    if (concertsInfo?.minId) {
      console.log(`\n🎤 Importing concerts (from ID ${concertsInfo.minId})...`);
      results.push(await runImportScript('importConcerts.ts', 'Concerts', options.from, options.to, concertsInfo.minId));
    } else {
      console.log('\n⏭️  Skipping concerts (no records in date range)');
    }

    // 4. Import Posts - with date filter
    const postsInfo = dateTables.find((t) => t.table === 'stories');
    if (postsInfo?.minId) {
      console.log(`\n📰 Importing posts (from ID ${postsInfo.minId})...`);
      results.push(await runImportScript('importPosts.ts', 'Posts', options.from, options.to, postsInfo.minId));
    } else {
      console.log('\n⏭️  Skipping posts (no records in date range)');
    }

    // 5. Import OnDemand - with date filter
    const onDemandInfo = dateTables.find((t) => t.table === 'ondemand');
    if (onDemandInfo?.minId) {
      console.log(`\n🎧 Importing on-demand (from ID ${onDemandInfo.minId})...`);
      results.push(await runImportScript('importOnDemand.ts', 'On Demand', options.from, options.to, onDemandInfo.minId));
    } else {
      console.log('\n⏭️  Skipping on-demand (no records in date range)');
    }

    // 6. Import CD of the Week - with date filter
    const cdotwInfo = dateTables.find((t) => t.table === 'cdotw');
    if (cdotwInfo?.minId) {
      console.log(`\n💿 Importing CD of the Week (from ID ${cdotwInfo.minId})...`);
      results.push(await runImportScript('importCdOfTheWeek.ts', 'CD of the Week', options.from, options.to, cdotwInfo.minId));
    } else {
      console.log('\n⏭️  Skipping CD of the Week (no records in date range)');
    }

    // 7. Import Ads - with date filter
    const adsInfo = dateTables.find((t) => t.table === 'ads');
    if (adsInfo?.minId) {
      console.log(`\n📢 Importing ads (from ID ${adsInfo.minId})...`);
      results.push(await runImportScript('importAds.ts', 'Ads', options.from, options.to, adsInfo.minId));
    } else {
      console.log('\n⏭️  Skipping ads (no records in date range)');
    }

    // 8. Import Schedule (shows) - no date filter
    console.log('\n📅 Importing schedule (all records)...');
    results.push(await runImportScript('importSchedule.ts', 'Shows', options.from, options.to));

    // Print final summary
    console.log(`\n${'='.repeat(60)}`);
    printPostImportSummary(results, expectedCounts);
    console.log(`${'='.repeat(60)}\n`);
  } catch (error) {
    console.error('\n❌ Import failed:', error);
    process.exit(1);
  }
}

// Run the script
main();
