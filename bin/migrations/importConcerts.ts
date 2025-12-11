/**
 * Migration script for importing concerts from MySQL to Sanity
 *
 * MySQL Schema:
 *   concerts: id, date, artist, band_pic_url, band_url,
 *             venue, ticketinfo, ticketurl, featured, deleted
 *
 * Note: band_pic_url and band_url are legacy fields - the Artist schema now handles these.
 * This migration creates Artist and Venue records if they don't exist.
 *
 * Usage: npm run import:concerts
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

const logger = createLogger('ImportConcerts');

// Concert interface matching the MySQL table structure
interface Concert {
  id: number;
  date: string | null;
  artist: string | null;
  band_pic_url: string | null;
  band_url: string | null;
  venue: string | null;
  ticketinfo: string | null;
  ticketurl: string | null;
  featured: string | null;
  deleted: string;
}

// Track created artists and venues during migration
const createdArtists = new Map<string, string>(); // name -> documentId
const createdVenues = new Map<string, string>(); // name -> documentId

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
 * Get active concerts from the database (excluding soft-deleted records)
 */
async function getActiveConcerts(connection: mysql.Connection): Promise<Concert[]> {
  try {
    const [rows] = await connection.query<mysql.RowDataPacket[]>(
      "SELECT * FROM concerts WHERE deleted NOT IN ('y', 'Y') ORDER BY date DESC",
    );
    logger.info(`Retrieved ${rows.length} concerts from the database.`);
    return rows as Concert[];
  } catch (error) {
    logger.error('Query failed:', error as Error);
    throw error;
  }
}

/**
 * Validate a concert record
 */
function validateConcert(concert: Concert): ValidationResult {
  return mergeResults(
    validateRequired(concert.date, 'date'),
    validateRequired(concert.artist, 'artist'),
    validateRequired(concert.venue, 'venue'),
    validateDate(concert.date, 'date'),
    validateUrl(concert.band_url, 'band_url'),
    validateUrl(concert.ticketurl, 'ticketurl'),
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
 * Normalize an artist or venue name for consistent matching
 */
function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * Check if an artist string should be preserved as a custom title
 * Returns true for special event formats that shouldn't be parsed
 */
function shouldUseCustomTitle(artistString: string): boolean {
  if (!artistString) return false;

  // Check for special event patterns
  const titlePatterns = [
    /\(performing\s+/i, // "Artist (performing Album)"
    /\(playing\s+/i, // "Artist (playing Album)"
    /\s+performs\s+/i, // "Artist performs Album"
    /\s+plays\s+/i, // "Artist plays Album"
    /\s+anniversary\)/i, // "Album Anniversary)"
    /\(.*\s+night\s+\d+\)/i, // "(Night 1)", "(Night 2)"
    /\(.*\s+show\)/i, // "(Special Show)", "(Album Release Show)"
    /\(.*\s+to\s+remember\)/i, // "(A [Event] To Remember)"
    /\([^)]*&[^)]*\)/i, // "(Something & Something)" - descriptive text with ampersand in parens
  ];

  return titlePatterns.some((pattern) => pattern.test(artistString));
}

/**
 * Parse artist string into individual artist names
 * Handles patterns like:
 * - "Artist A & Artist B" -> ["Artist A", "Artist B"]
 * - "Artist A w/ Artist B" -> ["Artist A", "Artist B"]
 * - "Artist A (of Band B)" -> ["Artist A", "Band B"]
 * - "Florence + The Machine" -> ["Florence + The Machine"] (not split)
 * - "Echo & The Bunnymen" -> ["Echo & The Bunnymen"] (not split - band name)
 */
function parseArtistNames(artistString: string): string[] {
  if (!artistString) return [];

  const artists: string[] = [];

  // First, check for special patterns that indicate a single band name
  // Pattern: "Word & The ..." (e.g., "Echo & The Bunnymen")
  const singleBandPattern = /^[A-Z][a-z]+\s+&\s+The\s+/;
  if (singleBandPattern.test(artistString)
      && !artistString.includes(' w/')
      && !artistString.includes(' with ')
      && !artistString.includes('(of ')
      && !artistString.includes('(from ')) {
    return [artistString.trim()];
  }

  // Extract and store "(of ...)" and "(from ...)" patterns
  let remaining = artistString;
  const ofBands: string[] = [];
  const ofPattern = /\((?:of|from)\s+([^)]+)\)/gi;
  let match;
  // eslint-disable-next-line no-cond-assign
  while ((match = ofPattern.exec(artistString)) !== null) {
    const bandName = match[1].trim();
    if (bandName) {
      ofBands.push(bandName);
    }
  }
  // Remove all "(of ...)" patterns
  remaining = remaining.replace(ofPattern, '').trim();

  // Split by " w/ " or " with " (case insensitive) first
  const withParts = remaining.split(/\s+w\/\s+|\s+with\s+/i);

  // For each part, split by " & "
  withParts.forEach((part) => {
    const trimmedPart = part.trim();
    if (!trimmedPart) return;

    const ampParts = trimmedPart.split(/\s+&\s+/);
    ampParts.forEach((ampPart) => {
      const finalPart = ampPart.trim();
      if (finalPart) {
        artists.push(finalPart);
      }
    });
  });

  // Add all "(of ...)" bands at the end
  ofBands.forEach((band) => artists.push(band));

  return artists;
}

