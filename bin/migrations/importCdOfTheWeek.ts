/**
 * Migration script for importing CD of the Week reviews from MySQL to Sanity
 *
 * MySQL Schema:
 *   cdotw: id, artist, title, label, review, cd_pic_url, band (artist URL), reviewer, date, deleted
 *
 * New Sanity Schema (relational):
 *   - Creates/finds Artist documents
 *   - Creates Record documents with artist references
 *   - Creates cdOfTheWeek documents that reference Records
 *
 * Usage:
 *   npm run import:cdotw              # Import all
 *   npm run import:cdotw -- --from-last  # Resume from last imported ID + 1
 *   npm run import:cdotw -- --start-id=100  # Import with ID >= 100
 */

import * as crypto from 'crypto';
import { createClient, SanityClient } from '@sanity/client';
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
import { getLastImportedId } from './shared/getLastImportedId';

const logger = createLogger('ImportCdOfTheWeek');

/**
 * Generate a deterministic ID for an artist based on their name
 * This prevents duplicates and ensures consistency across runs
 */
function generateArtistId(artistName: string): string {
  const normalized = artistName.trim().toLowerCase();
  const hash = crypto.createHash('sha256').update(normalized).digest('hex').slice(0, 12);
  return `artist-${hash}`;
}

// CD of the Week interface matching the MySQL table structure
interface CdOfTheWeekRow {
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

// Command-line options
interface ImportOptions {
  fromLast?: boolean;
  startId?: number;
}

// Cache for created artists to avoid duplicates
const artistCache = new Map<string, string>(); // normalized name -> document ID

/**
 * Parse command-line arguments
 */
function parseArguments(): ImportOptions {
  const options: ImportOptions = {};
  const args = process.argv.slice(2);

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--from-last') {
      options.fromLast = true;
    } else if (arg === '--start-id' && i + 1 < args.length) {
      options.startId = parseInt(args[i + 1], 10);
      i++;
    }
  }

  return options;
}

/**
 * Normalize artist name for consistent matching
 */
