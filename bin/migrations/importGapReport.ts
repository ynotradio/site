#!/usr/bin/env tsx
/**
 * Import Gap Report - Generates a markdown report of unimported records
 *
 * This script compares MySQL source data with Payload CMS to identify
 * records that have not yet been imported. It generates an easy-to-read
 * tabular markdown report for each collection.
 *
 * Usage:
 *   tsx bin/migrations/importGapReport.ts [--from SOURCE] [--output FILE]
 *
 * Options:
 *   --from       MySQL source: 'local-mysql' (default) or 'prod-mysql'
 *   --output     Output file path (default: stdout)
 *   --collection Filter to specific collection (optional)
 *   --limit      Limit number of missing records per collection (default: 50)
 *   --verbose    Show detailed output during analysis
 */

import * as fs from 'fs';
import * as mysql from 'mysql2/promise';
import { getMySQLConfig, parseFromToArgs, type MySQLSource } from '../../config/databases';
import { getPayloadClient, type PostgresTarget } from './shared/payloadClient';
import { createLogger } from './shared/logger';

const logger = createLogger('ImportGapReport');

interface GapReportOptions {
  from: MySQLSource;
  to: PostgresTarget;
  outputFile?: string;
  collection?: string;
  limit: number;
  verbose: boolean;
}

interface MissingRecord {
  id: number;
  identifier: string;
  reason: string;
  details?: string;
}

interface CollectionGap {
  collection: string;
  mysqlTable: string;
  mysqlCount: number;
  payloadCount: number;
  missingCount: number;
  percentage: number;
  missingRecords: MissingRecord[];
}

interface GapReport {
  generatedAt: string;
  mysqlSource: string;
  payloadTarget: string;
  summary: {
    totalMysqlRecords: number;
    totalPayloadRecords: number;
    totalMissing: number;
    overallPercentage: number;
  };
  collections: CollectionGap[];
}

/**
 * Parse command line arguments
 */
