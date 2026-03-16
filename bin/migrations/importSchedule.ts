#!/usr/bin/env tsx
/**
 * Import schedule (shows) from MySQL to Payload CMS PostgreSQL database
 *
 * This script imports show schedule entries from the MySQL 'schedule' table
 * and links them to DJ records.
 *
 * Usage:
 *   tsx bin/migrations/importSchedule.ts --to prod-neon --start-id 100
 *
 * Options:
 *   --to        Target database: 'prod-neon' (default) or 'local-postgres'
 *   --start-id  Optional ID to start import from (for incremental imports)
 */

import type { Payload } from 'payload';
import * as mysql from 'mysql2/promise';
import { connectToDatabase } from './database';
import { getPayloadClient, findDJByDisplayName } from './shared/payloadClient';
import { createLogger, logProgress, logSummary } from './shared/logger';
import { convertTextToLexical, stripHtmlTags } from './shared/importUtils';
import type { PostgresTarget } from './shared/payloadClient';

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
  to: PostgresTarget;
  startId?: number;
  startDate?: string;
}

/**
 * Parse command line arguments
 */
function parseArgs(): ImportOptions {
  const args = process.argv.slice(2);
  const options: ImportOptions = {
    to: 'prod-neon',
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];

    if (arg === '--to') {
      const toValue = args[i + 1];
      if (toValue !== 'prod-neon' && toValue !== 'local-postgres') {
        throw new Error('--to must be "prod-neon" or "local-postgres"');
      }
      options.to = toValue;
      i += 1;
    } else if (arg === '--start-id') {
      const startId = parseInt(args[i + 1], 10);
      if (Number.isNaN(startId) || startId < 0) {
        throw new Error('--start-id must be a positive number');
      }
      options.startId = startId;
      i += 1;
    } else if (arg === '--start-date') {
      const startDate = args[i + 1];
      // Validate date format YYYY-MM-DD
      if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
        throw new Error('--start-date must be in YYYY-MM-DD format');
      }
      options.startDate = startDate;
      i += 1;
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Usage: tsx bin/migrations/importSchedule.ts [options]

Options:
  --env ENV            Environment to import to: 'dev' (default) or 'prod'
  --start-id ID        Optional ID to start import from (for incremental imports)
  --start-date DATE    Optional date to start import from (YYYY-MM-DD format)
  --help, -h           Show this help message

Examples:
  tsx bin/migrations/importSchedule.ts --to prod-neon
  tsx bin/migrations/importSchedule.ts --to local-postgres --start-id 1000
  tsx bin/migrations/importSchedule.ts --to prod-neon --start-date 2025-12-01
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
  options: { startId?: number; startDate?: string } = {},
): Promise<Schedule[]> {
  try {
    let query = "SELECT * FROM schedule WHERE deleted = 'n'";
    const params: any[] = [];

    if (options.startId) {
      query += ' AND id >= ?';
      params.push(options.startId);
    }

    if (options.startDate) {
      query += ' AND date >= ?';
      params.push(options.startDate);
    }

    query += ' ORDER BY id ASC';

    const [rows] = await connection.query<mysql.RowDataPacket[]>(query, params);

    let filterMsg = '';
    if (options.startId) filterMsg += ` startId=${options.startId}`;
    if (options.startDate) filterMsg += ` startDate=${options.startDate}`;

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
 * Parse host string to extract show name and DJ name
 * Examples:
 *   "<i>Transmission</i> w/ Rob Huff" -> { showName: "Transmission", djName: "Rob Huff" }
 *   "John Q." -> { showName: undefined, djName: "John Q." }
 *   "<i>Y-Not on Shuffle</i>" -> { showName: "Y-Not on Shuffle", djName: undefined }
 */
export interface ParsedHost {
  showName?: string;
  djName?: string;
}

export function parseHostString(host: string): ParsedHost {
  // Strip HTML tags first for easier parsing
  const cleanHost = stripHtmlTags(host).trim();

  // Common patterns for "with" in show names
  // Match: "Show Name w/ DJ Name" or "Show Name with DJ Name"
  const withPatterns = [/^(.+?)\s+w\/\s*(.+)$/i, /^(.+?)\s+with\s+(.+)$/i];

  for (const pattern of withPatterns) {
    const match = cleanHost.match(pattern);
    if (match) {
      return {
        showName: match[1].trim(),
        djName: match[2].trim(),
      };
    }
  }

  // Check if the original host has HTML formatting (suggesting it's a show name, not a DJ name)
  // e.g., <i>Y-Not on Shuffle</i> or <b>Artist Name</b>
  const hasFormatting = /<[ib]>/i.test(host);
  if (hasFormatting) {
    return {
      showName: cleanHost,
      djName: undefined,
    };
  }

  // No "w/" pattern and no formatting - assume it's a DJ name
  return {
    showName: undefined,
    djName: cleanHost,
  };
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
 * Import a single schedule record
 */
async function importSchedule(
  payload: Payload,
  schedule: Schedule,
): Promise<'imported' | 'skipped' | 'error'> {
  try {
    // Check if already imported
    if (await showExists(payload, schedule.id)) {
      logger.debug(`Show ${schedule.id} already exists, skipping`);
      return 'skipped';
    }

    // Parse the host field to extract show name and DJ name
    let djId: number | null = null;
    let showName: string | undefined;

    if (schedule.host) {
      const parsed = parseHostString(schedule.host);

      // Always set the show name if parsed
      showName = parsed.showName;

      // Try to find DJ by display name
      if (parsed.djName) {
        djId = await findDJByDisplayName(payload, parsed.djName);
        if (!djId) {
          // If we can't find the DJ, include the DJ name in the show name
          if (showName) {
            showName = `${showName} w/ ${parsed.djName}`;
          } else {
            showName = parsed.djName;
          }
          logger.warn(
            `Could not find DJ: ${parsed.djName} (show ${schedule.id}) - storing as show name`,
          );
        }
      } else if (!showName) {
        // No DJ name and no show name extracted - use the raw host as show name
        showName = stripHtmlTags(schedule.host);
        logger.warn(
          `Could not parse host: ${schedule.host} (show ${schedule.id}) - storing as show name`,
        );
      }
    }

    // Create show record
    await payload.create({
      collection: 'shows',
      data: {
        date: schedule.date,
        startTime: schedule.start_time,
        endTime: schedule.end_time,
        ...(djId ? { host: djId } : {}),
        name: showName,
        ...(schedule.note ? { note: convertTextToLexical(schedule.note) } : {}),
        legacyId: schedule.id,
        migratedAt: new Date().toISOString(),
      },
    });

    logger.debug(
      `Imported show ${schedule.id}: ${schedule.day} ${schedule.start_time}-${schedule.end_time} (${schedule.host || 'no host'})`,
    );
    return 'imported';
  } catch (error) {
    logger.error(`Failed to import show ${schedule.id}`, error as Error);
    return 'error';
  }
}

/**
 * Main import function
 */
async function importAllSchedule(options: ImportOptions): Promise<void> {
  logger.info('Starting schedule import...');
  logger.info(`Target: ${options.to}`);
  if (options.startId) {
    logger.info(`Starting from ID: ${options.startId}`);
  }
  if (options.startDate) {
    logger.info(`Starting from date: ${options.startDate}`);
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
    payload = await getPayloadClient(options.to);

    // Fetch schedule from MySQL
    logger.info('Fetching schedule records from MySQL...');
    const scheduleRecords = await getActiveSchedule(mysqlConnection, {
      startId: options.startId,
      startDate: options.startDate,
    });

    stats.total = scheduleRecords.length;
    logger.info(`Found ${stats.total} schedule records to import`);

    // Import shows in batches for better performance
    const BATCH_SIZE = 50; // Process 50 records concurrently

    for (let i = 0; i < scheduleRecords.length; i += BATCH_SIZE) {
      const batch = scheduleRecords.slice(i, i + BATCH_SIZE);

      // Process batch concurrently
      const results = await Promise.allSettled(
        batch.map((schedule) => importSchedule(payload, schedule)),
      );

      // Count results
      for (const result of results) {
        if (result.status === 'fulfilled') {
          if (result.value === 'imported') {
            stats.success += 1;
          } else if (result.value === 'error') {
            stats.errors += 1;
          } else {
            stats.skipped += 1;
          }
        } else {
          stats.errors += 1;
          logger.error('Batch import error', result.reason);
        }
      }

      // Log progress
      const processed = Math.min(i + BATCH_SIZE, scheduleRecords.length);
      logProgress(processed, scheduleRecords.length, `Show ${batch[batch.length - 1].id}`);
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
  importAllSchedule(options)
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export {
  importAllSchedule, parseArgs, importSchedule, getActiveSchedule,
};