/**
 * Extract main artist name(s) from a title string for creating references
 * E.g., "Cat Power (The Greatest 20th Anniversary)" -> "Cat Power"
 * E.g., "Michael Shannon & Jason Narducy (playing ...)" ->
 *       ["Michael Shannon", "Jason Narducy"]
 */
function extractArtistsFromTitle(titleString: string): string[] {
  if (!titleString) return [];

  // Remove anything in parentheses to get the main artist name(s)
  const mainArtists = titleString.replace(/\s*\([^)]*\)/g, '').trim();

  // Now parse the remaining string for multiple artists
  return parseArtistNames(mainArtists);
}

/**
 * Find or create an artist by name
 */
async function findOrCreateArtist(
  client: ReturnType<typeof createClient>,
  upsertHandler: ReturnType<typeof createUpsertHandler>,
  imageUploader: ReturnType<typeof createImageUploader>,
  artistName: string,
  bandPicUrl: string | null,
  bandUrl: string | null,
): Promise<{ success: boolean; artistId: string | null; created: boolean }> {
  const normalizedName = normalizeName(artistName);

  // Check if we already created this artist in this migration run
  if (createdArtists.has(normalizedName)) {
    return {
      success: true,
      artistId: createdArtists.get(normalizedName)!,
      created: false,
    };
  }

  try {
    // Try to find existing artist by name (case-insensitive)
    const query = '*[_type == "artist" && lower(name) == $name][0]';
    const existingArtist = await client.fetch<{ _id: string } | null>(
      query,
      { name: normalizedName },
    );

    if (existingArtist) {
      createdArtists.set(normalizedName, existingArtist._id);
      return {
        success: true,
        artistId: existingArtist._id,
        created: false,
      };
    }

    // Create a new artist
    const artistDoc: DocumentWithLegacyId = {
      _id: `artist-concert-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      _type: 'artist',
      name: artistName.trim(),
      slug: createSlug(artistName),
    };

    // Add website if provided
    if (bandUrl) {
      artistDoc.website = bandUrl;
    }

    // Upload image if provided
    if (bandPicUrl) {
      const imageUrl = fixImagePath(bandPicUrl, migrationConfig.baseUrl);
      if (imageUrl) {
        const result = await imageUploader.uploadFromUrl(
          imageUrl,
          `artist-${artistName.replace(/[^a-z0-9]/gi, '-')}.jpg`,
        );
        if (result.success && result.imageValue) {
          artistDoc.photo = result.imageValue;
        }
      }
    }

    const upsertResult = await upsertHandler.upsert(artistDoc);

    if (upsertResult.success && upsertResult.documentId) {
      createdArtists.set(normalizedName, upsertResult.documentId);
      logger.info(`Created artist: ${artistName} (${upsertResult.documentId})`);
      return {
        success: true,
        artistId: upsertResult.documentId,
        created: true,
      };
    }

    return {
      success: false,
      artistId: null,
      created: false,
    };
  } catch (error) {
    logger.error(`Failed to find or create artist "${artistName}":`, error as Error);
    return {
      success: false,
      artistId: null,
      created: false,
    };
  }
}

/**
 * Find or create a venue by name
 */
async function findOrCreateVenue(
  client: ReturnType<typeof createClient>,
  upsertHandler: ReturnType<typeof createUpsertHandler>,
  venueName: string,
): Promise<{ success: boolean; venueId: string | null; created: boolean }> {
  const normalizedName = normalizeName(venueName);

  // Check if we already created this venue in this migration run
  if (createdVenues.has(normalizedName)) {
    return {
      success: true,
      venueId: createdVenues.get(normalizedName)!,
      created: false,
    };
  }

  try {
    // Try to find existing venue by name (case-insensitive)
    const query = '*[_type == "venue" && lower(name) == $name][0]';
    const existingVenue = await client.fetch<{ _id: string } | null>(
      query,
      { name: normalizedName },
    );

    if (existingVenue) {
      createdVenues.set(normalizedName, existingVenue._id);
      return {
        success: true,
        venueId: existingVenue._id,
        created: false,
      };
    }

    // Create a new venue
    const venueDoc: DocumentWithLegacyId = {
      _id: `venue-concert-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      _type: 'venue',
      name: venueName.trim(),
      slug: createSlug(venueName),
    };

    const upsertResult = await upsertHandler.upsert(venueDoc);

    if (upsertResult.success && upsertResult.documentId) {
      createdVenues.set(normalizedName, upsertResult.documentId);
      logger.info(`Created venue: ${venueName} (${upsertResult.documentId})`);
      return {
        success: true,
        venueId: upsertResult.documentId,
        created: true,
      };
    }

    return {
      success: false,
      venueId: null,
      created: false,
    };
  } catch (error) {
    logger.error(`Failed to find or create venue "${venueName}":`, error as Error);
    return {
      success: false,
      venueId: null,
      created: false,
    };
  }
}