function parseArgs(): GapReportOptions {
  const args = process.argv.slice(2);

  // Parse --from/--to arguments
  const fromTo = parseFromToArgs(args);

  const options: GapReportOptions = {
    from: fromTo.from,
    to: fromTo.to,
    limit: 50,
    verbose: false,
  };

  let i = 0;
  while (i < args.length) {
    const arg = args[i];
    if (arg === '--output' || arg === '-o') {
      options.outputFile = args[i + 1];
      i += 2;
    } else if (arg === '--collection' || arg === '-c') {
      options.collection = args[i + 1];
      i += 2;
    } else if (arg === '--limit' || arg === '-l') {
      options.limit = parseInt(args[i + 1], 10);
      i += 2;
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
      i += 1;
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Usage: tsx bin/migrations/importGapReport.ts [options]

Options:
  --from SOURCE       MySQL source: 'local-mysql' (default) or 'prod-mysql'
  --to TARGET         Payload target: 'prod-neon' (default) or 'local-postgres'
  --output, -o FILE   Output file path (default: stdout)
  --collection, -c    Filter to specific collection
  --limit, -l N       Limit missing records per collection (default: 50)
  --verbose, -v       Show detailed output during analysis
  --help, -h          Show this help message

Examples:
  # Generate report to stdout
  tsx bin/migrations/importGapReport.ts --from prod-mysql

  # Save report to file
  tsx bin/migrations/importGapReport.ts --from prod-mysql -o import-gaps.md

  # Focus on specific collection
  tsx bin/migrations/importGapReport.ts --collection posts --limit 100
      `);
      process.exit(0);
    } else {
      i += 1;
    }
  }

  return options;
}

/**
 * Collection configuration for gap analysis
 */
interface CollectionConfig {
  name: string;
  mysqlTable: string;
  payloadCollection: string;
  idField: string;
  identifierField: string;
  deletedFilter?: string;
  legacyIdField: string;
}

const COLLECTIONS: CollectionConfig[] = [
  {
    name: 'Posts (Stories)',
    mysqlTable: 'stories',
    payloadCollection: 'posts',
    idField: 'id',
    identifierField: 'headline',
    deletedFilter: "deleted = 'n'",
    legacyIdField: 'legacyId',
  },
  {
    name: 'Custom Texts',
    mysqlTable: 'custom_texts',
    payloadCollection: 'posts',
    idField: 'id',
    identifierField: 'title',
    deletedFilter: "status = 'active'",
    legacyIdField: 'legacyId',
  },
  {
    name: 'Songs (Music)',
    mysqlTable: 'music',
    payloadCollection: 'songs',
    idField: 'id',
    identifierField: 'song',
    deletedFilter: "deleted = 'n'",
    legacyIdField: 'legacyId',
  },
  {
    name: 'Concerts',
    mysqlTable: 'concerts',
    payloadCollection: 'concerts',
    idField: 'id',
    identifierField: 'artist',
    deletedFilter: "deleted != 'Y'",
    legacyIdField: 'legacyId',
  },
  {
    name: 'On Demand',
    mysqlTable: 'ondemand',
    payloadCollection: 'ondemand',
    idField: 'id',
    identifierField: 'headline',
    deletedFilter: "deleted = 'no'", // Uses 'no'/'yes' not 'n'/'y'
    legacyIdField: 'legacyId',
  },
  {
    name: 'CD of the Week',
    mysqlTable: 'cdotw',
    payloadCollection: 'cdoftheweek',
    idField: 'id',
    identifierField: 'title',
    deletedFilter: "deleted = 'no'", // Uses 'no'/'yes' not 'n'/'y'
    legacyIdField: 'legacyId',
  },
  {
    name: 'Ads (Sponsors)',
    mysqlTable: 'ads',
    payloadCollection: 'ads',
    idField: 'id',
    identifierField: 'name',
    deletedFilter: "deleted = 'n'",
    legacyIdField: 'legacyId',
  },
  {
    name: 'DJs',
    mysqlTable: 'deejays',
    payloadCollection: 'djs',
    idField: 'id',
    identifierField: 'name',
    // DJs table has no deleted column, import all
    legacyIdField: 'legacyId',
  },
];

/**
 * Get all MySQL IDs for a collection
 */
async function getMySQLIds(
  connection: mysql.Connection,
  config: CollectionConfig,
): Promise<Map<number, string>> {
  const whereClause = config.deletedFilter ? `WHERE ${config.deletedFilter}` : '';
  const query = `SELECT ${config.idField} as id, ${config.identifierField} as identifier FROM ${config.mysqlTable} ${whereClause} ORDER BY ${config.idField}`;

  const [rows] = await connection.query<mysql.RowDataPacket[]>(query);

  const result = new Map<number, string>();
  for (const row of rows) {
    // For custom_texts, offset IDs by 10000 to match import logic
    const id = config.mysqlTable === 'custom_texts' ? row.id + 10000 : row.id;
    result.set(id, String(row.identifier || `ID ${row.id}`).substring(0, 80));
  }

  return result;
}

/**
 * Get all imported legacy IDs from Payload
 */
async function getPayloadLegacyIds(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any,
  config: CollectionConfig,
): Promise<Set<number>> {
  const legacyIds = new Set<number>();

  // For custom_texts, we need to filter by legacyId >= 10000
  // For stories, we need to filter by legacyId < 10000
  let whereClause: Record<string, unknown> = {};

  if (config.mysqlTable === 'custom_texts') {
    whereClause = { legacyId: { greater_than_equal: 10000 } };
  } else if (config.mysqlTable === 'stories') {
    whereClause = { legacyId: { less_than: 10000 } };
  }

  // Fetch all legacy IDs in batches
  let page = 1;
  const limit = 500;
  let hasMore = true;

  while (hasMore) {
    const result = await payload.find({
      collection: config.payloadCollection,
      where: whereClause,
      limit,
      page,
      select: {
        legacyId: true,
      },
    });

    for (const doc of result.docs) {
      if (doc.legacyId) {
        legacyIds.add(doc.legacyId);
      }
    }

    hasMore = result.hasNextPage;
    page += 1;
  }

  return legacyIds;
}

/**
 * Analyze gaps for a single collection
 */
async function analyzeCollectionGaps(
  connection: mysql.Connection,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any,
  config: CollectionConfig,
  limit: number,
  verbose: boolean,
): Promise<CollectionGap> {
  if (verbose) {
    logger.info(`Analyzing ${config.name}...`);
  }

  // Get MySQL records
  const mysqlRecords = await getMySQLIds(connection, config);
  const mysqlCount = mysqlRecords.size;

  // Get Payload imported IDs
  const payloadIds = await getPayloadLegacyIds(payload, config);
  const payloadCount = payloadIds.size;

  // Find missing records
  const missingRecords: MissingRecord[] = [];

  const mysqlEntries = Array.from(mysqlRecords.entries());
  for (const [id, identifier] of mysqlEntries) {
    if (!payloadIds.has(id)) {
      missingRecords.push({
        id,
        identifier,
        reason: 'Not imported',
      });

      if (missingRecords.length >= limit) {
        break;
      }
    }
  }

  const missingCount = mysqlCount - payloadCount;
  const percentage = mysqlCount > 0 ? (payloadCount / mysqlCount) * 100 : 100;

  return {
    collection: config.name,
    mysqlTable: config.mysqlTable,
    mysqlCount,
    payloadCount,
    missingCount: Math.max(0, missingCount),
    percentage,
    missingRecords,
  };
}

/**
 * Generate markdown report from gap analysis
 */
function generateMarkdownReport(report: GapReport): string {
  const lines: string[] = [];

  lines.push('# Import Gap Report');
  lines.push('');
  lines.push(`**Generated:** ${report.generatedAt}`);
  lines.push(`**MySQL Source:** ${report.mysqlSource}`);
  lines.push(`**Payload Target:** ${report.payloadTarget}`);
  lines.push('');

  // Summary section
  lines.push('## Summary');
  lines.push('');
  lines.push('| Metric | Value |');
  lines.push('|--------|-------|');
  lines.push(`| Total MySQL Records | ${report.summary.totalMysqlRecords.toLocaleString()} |`);
  lines.push(`| Total Payload Records | ${report.summary.totalPayloadRecords.toLocaleString()} |`);
  lines.push(`| Total Missing | ${report.summary.totalMissing.toLocaleString()} |`);
  lines.push(`| Overall Import Rate | ${report.summary.overallPercentage.toFixed(1)}% |`);
  lines.push('');

  // Collection overview table
  lines.push('## Collection Status');
  lines.push('');
  lines.push('| Collection | MySQL | Payload | Missing | Import Rate |');
  lines.push('|------------|-------|---------|---------|-------------|');

  for (const col of report.collections) {
    let status = '🔴';
    if (col.percentage >= 100) {
      status = '✅';
    } else if (col.percentage >= 90) {
      status = '🟡';
    }
    lines.push(
      `| ${status} ${col.collection} | ${col.mysqlCount.toLocaleString()} | ${col.payloadCount.toLocaleString()} | ${col.missingCount.toLocaleString()} | ${col.percentage.toFixed(1)}% |`,
    );
  }

  lines.push('');

  // Detailed missing records per collection
  for (const col of report.collections) {
    if (col.missingRecords.length > 0) {
      lines.push(`## Missing: ${col.collection}`);
      lines.push('');
      lines.push(
        `*Showing up to ${col.missingRecords.length} of ${col.missingCount} missing records*`,
      );
      lines.push('');
      lines.push('| Legacy ID | Identifier | Reason |');
      lines.push('|-----------|------------|--------|');

      for (const record of col.missingRecords) {
        // Escape pipe characters in identifier
        const safeIdentifier = record.identifier.replace(/\|/g, '\\|').replace(/\n/g, ' ');
        lines.push(`| ${record.id} | ${safeIdentifier} | ${record.reason} |`);
      }

      lines.push('');
    }
  }

  // Footer with action items
  lines.push('## Next Steps');
  lines.push('');
  lines.push('To import missing records, run:');
  lines.push('');
  lines.push('```bash');
  lines.push('# Incremental import (recommended)');
  lines.push('tsx bin/incremental-import.ts --from prod-mysql --to prod-neon --verbose');
  lines.push('');
  lines.push('# Or reset and reimport specific collections');
  lines.push('tsx bin/incremental-import.ts --from prod-mysql --to prod-neon --reset');
  lines.push('```');
  lines.push('');

  return lines.join('\n');
}