function normalizeArtistName(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * Find or create an artist document
 */
async function findOrCreateArtist(
  client: SanityClient,
  upsertHandler: ReturnType<typeof createUpsertHandler>,
  artistName: string,
  website: string | null,
): Promise<{ artistId: string; created: boolean }> {
  const normalizedName = normalizeArtistName(artistName);

  // Check cache first
  if (artistCache.has(normalizedName)) {
    return { artistId: artistCache.get(normalizedName)!, created: false };
  }

  try {
    // Try to find existing artist by ID first (most efficient)
    const artistId = generateArtistId(artistName);
    const existingById = await client.fetch<{ _id: string } | null>(
      '*[_type == "artist" && _id == $id][0]',
      { id: artistId },
    );

    if (existingById) {
      artistCache.set(normalizedName, existingById._id);
      return { artistId: existingById._id, created: false };
    }

    // Fallback: Try to find by name (case-insensitive) for legacy artists
    const existingByName = await client.fetch<{ _id: string } | null>(
      '*[_type == "artist" && lower(name) == $name][0]',
      { name: normalizedName },
    );

    if (existingByName) {
      artistCache.set(normalizedName, existingByName._id);
      return { artistId: existingByName._id, created: false };
    }

    // Create new artist with deterministic ID
    const artistDoc: DocumentWithLegacyId = {
      _id: artistId,
      _type: 'artist',
      name: artistName.trim(),
      slug: createSlug(artistName),
    };

    if (website) {
      artistDoc.website = website;
    }

    const result = await upsertHandler.upsert(artistDoc);
    if (result.success && result.documentId) {
      artistCache.set(normalizedName, result.documentId);
      logger.info(`Created artist: ${artistName} (${result.documentId})`);
      return { artistId: result.documentId, created: true };
    }

    throw new Error(`Failed to create artist: ${artistName}`);
  } catch (error) {
    logger.error(`Error finding/creating artist "${artistName}":`, error as Error);
    throw error;
  }
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
async function getActiveCdOfTheWeek(
  connection: mysql.Connection,
  options: ImportOptions = {},
): Promise<CdOfTheWeekRow[]> {
  try {
    let query = "SELECT * FROM cdotw WHERE deleted NOT IN ('yes', 'Yes', 'YES', 'y', 'Y')";
    const params: any[] = [];

    // Add ID filter if provided
    if (options.startId) {
      query += ' AND id >= ?';
      params.push(options.startId);
    }

    query += ' ORDER BY id ASC';

    const [rows] = await connection.query<mysql.RowDataPacket[]>(query, params);

    let filterMsg = '';
    if (options.startId) filterMsg += ` startId=${options.startId}`;

    logger.info(
      `Retrieved ${rows.length} CD of the Week records from the database.${filterMsg ? ` Filters:${filterMsg}` : ''}`,
    );
    return rows as CdOfTheWeekRow[];
  } catch (error) {
    logger.error('Query failed:', error as Error);
    throw error;
  }
}

/**
 * Validate a CD of the Week record
 */
function validateCdOfTheWeek(cd: CdOfTheWeekRow): ValidationResult {
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
 * Transform a CD of the Week record to Sanity documents (Artist, Record, cdOfTheWeek)
 */
async function transformCdOfTheWeekToDocuments(
  cd: CdOfTheWeekRow,
  client: SanityClient,
  upsertHandler: ReturnType<typeof createUpsertHandler>,
  imageUploader: ReturnType<typeof createImageUploader>,
): Promise<{
    recordDoc: DocumentWithLegacyId;
    cdOfTheWeekDoc: DocumentWithLegacyId;
    artistCreated: boolean;
  }> {
  const {
    id, artist, title, label, review, reviewer,
  } = cd;

  // Step 1: Find or create the artist
  const { artistId, created: artistCreated } = await findOrCreateArtist(
    client,
    upsertHandler,
    artist,
    cd.band,
  );

  // Step 2: Create the Record document
  const recordId = generateDocumentId('record', id);
  const recordDoc: DocumentWithLegacyId = {
    _id: recordId,
    _type: 'record',
    title,
    slug: createSlug(`${artist}-${title}`),
    artists: [{ _type: 'reference', _ref: artistId }],
    legacyId: id,
  };

  if (label) {
    recordDoc.label = label;
  }

  if (cd.date) {
    const formattedDate = formatDate(cd.date);
    if (formattedDate) {
      recordDoc.releaseDate = formattedDate;
    }
  }

  // Handle image upload for the record
  if (cd.cd_pic_url) {
    const imageUrl = fixImagePath(cd.cd_pic_url, migrationConfig.baseUrl);
    if (imageUrl) {
      const result = await imageUploader.uploadFromUrl(imageUrl, `record-${id}.jpg`);
      if (result.success && result.imageValue) {
        recordDoc.coverImage = result.imageValue;
      } else {
        logger.warn(`Failed to upload image for Record ${id}: ${result.error}`);
      }
    }
  }

  // Step 3: Create the cdOfTheWeek document
  const cdOfTheWeekDoc: DocumentWithLegacyId = {
    _id: generateDocumentId('cdOfTheWeek', id),
    _type: 'cdOfTheWeek',
    record: { _type: 'reference', _ref: recordId },
    legacyId: id,
  };

  if (review) {
    cdOfTheWeekDoc.review = htmlToPortableText(review);
  }

  if (reviewer) {
    cdOfTheWeekDoc.reviewer = reviewer;
  }

  if (cd.date) {
    const formattedDate = formatDate(cd.date);
    if (formattedDate) {
      cdOfTheWeekDoc.date = formattedDate;
    }
  }

  return { recordDoc, cdOfTheWeekDoc, artistCreated };
}

/**
 * Generate a migration report
 */
function generateReport(stats: {
  total: number;
  recordsCreated: number;
  recordsUpdated: number;
  featuresCreated: number;
  featuresUpdated: number;
  artistsCreated: number;
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
  report += `| Artists Created | ${stats.artistsCreated} |\n`;
  report += `| Records Created | ${stats.recordsCreated} |\n`;
  report += `| Records Updated | ${stats.recordsUpdated} |\n`;
  report += `| Features Created | ${stats.featuresCreated} |\n`;
  report += `| Features Updated | ${stats.featuresUpdated} |\n`;
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
    // Parse command-line arguments
    const options = parseArguments();

    logger.info('Starting CD of the Week import process...');
    logger.info('Using relational schema: Artist -> Record -> cdOfTheWeek');

    // Check if Sanity token is provided
    if (!sanityConfig.token) {
      logger.error('No Sanity API token provided. Set SANITY_API_TOKEN environment variable.');
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

    // Handle --from-last flag
    if (options.fromLast) {
      logger.info('Fetching last imported CD of the Week ID...');
      const lastId = await getLastImportedId('cdOfTheWeek', client);
      if (lastId !== null) {
        options.startId = lastId + 1;
        logger.info(`Last imported ID: ${lastId}. Starting from ID: ${options.startId}`);
      } else {
        logger.info('No CD of the Week found in Sanity. Starting from the beginning.');
      }
    }

    // Log filters if any
    if (options.startId) {
      logger.info('Import filters:');
      logger.info(`  - Start ID: ${options.startId}`);
    }

    // Create utilities
    const upsertHandler = createUpsertHandler(client);
    const imageUploader = createImageUploader(client);

    // Connect to the database
    connection = await connectToDatabase();

    // Get active CD of the Week records from the database
    const cdRecords = await getActiveCdOfTheWeek(connection, options);

    if (cdRecords.length === 0) {
      logger.warn('No CD of the Week records found to import.');
      return;
    }

    // Track stats
    const stats = {
      total: cdRecords.length,
      recordsCreated: 0,
      recordsUpdated: 0,
      featuresCreated: 0,
      featuresUpdated: 0,
      artistsCreated: 0,
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
        // Transform to Sanity documents
        // eslint-disable-next-line no-await-in-loop
        const { recordDoc, cdOfTheWeekDoc, artistCreated } = await transformCdOfTheWeekToDocuments(
          cd,
          client,
          upsertHandler,
          imageUploader,
        );

        if (artistCreated) {
          stats.artistsCreated += 1;
        }

        // Upsert Record document
        // eslint-disable-next-line no-await-in-loop
        const recordResult = await upsertHandler.upsert(recordDoc);
        if (recordResult.success) {
          if (recordResult.action === 'created') {
            stats.recordsCreated += 1;
          } else if (recordResult.action === 'updated') {
            stats.recordsUpdated += 1;
          }
        } else {
          stats.errors += 1;
          logger.error(`Failed to upsert Record ${cd.id}: ${recordResult.error}`);
          // eslint-disable-next-line no-continue
          continue;
        }

        // Upsert cdOfTheWeek document
        // eslint-disable-next-line no-await-in-loop
        const featureResult = await upsertHandler.upsert(cdOfTheWeekDoc);
        if (featureResult.success) {
          if (featureResult.action === 'created') {
            stats.featuresCreated += 1;
          } else if (featureResult.action === 'updated') {
            stats.featuresUpdated += 1;
          }
        } else {
          stats.errors += 1;
          logger.error(`Failed to upsert cdOfTheWeek ${cd.id}: ${featureResult.error}`);
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
    const totalSuccess = stats.recordsCreated + stats.recordsUpdated
      + stats.featuresCreated + stats.featuresUpdated;
    logSummary({
      total: stats.total,
      success: totalSuccess,
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
