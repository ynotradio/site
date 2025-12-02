/**
 * Migration script for importing OnDemand content from MySQL to Sanity
 *
 * MySQL Schema:
 *   ondemand: id, date, image, headline, note, songs, audio_url, source, deleted
 *
 * Sanity Schema:
 *   - Creates OnDemand documents
 *   - Optionally creates/finds Artist documents based on headline
 *
 * Usage: npm run import:ondemand
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

const logger = createLogger('ImportOnDemand');

/**
 * Generate a deterministic ID for an artist based on their name
 * This prevents duplicates and ensures consistency across runs
 */
function generateArtistId(artistName: string): string {
  const normalized = artistName.trim().toLowerCase();
  const hash = crypto.createHash('sha256').update(normalized).digest('hex').slice(0, 12);
  return `artist-${hash}`;
}

// OnDemand interface matching the MySQL table structure
interface OnDemandRow {
  id: number;
  date: string | null;
  image: string | null;
  headline: string;
  note: string | null;
  songs: string | null;
  audio_url: string | null;
  source: string;
  deleted: string;
}

// Cache for created artists to avoid duplicates
const artistCache = new Map<string, string>(); // normalized name -> document ID

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
 * Get active OnDemand records from the database (excluding soft-deleted records)
 */
async function getActiveOnDemand(connection: mysql.Connection): Promise<OnDemandRow[]> {
  try {
    const [rows] = await connection.query<mysql.RowDataPacket[]>(
      "SELECT * FROM ondemand WHERE LOWER(deleted) NOT IN ('yes', 'y') ORDER BY date DESC",
    );
    logger.info(`Retrieved ${rows.length} OnDemand records from the database.`);
    return rows as OnDemandRow[];
  } catch (error) {
    logger.error('Query failed:', error as Error);
    throw error;
  }
}

/**
 * Validate an OnDemand record
 */
function validateOnDemand(od: OnDemandRow): ValidationResult {
  return mergeResults(
    validateRequired(od.headline, 'headline'),
    validateRequired(od.date, 'date'),
    validateUrl(od.image, 'image'),
    validateDate(od.date, 'date'),
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
 * Extract video URL from note if present
 */
function extractVideoUrl(note: string | null): string | null {
  if (!note) return null;

  // Look for href patterns in the note
  const hrefMatch = note.match(/href="([^"]+)"/);
  if (hrefMatch && hrefMatch[1]) {
    const url = hrefMatch[1];
    // Check if it's a video URL (YouTube, etc.)
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      return url;
    }
  }

  return null;
}

/**
 * Determine content type from note field.
 * Returns the enum value for the contentType field.
 * Note: The schema (studio/schemaTypes/onDemand.ts) has a similar helper
 * function `extractContentTypeLabel` for display purposes in the preview.
 */
function determineContentType(note: string | null): string | null {
  if (!note) return null;

  const lowerNote = note.toLowerCase();
  if (lowerNote.includes('session')) return 'session';
  if (lowerNote.includes('interview')) return 'interview';
  if (lowerNote.includes('takeover')) return 'takeover';

  return 'other';
}

/**
 * Transform an OnDemand record to a Sanity document
 */
async function transformOnDemandToDocument(
  od: OnDemandRow,
  client: SanityClient,
  upsertHandler: ReturnType<typeof createUpsertHandler>,
  imageUploader: ReturnType<typeof createImageUploader>,
): Promise<{
    onDemandDoc: DocumentWithLegacyId;
    artistCreated: boolean;
  }> {
  const {
    id, headline, note, songs,
  } = od;

  let artistCreated = false;
  let artistId: string | null = null;

  // Try to find or create the artist
  // Note: Some headlines may contain additional info like "& Someone Else"
  // We'll link to the primary artist based on the headline
  try {
    const result = await findOrCreateArtist(client, upsertHandler, headline);
    artistId = result.artistId;
    artistCreated = result.created;
  } catch (error) {
    // If artist creation fails, continue without the reference
    logger.warn(`Could not create artist for OnDemand ${id}: ${headline}`);
  }

  // Create the OnDemand document
  const onDemandDoc: DocumentWithLegacyId = {
    _id: generateDocumentId('onDemand', id),
    _type: 'onDemand',
    headline,
    legacyId: id,
  };

  // Add artist reference if available
  if (artistId) {
    onDemandDoc.artist = { _type: 'reference', _ref: artistId };
  }

  // Add date
  if (od.date) {
    const formattedDate = formatDate(od.date);
    if (formattedDate) {
      onDemandDoc.date = formattedDate;
    }
  }

  // Add content type
  const contentType = determineContentType(note);
  if (contentType) {
    onDemandDoc.contentType = contentType;
  }

  // Add note (cleaned up)
  if (note) {
    onDemandDoc.note = note;
  }

  // Add songs (skip 'n/a' values)
  if (songs && songs.toLowerCase() !== 'n/a') {
    onDemandDoc.songs = songs;
  }

  // Add audio ID
  if (od.audio_url) {
    onDemandDoc.audioId = od.audio_url;
  }

  // Add audio source
  if (od.source) {
    onDemandDoc.audioSource = od.source;
  }

  // Extract video URL from note
  const videoUrl = extractVideoUrl(note);
  if (videoUrl) {
    onDemandDoc.videoUrl = videoUrl;
  }

  // Handle image upload
  if (od.image) {
    const imageUrl = fixImagePath(od.image, migrationConfig.baseUrl);
    if (imageUrl) {
      const result = await imageUploader.uploadFromUrl(imageUrl, `ondemand-${id}.jpg`);
      if (result.success && result.imageValue) {
        onDemandDoc.image = result.imageValue;
      } else {
        // Store the legacy URL if upload fails
        onDemandDoc.imageUrl = od.image;
        logger.warn(`Failed to upload image for OnDemand ${id}: ${result.error}`);
      }
    }
  }

  return { onDemandDoc, artistCreated };
}

