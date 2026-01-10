#!/usr/bin/env tsx
/**
 * Quick import script to run all migrations with last N months of data or all data
 * 
 * Usage:
 *   tsx bin/quick-import.ts [--env dev|prod] [--months 3] [--all]
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
import { dbConfig } from './migrations/config';

interface ImportOptions {
  env: 'dev' | 'prod';
  months: number;
  all: boolean;
}

interface TableDateInfo {
  table: string;
  dateColumn: string;
  minId: number | null;
}

/**
 * Parse command line arguments
 */
function parseArgs(): ImportOptions {
  const args = process.argv.slice(2);
  const options: ImportOptions = {
    env: 'dev',
    months: 3,
    all: false,
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];

    if (arg === '--env') {
      const envValue = args[i + 1];
      if (envValue !== 'dev' && envValue !== 'prod') {
        throw new Error('--env must be either "dev" or "prod"');
      }
      options.env = envValue;
      i += 1;
    } else if (arg === '--months') {
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
  --env ENV        Environment to import to: 'dev' (default) or 'prod'
  --months NUM     Number of months back to import (default: 3, ignored if --all is set)
  --all            Import all data regardless of date
  --help, -h       Show this help message

Examples:
  tsx bin/quick-import.ts
  tsx bin/quick-import.ts --env dev --months 6
  tsx bin/quick-import.ts --env prod --all
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
 * Run an import script
 */
function runImportScript(
  script: string,
  env: string,
  startId?: number,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const args = ['bin/migrations/' + script, '--env', env];
    if (startId !== undefined) {
      args.push('--start-id', startId.toString());
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`Running: tsx ${args.join(' ')}`);
    console.log('='.repeat(60));

    const child = spawn('tsx', args, {
      stdio: 'inherit',
      cwd: process.cwd(),
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Script ${script} exited with code ${code}`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Main function
 */
async function main() {
  const options = parseArgs();
  
  console.log('🚀 Quick Import Script');
  console.log(`   Environment: ${options.env}`);
  if (options.all) {
    console.log(`   Date range: All data\n`);
  } else {
    console.log(`   Date range: Last ${options.months} months\n`);
  }

  // Connect to MySQL
  console.log('📡 Connecting to MySQL...');
  const connection = await mysql.createConnection(dbConfig);
  
  try {
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
      console.log('\n📊 Importing all data (no date filtering)...\n');
      // Set minId to 1 for all tables to import everything
      for (const tableInfo of dateTables) {
        tableInfo.minId = 1;
        console.log(`   ${tableInfo.table.padEnd(15)} → All records`);
      }
    } else {
      console.log(`\n📊 Finding minimum IDs for last ${options.months} months...\n`);
      
      for (const tableInfo of dateTables) {
        const minId = await getMinIdForDateRange(
          connection,
          tableInfo.table,
          tableInfo.dateColumn,
          options.months,
        );
        tableInfo.minId = minId;
        
        if (minId !== null) {
          console.log(`   ${tableInfo.table.padEnd(15)} → Start from ID ${minId}`);
        } else {
          console.log(`   ${tableInfo.table.padEnd(15)} → No records found (will skip)`);
        }
      }
    }

    await connection.end();

    // Run import scripts in order
    console.log('\n🔄 Running import scripts...\n');

    // 1. Import Music (artists, records, songs) - with date filter
    const musicInfo = dateTables.find(t => t.table === 'music');
    if (musicInfo?.minId) {
      console.log(`📀 Importing music data (from ID ${musicInfo.minId})...`);
      await runImportScript('importMusic.ts', options.env, musicInfo.minId);
    } else {
      console.log('⏭️  Skipping music (no records in date range)');
    }

    // 2. Import DJs - no date filter
    console.log('\n👥 Importing DJs (all records)...');
    await runImportScript('importDJs.ts', options.env);

    // 3. Import Concerts - with date filter
    const concertsInfo = dateTables.find(t => t.table === 'concerts');
    if (concertsInfo?.minId) {
      console.log(`\n🎤 Importing concerts (from ID ${concertsInfo.minId})...`);
      await runImportScript('importConcerts.ts', options.env, concertsInfo.minId);
    } else {
      console.log('\n⏭️  Skipping concerts (no records in date range)');
    }

    // 4. Import Posts - with date filter
    const postsInfo = dateTables.find(t => t.table === 'stories');
    if (postsInfo?.minId) {
      console.log(`\n📰 Importing posts (from ID ${postsInfo.minId})...`);
      await runImportScript('importPosts.ts', options.env, postsInfo.minId);
    } else {
      console.log('\n⏭️  Skipping posts (no records in date range)');
    }

    // 5. Import OnDemand - with date filter
    const onDemandInfo = dateTables.find(t => t.table === 'ondemand');
    if (onDemandInfo?.minId) {
      console.log(`\n🎧 Importing on-demand (from ID ${onDemandInfo.minId})...`);
      await runImportScript('importOnDemand.ts', options.env, onDemandInfo.minId);
    } else {
      console.log('\n⏭️  Skipping on-demand (no records in date range)');
    }

    // 6. Import CD of the Week - with date filter
    const cdotwInfo = dateTables.find(t => t.table === 'cdotw');
    if (cdotwInfo?.minId) {
      console.log(`\n💿 Importing CD of the Week (from ID ${cdotwInfo.minId})...`);
      await runImportScript('importCdOfTheWeek.ts', options.env, cdotwInfo.minId);
    } else {
      console.log('\n⏭️  Skipping CD of the Week (no records in date range)');
    }

    // 7. Import Ads - with date filter
    const adsInfo = dateTables.find(t => t.table === 'ads');
    if (adsInfo?.minId) {
      console.log(`\n📢 Importing ads (from ID ${adsInfo.minId})...`);
      await runImportScript('importAds.ts', options.env, adsInfo.minId);
    } else {
      console.log('\n⏭️  Skipping ads (no records in date range)');
    }

    // 8. Import Schedule (shows) - no date filter
    console.log('\n📅 Importing schedule (all records)...');
    await runImportScript('importSchedule.ts', options.env);

    console.log('\n' + '='.repeat(60));
    console.log('✅ All imports completed successfully!');
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('\n❌ Import failed:', error);
    process.exit(1);
  }
}

// Run the script
main();
