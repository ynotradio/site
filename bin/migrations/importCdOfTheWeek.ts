/**
 * Migration script for importing CD of the Week reviews from MySQL to Sanity
 *
 * MySQL Schema:
 *   cdotw: id, artist, title, label, review, cd_pic_url, band (artist URL), reviewer, date, deleted
 *
 * Usage: npm run import:cdotw
 */

import { createClient } from '@sanity/client';
import * as mysql from 'mysql2/promise';
import { dbConfig, sanityConfig, migrationConfig } from './config';
import {
  createLogger,
  logSummary,
  logProgress,
} from './shared/logger';
import {
  createUpsertHandler,
  generateDocumentId,
  createSlug,
  DocumentWithLegacyId,
} from './shared/upsert';
import {
  createImageUploader,
  fixImagePath,
} from './shared/imageUploader';
import {
  validateRequired,
  validateUrl,
  validateDate,
  mergeResults,
  logValidationErrors,
  ValidationResult,
} from './shared/validation';
import { htmlToPortableText } from './shared/richTextConverter';

const logger = createLogger('ImportCdOfTheWeek');

// CD of the Week interface matching the MySQL table structure
interface CdOfTheWeek {
  id: number;
  artist: string;
  title: string;
  label: string | null;
  review: string | null;
  cd_pic_url: string | null;
  band: string | null; // This is the artist URL
  reviewer: string | null;
  date: string | null;
  deleted: string;
}

/**
 * Connect to the MySQL database
 */
async function connectToDatabase(): Promise<mysql.Connection> {
  try {
    const connection = await mysql.createConnection({
      host: dbConfig.host,
      database: dbConfig.database,
      user: dbConfig.user,
      password: dbConfig.password,
    });
    logger.info('Connected to database successfully.');
    return connection;
  } catch (error) {
    logger.error('Database connection failed:', error as Error);
    throw error;
  }
}

/**
 * Get active CD of the Week records from the database (excluding soft-deleted records)
 */
async function getActiveCdOfTheWeek(connection: mysql.Connection): Promise<CdOfTheWeek[]> {
  try {
    const [rows] = await connection.query<mysql.RowDataPacket[]>(
      "SELECT * FROM cdotw WHERE deleted NOT IN ('yes', 'Yes', 'YES', 'y', 'Y') ORDER BY date DESC",
    );
    logger.info(`Retrieved ${rows.length} CD of the Week records from the database.`);
    return rows as CdOfTheWeek[];
  } catch (error) {
    logger.error('Query failed:', error as Error);
    throw error;
  }
}

/**
 * Validate a CD of the Week record
 */
function validateCdOfTheWeek(cd: CdOfTheWeek): ValidationResult {
  return mergeResults(
    validateRequired(cd.artist, 'artist'),
    validateRequired(cd.title, 'title'),
    validateRequired(cd.date, 'date'),
    validateUrl(cd.band, 'band (artistUrl)'),
    validateUrl(cd.cd_pic_url, 'cd_pic_url'),
    validateDate(cd.date, 'date'),
  );
}

/**
 * Format a date string for Sanity (YYYY-MM-DD format)
 */
function formatDate(dateStr: string | null): string | null {
  if (!dateStr) return null;

  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return null;

  return date.toISOString().split('T')[0];
}

/**
 * Transform a CD of the Week record to a Sanity document
 */
async function transformCdOfTheWeekToDocument(
  cd: CdOfTheWeek,
  imageUploader: ReturnType<typeof createImageUploader>,
): Promise<DocumentWithLegacyId> {
  const {
    id, artist, title, label, review, reviewer,
  } = cd;

  // Create the base document
  const doc: DocumentWithLegacyId = {
    _id: generateDocumentId('cdOfTheWeek', id),
    _type: 'cdOfTheWeek',
    artist,
    title,
    slug: createSlug(`${artist}-${title}`),
    legacyId: id,
  };

  // Add optional fields
  if (label) {
    doc.label = label;
  }

  if (review) {
    doc.review = htmlToPortableText(review);
  }

  if (reviewer) {
    doc.reviewer = reviewer;
  }

  if (cd.date) {
    const formattedDate = formatDate(cd.date);
    if (formattedDate) {
      doc.date = formattedDate;
    }
  }

  // Add artist URL (band field in MySQL)
  if (cd.band) {
    doc.artistUrl = cd.band;
  }

  // Handle image upload
  if (cd.cd_pic_url) {
    const imageUrl = fixImagePath(cd.cd_pic_url, migrationConfig.baseUrl);
    if (imageUrl) {
      const result = await imageUploader.uploadFromUrl(imageUrl, `cdotw-${id}.jpg`);
      if (result.success && result.imageValue) {
        doc.image = result.imageValue;
      } else {
        logger.warn(`Failed to upload image for CD ${id}: ${result.error}`);
      }
    }
  }

  return doc;
}

/**
 * Generate a migration report
 */