/**
 * Main function
 */
async function main(): Promise<void> {
  const options = parseArgs();

  if (options.verbose) {
    logger.info('Import Gap Report Generator');
    logger.info(`MySQL Source: ${options.from}`);
    logger.info(`Payload Target: ${options.to}`);
  }

  // Connect to MySQL
  const mysqlConfig = getMySQLConfig(options.from);
  const connection = await mysql.createConnection(mysqlConfig);

  // Connect to Payload
  const payload = await getPayloadClient(options.to);

  // Filter collections if specified
  let collectionsToAnalyze = COLLECTIONS;
  if (options.collection) {
    const searchTerm = options.collection.toLowerCase();
    collectionsToAnalyze = COLLECTIONS.filter((c) => {
      const nameMatch = c.name.toLowerCase().includes(searchTerm);
      const tableMatch = c.mysqlTable.toLowerCase().includes(searchTerm);
      const collectionMatch = c.payloadCollection.toLowerCase().includes(searchTerm);
      return nameMatch || tableMatch || collectionMatch;
    });

    if (collectionsToAnalyze.length === 0) {
      logger.error(`No collection found matching: ${options.collection}`);
      await connection.end();
      process.exit(1);
    }
  }

  // Analyze each collection
  const collectionGaps: CollectionGap[] = [];

  for (const config of collectionsToAnalyze) {
    const gap = await analyzeCollectionGaps(
      connection,
      payload,
      config,
      options.limit,
      options.verbose,
    );
    collectionGaps.push(gap);
  }

  await connection.end();

  // Calculate summary
  const totalMysqlRecords = collectionGaps.reduce((sum, c) => sum + c.mysqlCount, 0);
  const totalPayloadRecords = collectionGaps.reduce((sum, c) => sum + c.payloadCount, 0);
  const totalMissing = collectionGaps.reduce((sum, c) => sum + c.missingCount, 0);

  let overallPercentage = 100;
  if (totalMysqlRecords > 0) {
    overallPercentage = (totalPayloadRecords / totalMysqlRecords) * 100;
  }

  // Build report
  const report: GapReport = {
    generatedAt: new Date().toISOString(),
    mysqlSource: options.from,
    payloadTarget: options.to,
    summary: {
      totalMysqlRecords,
      totalPayloadRecords,
      totalMissing,
      overallPercentage,
    },
    collections: collectionGaps,
  };

  // Generate markdown
  const markdown = generateMarkdownReport(report);

  // Output
  if (options.outputFile) {
    fs.writeFileSync(options.outputFile, markdown);
    logger.info(`Report written to: ${options.outputFile}`);
  } else {
    console.log(markdown);
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

export {
  main as generateImportGapReport,
  parseArgs,
  analyzeCollectionGaps,
  generateMarkdownReport,
  type GapReport,
  type CollectionGap,
  type MissingRecord,
};
