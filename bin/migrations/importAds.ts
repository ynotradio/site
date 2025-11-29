/**
 * Migration script for importing ads from MySQL to Sanity
 *
 * MySQL Schema:
 *   ads: id, name, start_date, end_date, pic_url, web_url, priority, deleted
 *
 * Usage: npm run import:ads
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

const logger = createLogger('ImportAds');

// Ad interface matching the MySQL table structure
interface Ad {
  id: number;
  name: string;
  start_date: string | null;
  end_date: string | null;
  pic_url: string | null;
  web_url: string | null;
  priority: number | null;
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
 * Get active ads from the database (excluding soft-deleted records)
 */
async function getActiveAds(connection: mysql.Connection): Promise<Ad[]> {
  try {
    const [rows] = await connection.query<mysql.RowDataPacket[]>(
      "SELECT * FROM ads WHERE deleted NOT IN ('y', 'Y') ORDER BY priority DESC",
    );
    logger.info(`Retrieved ${rows.length} ads from the database.`);
    return rows as Ad[];
  } catch (error) {
    logger.error('Query failed:', error as Error);
    throw error;
  }
}

/**
 * Validate an ad record
 */
function validateAd(ad: Ad): ValidationResult {
  return mergeResults(
    validateRequired(ad.name, 'name'),
    validateUrl(ad.web_url, 'web_url'),
    validateUrl(ad.pic_url, 'pic_url'),
    validateDate(ad.start_date, 'start_date'),
    validateDate(ad.end_date, 'end_date'),
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
 * Transform an ad record to a Sanity document
 */
async function transformAdToDocument(
  ad: Ad,
  imageUploader: ReturnType<typeof createImageUploader>,
): Promise<DocumentWithLegacyId> {
  const { id, name } = ad;

  // Create the base document
  const doc: DocumentWithLegacyId = {
    _id: generateDocumentId('ad', id),
    _type: 'ad',
    name,
    legacyId: id,
  };

  // Add optional fields
  if (ad.start_date) {
    const startDate = formatDate(ad.start_date);
    if (startDate) {
      doc.startDate = startDate;
    }
  }

  if (ad.end_date) {
    const endDate = formatDate(ad.end_date);
    if (endDate) {
      doc.endDate = endDate;
    }
  }

  if (ad.web_url) {
    doc.url = ad.web_url;
  }

  if (ad.priority !== null && ad.priority !== undefined) {
    doc.priority = ad.priority;
  }

  // Handle image upload
  if (ad.pic_url) {
    const imageUrl = fixImagePath(ad.pic_url, migrationConfig.baseUrl);
    if (imageUrl) {
      const result = await imageUploader.uploadFromUrl(imageUrl, `ad-${id}.jpg`);
      if (result.success && result.imageValue) {
        doc.image = result.imageValue;
      } else {
        logger.warn(`Failed to upload image for ad ${id}: ${result.error}`);
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
  validationErrors: Array<{ id: number; name: string; errors: string[] }>;
}): string {
  const timestamp = new Date().toISOString();
  let report = '# Ad Migration Report\n\n';
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
      report += `### Ad ID ${item.id}: ${item.name}\n\n`;
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
async function importAds(): Promise<void> {
  let connection: mysql.Connection | null = null;

  try {
    logger.info('Starting ad import process...');

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

    // Get active ads from the database
    const ads = await getActiveAds(connection);

    if (ads.length === 0) {
      logger.warn('No ads found to import.');
      return;
    }

    // Track stats
    const stats = {
      total: ads.length,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
      validationErrors: [] as Array<{ id: number; name: string; errors: string[] }>,
    };

    // Process each ad
    for (let i = 0; i < ads.length; i += 1) {
      const ad = ads[i];

      // Validate the record
      const validationResult = validateAd(ad);
      if (!validationResult.isValid) {
        logValidationErrors(ad.id, validationResult);
        stats.validationErrors.push({
          id: ad.id,
          name: ad.name || `Unknown (ID: ${ad.id})`,
          errors: validationResult.errors.map((e) => `${e.field}: ${e.message}`),
        });
        stats.skipped += 1;
        // eslint-disable-next-line no-continue
        continue;
      }

      try {
        // Transform to Sanity document
        // eslint-disable-next-line no-await-in-loop
        const doc = await transformAdToDocument(ad, imageUploader);

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
          logger.error(`Failed to upsert ad ${ad.id}: ${result.error}`);
        }
      } catch (error) {
        stats.errors += 1;
        logger.error(`Error processing ad ${ad.id}:`, error as Error);
      }

      // Log progress every 10 records
      if ((i + 1) % 10 === 0 || i === ads.length - 1) {
        logProgress(i + 1, ads.length, `Processed ad: ${ad.name}`);
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

    logger.info('Ad import completed!');
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
importAds();

// Handle process exit
process.on('exit', () => {
  logger.info('Import process complete.');
});