function generateReport(stats: {
  total: number;
  created: number;
  updated: number;
  skipped: number;
  errors: number;
  validationErrors: Array<{ id: number; artist: string; title: string; errors: string[] }>;
}): string {
  const timestamp = new Date().toISOString();
  let report = '# CD of the Week Migration Report\n\n';
  report += `**Generated:** ${timestamp}\n\n`;
  report += '## Summary\n\n';
  report += '| Metric | Count |\n';
  report += '|--------|-------|\n';
  report += `| Total Records | ${stats.total} |\n`;
  report += `| Created | ${stats.created} |\n`;
  report += `| Updated | ${stats.updated} |\n`;
  report += `| Skipped | ${stats.skipped} |\n`;
  report += `| Errors | ${stats.errors} |\n`;
  report += `| Validation Errors | ${stats.validationErrors.length} |\n\n`;

  if (stats.validationErrors.length > 0) {
    report += '## Validation Errors\n\n';
    stats.validationErrors.forEach((item) => {
      report += `### CD ID ${item.id}: ${item.artist} - ${item.title}\n\n`;
      item.errors.forEach((err) => {
        report += `- ${err}\n`;
      });
      report += '\n';
    });
  }

  return report;
}

/**
 * Main import function
 */
async function importCdOfTheWeek(): Promise<void> {
  let connection: mysql.Connection | null = null;

  try {
    logger.info('Starting CD of the Week import process...');

    // Check if Sanity token is provided
    if (!sanityConfig.token) {
      logger.error('No Sanity API token provided. Please set the SANITY_API_TOKEN environment variable.');
      return;
    }

    logger.info(`Using Sanity project: ${sanityConfig.projectId}, dataset: ${sanityConfig.dataset}`);

    // Create Sanity client
    const client = createClient({
      projectId: sanityConfig.projectId,
      dataset: sanityConfig.dataset,
      token: sanityConfig.token,
      apiVersion: sanityConfig.apiVersion,
      useCdn: false,
    });

    // Create utilities
    const upsertHandler = createUpsertHandler(client);
    const imageUploader = createImageUploader(client);

    // Connect to the database
    connection = await connectToDatabase();

    // Get active CD of the Week records from the database
    const cdRecords = await getActiveCdOfTheWeek(connection);

    if (cdRecords.length === 0) {
      logger.warn('No CD of the Week records found to import.');
      return;
    }

    // Track stats
    const stats = {
      total: cdRecords.length,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
      validationErrors: [] as Array<{
        id: number;
        artist: string;
        title: string;
        errors: string[];
      }>,
    };

    // Process each CD of the Week record
    for (let i = 0; i < cdRecords.length; i += 1) {
      const cd = cdRecords[i];

      // Validate the record
      const validationResult = validateCdOfTheWeek(cd);
      if (!validationResult.isValid) {
        logValidationErrors(cd.id, validationResult);
        stats.validationErrors.push({
          id: cd.id,
          artist: cd.artist || `Unknown (ID: ${cd.id})`,
          title: cd.title || 'Unknown',
          errors: validationResult.errors.map((e) => `${e.field}: ${e.message}`),
        });
        stats.skipped += 1;
        // eslint-disable-next-line no-continue
        continue;
      }

      try {
        // Transform to Sanity document
        // eslint-disable-next-line no-await-in-loop
        const doc = await transformCdOfTheWeekToDocument(cd, imageUploader);

        // Upsert to Sanity
        // eslint-disable-next-line no-await-in-loop
        const result = await upsertHandler.upsert(doc);

        if (result.success) {
          if (result.action === 'created') {
            stats.created += 1;
          } else if (result.action === 'updated') {
            stats.updated += 1;
          } else {
            stats.skipped += 1;
          }
        } else {
          stats.errors += 1;
          logger.error(`Failed to upsert CD ${cd.id}: ${result.error}`);
        }
      } catch (error) {
        stats.errors += 1;
        logger.error(`Error processing CD ${cd.id}:`, error as Error);
      }

      // Log progress every 10 records
      if ((i + 1) % 10 === 0 || i === cdRecords.length - 1) {
        logProgress(i + 1, cdRecords.length, `Processed CD: ${cd.artist} - ${cd.title}`);
      }
    }

    // Log summary
    logSummary({
      total: stats.total,
      success: stats.created + stats.updated,
      skipped: stats.skipped,
      errors: stats.errors,
    });

    // Generate and log report
    const report = generateReport(stats);
    logger.info(`\n${report}`);

    logger.info('CD of the Week import completed!');
  } catch (error) {
    logger.error('Error during import process:', error as Error);
  } finally {
    // Close the database connection
    if (connection) {
      await connection.end();
      logger.info('Database connection closed.');
    }
  }
}

// Run the import process
importCdOfTheWeek();

// Handle process exit
process.on('exit', () => {
  logger.info('Import process complete.');
});
