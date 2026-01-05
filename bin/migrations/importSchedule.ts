#!/usr/bin/env tsx
/**
 * Import schedule (shows) from MySQL to Payload CMS PostgreSQL database
 *
 * This script imports show schedule entries from the MySQL 'schedule' table
 * and links them to DJ records.
 *
 * Usage:
 *   tsx bin/migrations/importSchedule.ts --env dev --start-id 100
 *
 * Options:
 *   --env       Environment to import to: 'dev' (default) or 'prod'
 *   --start-id  Optional ID to start import from (for incremental imports)
 */

import type { Payload } from 'payload';
import * as mysql from 'mysql2/promise';
import { connectToDatabase } from './database';
import { getPayloadClient } from './shared/payloadClient';
import { createLogger, logProgress, logSummary } from './shared/logger';
import type { DatabaseEnv } from './shared/payloadClient';

const logger = createLogger('ScheduleImport');

interface Schedule {
  id: number;
  date: string;
  day: string;
  start_time: string;
  end_time: string;
  host: string;
  note: string;
  deleted: string;
}

interface ImportStats {
  total: number;
  success: number;
  skipped: number;
  errors: number;
}

interface ImportOptions {
  env: DatabaseEnv;
  startId?: number;
}

/**
 * Parse command line arguments
 */