/**
 * Generate a migration report
 */
function generateReport(stats: {
  total: number;
  created: number;
  updated: number;
  artistsCreated: number;
  skipped: number;
  errors: number;
  validationErrors: Array<{ id: number; headline: string; errors: string[] }>;
}): string {
  const timestamp = new Date().toISOString();
  let report = '# OnDemand Migration Report\n\n';
  report += `**Generated:** ${timestamp}\n\n`;
  report += '## Summary\n\n';
  report += '| Metric | Count |\n';
  report += '|--------|-------|\n';
  report += `| Total Records | ${stats.total} |\n`;
  report += `| Artists Created | ${stats.artistsCreated} |\n`;
  report += `| OnDemand Created | ${stats.created} |\n`;
  report += `| OnDemand Updated | ${stats.updated} |\n`;
  report += `| Skipped | ${stats.skipped} |\n`;
  report += `| Errors | ${stats.errors} |\n`;
  report += `| Validation Errors | ${stats.validationErrors.length} |\n\n`;

  if (stats.validationErrors.length > 0) {
    report += '## Validation Errors\n\n';
    stats.validationErrors.forEach((item) => {
      report += `### OnDemand ID ${item.id}: ${item.headline}\n\n`;
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
async function importOnDemand(): Promise<void> {
  let connection: mysql.Connection | null = null;

  try {
    logger.info('Starting OnDemand import process...');

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

    // Create utilities
    const upsertHandler = createUpsertHandler(client);
    const imageUploader = createImageUploader(client);

    // Connect to the database
    connection = await connectToDatabase();

    // Get active OnDemand records from the database
    const onDemandRecords = await getActiveOnDemand(connection);

    if (onDemandRecords.length === 0) {
      logger.warn('No OnDemand records found to import.');
      return;
    }

    // Track stats
    const stats = {
      total: onDemandRecords.length,
      created: 0,
      updated: 0,
      artistsCreated: 0,
      skipped: 0,
      errors: 0,
      validationErrors: [] as Array<{
        id: number;
        headline: string;
        errors: string[];
      }>,
    };

    // Process each OnDemand record
    for (let i = 0; i < onDemandRecords.length; i += 1) {
      const od = onDemandRecords[i];

      // Validate the record
      const validationResult = validateOnDemand(od);
      if (!validationResult.isValid) {
        logValidationErrors(od.id, validationResult);
        stats.validationErrors.push({
          id: od.id,
          headline: od.headline || `Unknown (ID: ${od.id})`,
          errors: validationResult.errors.map((e) => `${e.field}: ${e.message}`),
        });
        stats.skipped += 1;
        // eslint-disable-next-line no-continue
        continue;
      }

      try {
        // Transform to Sanity document
        // eslint-disable-next-line no-await-in-loop
        const { onDemandDoc, artistCreated } = await transformOnDemandToDocument(
          od,
          client,
          upsertHandler,
          imageUploader,
        );

        if (artistCreated) {
          stats.artistsCreated += 1;
        }

        // Upsert OnDemand document
        // eslint-disable-next-line no-await-in-loop
        const result = await upsertHandler.upsert(onDemandDoc);
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
          logger.error(`Failed to upsert OnDemand ${od.id}: ${result.error}`);
        }
      } catch (error) {
        stats.errors += 1;
        logger.error(`Error processing OnDemand ${od.id}:`, error as Error);
      }

      // Log progress every 10 records
      if ((i + 1) % 10 === 0 || i === onDemandRecords.length - 1) {
        logProgress(i + 1, onDemandRecords.length, `Processed: ${od.headline}`);
      }
    }

    // Log summary
    const totalSuccess = stats.created + stats.updated;
    logSummary({
      total: stats.total,
      success: totalSuccess,
      skipped: stats.skipped,
      errors: stats.errors,
    });

    // Generate and log report
    const report = generateReport(stats);
    logger.info(`\n${report}`);

    logger.info('OnDemand import completed!');
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
importOnDemand();

// Handle process exit
process.on('exit', () => {
  logger.info('Import process complete.');
});