/**
 * Transform a concert record to a Sanity document
 */
async function transformConcertToDocument(
  concert: Concert,
  client: ReturnType<typeof createClient>,
  upsertHandler: ReturnType<typeof createUpsertHandler>,
  imageUploader: ReturnType<typeof createImageUploader>,
): Promise<{
    doc: DocumentWithLegacyId | null;
    artistsCreated: number;
    venueCreated: boolean;
    error?: string;
  }> {
  const { id } = concert;

  // Check if this should use a custom title
  const useCustomTitle = shouldUseCustomTitle(concert.artist!);
  const customTitle = useCustomTitle ? concert.artist!.trim() : null;

  // Parse artist names from the artist string
  // If using custom title, extract artists from title
  // Otherwise, parse normally
  const artistNames = useCustomTitle
    ? extractArtistsFromTitle(concert.artist!)
    : parseArtistNames(concert.artist!);

  if (artistNames.length === 0) {
    return {
      doc: null,
      artistsCreated: 0,
      venueCreated: false,
      error: `No valid artist names found in: ${concert.artist}`,
    };
  }

  // Find or create all artists
  const artistResults = [];
  let totalArtistsCreated = 0;

  for (const artistName of artistNames) {
    // Only use band_pic_url and band_url for the first artist (headliner)
    const isHeadliner = artistResults.length === 0;
    // eslint-disable-next-line no-await-in-loop
    const artistResult = await findOrCreateArtist(
      client,
      upsertHandler,
      imageUploader,
      artistName,
      isHeadliner ? concert.band_pic_url : null,
      isHeadliner ? concert.band_url : null,
    );

    if (!artistResult.success || !artistResult.artistId) {
      return {
        doc: null,
        artistsCreated: totalArtistsCreated,
        venueCreated: false,
        error: `Failed to find or create artist: ${artistName}`,
      };
    }

    artistResults.push(artistResult);
    if (artistResult.created) {
      totalArtistsCreated += 1;
    }
  }

  // Find or create venue
  const venueResult = await findOrCreateVenue(
    client,
    upsertHandler,
    concert.venue!,
  );

  if (!venueResult.success || !venueResult.venueId) {
    return {
      doc: null,
      artistsCreated: totalArtistsCreated,
      venueCreated: false,
      error: `Failed to find or create venue: ${concert.venue}`,
    };
  }

  // Create the concert document with multiple artists
  const doc: DocumentWithLegacyId = {
    _id: generateDocumentId('concert', id),
    _type: 'concert',
    legacyId: id,
    artists: artistResults.map((result) => ({
      _type: 'reference',
      _ref: result.artistId!,
      _key: result.artistId!,
    })),
    venue: {
      _type: 'reference',
      _ref: venueResult.venueId,
    },
  };

  // Add custom title if applicable
  if (customTitle) {
    doc.title = customTitle;
  }

  // Add date
  if (concert.date) {
    const formattedDate = formatDate(concert.date);
    if (formattedDate) {
      doc.date = formattedDate;
    }
  }

  // Add optional fields
  if (concert.ticketinfo) {
    doc.ticketInfo = concert.ticketinfo;
  }

  if (concert.ticketurl) {
    doc.ticketUrl = concert.ticketurl;
  }

  // Handle featured flag (MySQL uses 'y'/'n' or '1'/'0')
  if (concert.featured) {
    const featured = concert.featured.toLowerCase();
    doc.featured = featured === 'y' || featured === '1' || featured === 'yes' || featured === 'true';
  } else {
    doc.featured = false;
  }

  return {
    doc,
    artistsCreated: totalArtistsCreated,
    venueCreated: venueResult.created,
  };
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
  artistsCreated: number;
  venuesCreated: number;
  validationErrors: Array<{ id: number; artist: string; errors: string[] }>;
  migrationErrors: Array<{ id: number; artist: string; error: string }>;
}): string {
  const timestamp = new Date().toISOString();
  let report = '# Concert Migration Report\n\n';
  report += `**Generated:** ${timestamp}\n\n`;
  report += '## Summary\n\n';
  report += '| Metric | Count |\n';
  report += '|--------|-------|\n';
  report += `| Total Records | ${stats.total} |\n`;
  report += `| Created | ${stats.created} |\n`;
  report += `| Updated | ${stats.updated} |\n`;
  report += `| Skipped | ${stats.skipped} |\n`;
  report += `| Errors | ${stats.errors} |\n`;
  report += `| Artists Created | ${stats.artistsCreated} |\n`;
  report += `| Venues Created | ${stats.venuesCreated} |\n`;
  report += `| Validation Errors | ${stats.validationErrors.length} |\n\n`;

  if (stats.validationErrors.length > 0) {
    report += '## Validation Errors\n\n';
    stats.validationErrors.forEach((item) => {
      report += `### Concert ID ${item.id}: ${item.artist}\n\n`;
      item.errors.forEach((err) => {
        report += `- ${err}\n`;
      });
      report += '\n';
    });
  }

  if (stats.migrationErrors.length > 0) {
    report += '## Migration Errors\n\n';
    stats.migrationErrors.forEach((item) => {
      report += `### Concert ID ${item.id}: ${item.artist}\n\n`;
      report += `- ${item.error}\n\n`;
    });
  }

  return report;
}