function parseArgs(): ImportOptions {
  const args = process.argv.slice(2);
  const options: ImportOptions = {
    env: 'dev',
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
    } else if (arg === '--start-id') {
      const startId = parseInt(args[i + 1], 10);
      if (Number.isNaN(startId) || startId < 0) {
        throw new Error('--start-id must be a positive number');
      }
      options.startId = startId;
      i += 1;
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Usage: tsx bin/migrations/importSchedule.ts [options]

Options:
  --env ENV        Environment to import to: 'dev' (default) or 'prod'
  --start-id ID    Optional ID to start import from (for incremental imports)
  --help, -h       Show this help message

Examples:
  tsx bin/migrations/importSchedule.ts --env dev
  tsx bin/migrations/importSchedule.ts --env prod --start-id 1000
      `);
      process.exit(0);
    }
  }

  return options;
}

/**
 * Fetch active schedule records from MySQL
 */
async function getActiveSchedule(
  connection: mysql.Connection,
  options: { startId?: number } = {},
): Promise<Schedule[]> {
  try {
    let query = "SELECT * FROM schedule WHERE deleted = 'n'";
    const params: any[] = [];

    if (options.startId) {
      query += ' AND id >= ?';
      params.push(options.startId);
    }

    query += ' ORDER BY id ASC';

    const [rows] = await connection.query<mysql.RowDataPacket[]>(query, params);

    let filterMsg = '';
    if (options.startId) filterMsg += ` startId=${options.startId}`;

    console.log(
      `Retrieved ${rows.length} schedule records from the database.${filterMsg ? ` Filters:${filterMsg}` : ''}`,
    );
    return rows as Schedule[];
  } catch (error) {
    console.error('Query failed:', error);
    throw error;
  }
}

/**
 * Check if a show with the given legacy ID already exists
 */
async function showExists(payload: Payload, legacyId: number): Promise<boolean> {
  const existing = await payload.find({
    collection: 'shows',
    where: {
      legacyId: {
        equals: legacyId,
      },
    },
    limit: 1,
  });

  return existing.docs.length > 0;
}

/**
 * Find DJ by name (from host field)
 */
async function findDJByName(payload: Payload, hostName: string): Promise<string | null> {
  try {
    // First, find person with matching name
    const people = await payload.find({
      collection: 'people',
      where: {
        name: {
          equals: hostName,
        },
      },
      limit: 1,
    });

    if (people.docs.length === 0) {
      return null;
    }

    const personId = people.docs[0].id;

    // Find DJ record that references this person
    const djs = await payload.find({
      collection: 'djs',
      where: {
        person: {
          equals: personId,
        },
      },
      limit: 1,
    });

    if (djs.docs.length === 0) {
      return null;
    }

    return djs.docs[0].id as string;
  } catch (error) {
    logger.error(`Failed to find DJ for host ${hostName}`, error as Error);
    return null;
  }
}

/**
 * Import a single schedule record
 */
async function importSchedule(payload: Payload, schedule: Schedule): Promise<boolean> {
  try {
    // Check if already imported
    if (await showExists(payload, schedule.id)) {
      logger.debug(`Show ${schedule.id} already exists, skipping`);
      return false;
    }

    // Find DJ by host name (optional - some shows may not have a DJ link)
    let djId: string | number | null = null;
    let showName: string | undefined;

    if (schedule.host) {
      djId = await findDJByName(payload, schedule.host);
      if (!djId) {
        // If we can't find a DJ record, store the host name as the show name
        showName = schedule.host;
        logger.warn(`Could not find DJ for host: ${schedule.host} (show ${schedule.id}) - storing as show name`);
      }
    }

    // Create show record
    await payload.create({
      collection: 'shows',
      data: {
        date: schedule.date,
        startTime: schedule.start_time,
        endTime: schedule.end_time,
        host: djId ? (djId as any) : undefined,
        name: showName,
        note: schedule.note || undefined,
        legacyId: schedule.id,
        migratedAt: new Date().toISOString(),
      },
    });

    logger.debug(
      `Imported show ${schedule.id}: ${schedule.day} ${schedule.start_time}-${schedule.end_time} (${schedule.host || 'no host'})`,
    );
    return true;
  } catch (error) {
    logger.error(`Failed to import show ${schedule.id}`, error as Error);
    return false;
  }
}

/**
 * Main import function
 */
async function importAllSchedule(options: ImportOptions): Promise<void> {
  logger.info('Starting schedule import...');
  logger.info(`Environment: ${options.env}`);
  if (options.startId) {
    logger.info(`Starting from ID: ${options.startId}`);
  }

  const stats: ImportStats = {
    total: 0,
    success: 0,
    skipped: 0,
    errors: 0,
  };

  let mysqlConnection;
  let payload;

  try {
    // Connect to MySQL (source)
    logger.info('Connecting to MySQL database...');
    mysqlConnection = await connectToDatabase();

    // Connect to Payload (destination)
    payload = await getPayloadClient(options.env);

    // Fetch schedule from MySQL
    logger.info('Fetching schedule records from MySQL...');
    const scheduleRecords = await getActiveSchedule(mysqlConnection, {
      startId: options.startId,
    });

    stats.total = scheduleRecords.length;
    logger.info(`Found ${stats.total} schedule records to import`);

    // Import each show
    for (let i = 0; i < scheduleRecords.length; i += 1) {
      const schedule = scheduleRecords[i];

      const imported = await importSchedule(payload, schedule);

      if (imported) {
        stats.success += 1;
      } else {
        stats.skipped += 1;
      }

      // Log progress every 100 records (larger dataset)
      if ((i + 1) % 100 === 0 || i === scheduleRecords.length - 1) {
        logProgress(i + 1, scheduleRecords.length, `Show ${schedule.id}`);
      }
    }
  } catch (error) {
    logger.error('Import failed', error as Error);
    throw error;
  } finally {
    // Close MySQL connection
    if (mysqlConnection) {
      await mysqlConnection.end();
      logger.info('MySQL connection closed');
    }
  }

  // Log summary
  logSummary(stats);
  logger.info('Schedule import completed');
}

/**
 * Check if this file is being run directly
 */
function isMainModule(): boolean {
  if (typeof import.meta !== 'undefined' && import.meta.url) {
    return import.meta.url === `file://${process.argv[1]}`;
  }
  return require.main === module;
}

// Run the import when executed directly
if (isMainModule()) {
  const options = parseArgs();
  importAllSchedule(options).catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export {
  importAllSchedule, parseArgs, importSchedule, getActiveSchedule,
};