/**
 * Main import function
 */
async function importConcerts(): Promise<void> {
  let connection: mysql.Connection | null = null;

  try {
    logger.info('Starting concert import process...');

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

    // Get active concerts from the database
    const concerts = await getActiveConcerts(connection);

    if (concerts.length === 0) {
      logger.warn('No concerts found to import.');
      return;
    }

    // Track stats
    const stats = {
      total: concerts.length,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
      artistsCreated: 0,
      venuesCreated: 0,
      validationErrors: [] as Array<{ id: number; artist: string; errors: string[] }>,
      migrationErrors: [] as Array<{ id: number; artist: string; error: string }>,
    };

    // Process each concert
    for (let i = 0; i < concerts.length; i += 1) {
      const concert = concerts[i];

      // Validate the record
      const validationResult = validateConcert(concert);
      if (!validationResult.isValid) {
        logValidationErrors(concert.id, validationResult);
        stats.validationErrors.push({
          id: concert.id,
          artist: concert.artist || `Unknown (ID: ${concert.id})`,
          errors: validationResult.errors.map((e) => `${e.field}: ${e.message}`),
        });
        stats.skipped += 1;
        // eslint-disable-next-line no-continue
        continue;
      }

      try {
        // Transform to Sanity document
        // eslint-disable-next-line no-await-in-loop
        const transformResult = await transformConcertToDocument(
          concert,
          client,
          upsertHandler,
          imageUploader,
        );

        stats.artistsCreated += transformResult.artistsCreated;
        if (transformResult.venueCreated) {
          stats.venuesCreated += 1;
        }

        if (!transformResult.doc) {
          stats.errors += 1;
          stats.migrationErrors.push({
            id: concert.id,
            artist: concert.artist || `Unknown (ID: ${concert.id})`,
            error: transformResult.error || 'Unknown error during transformation',
          });
          // eslint-disable-next-line no-continue
          continue;
        }

        // Upsert to Sanity
        // eslint-disable-next-line no-await-in-loop
        const result = await upsertHandler.upsert(transformResult.doc);

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
          logger.error(`Failed to upsert concert ${concert.id}: ${result.error}`);
        }
      } catch (error) {
        stats.errors += 1;
        logger.error(`Error processing concert ${concert.id}:`, error as Error);
      }

      // Log progress every 10 records
      if ((i + 1) % 10 === 0 || i === concerts.length - 1) {
        logProgress(i + 1, concerts.length, `Processed concert: ${concert.artist} @ ${concert.venue}`);
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

    logger.info('Concert import completed!');
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
importConcerts();

// Handle process exit
process.on('exit', () => {
  logger.info('Import process complete.');
});
