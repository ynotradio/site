/**
 * Payload client utilities for import scripts
 * Provides connection to Payload CMS with dev/prod database selection
 */

import path from 'path';
import dotenv from 'dotenv';
import type { Payload } from 'payload';
import { getPayload } from 'payload';
import { createLogger } from './logger';
import { getArtistMbid } from './musicbrainz';
import { generateSlug, stripHtmlTags } from './importUtils';

const logger = createLogger('PayloadClient');

/**
 * Environment mode for database selection
 */
export type DatabaseEnv = 'dev' | 'prod';

/**
 * Get the Payload instance configured for the specified environment
 */
export async function getPayloadClient(env: DatabaseEnv = 'dev'): Promise<Payload> {
  // Load environment variables from .env.local with override
  dotenv.config({
    path: path.resolve(process.cwd(), '.env.local'),
    override: true,
  });

  // Select database URL based on environment
  const databaseUri = env === 'prod'
    ? process.env.NEON_PROD_DATABASE_URL
    : process.env.NEON_DEV_DATABASE_URL || process.env.DATABASE_URI;

  if (!databaseUri) {
    throw new Error(
      `Database URI not found for environment "${env}". `
        + `Please set ${env === 'prod' ? 'NEON_PROD_DATABASE_URL' : 'NEON_DEV_DATABASE_URL or DATABASE_URI'} in .env.local`,
    );
  }

  logger.info(`Connecting to ${env} database...`);

  // Override DATABASE_URI before importing config
  process.env.DATABASE_URI = databaseUri;

  // Import the payload config (it will use the overridden DATABASE_URI)
  // Import and pass the config directly to getPayload to ensure it's available
  const payloadConfigModule = await import('../../../payload.config');
  const payloadConfig = payloadConfigModule.default ?? payloadConfigModule;

  const payload = await getPayload({ config: payloadConfig as any });
  logger.info(`Connected to ${env} database successfully`);

  return payload;
}

/**
 * Find or create an artist by name
 * Returns the artist ID
 */
export async function findOrCreateArtist(
  payload: Payload,
  name: string,
): Promise<number> {
  // Strip HTML tags from name
  const cleanName = stripHtmlTags(name);

  // Try to find by name
  const existing = await payload.find({
    collection: 'artists',
    where: {
      name: {
        equals: cleanName,
      },
    },
    limit: 1,
  });

  if (existing.docs.length > 0) {
    const artist = existing.docs[0];

    // If artist exists but doesn't have MusicBrainz ID, try to add it
    if (!artist.musicbrainzId) {
      try {
        const mbid = await getArtistMbid(cleanName);
        if (mbid) {
          await payload.update({
            collection: 'artists',
            id: artist.id,
            data: {
              musicbrainzId: mbid,
            },
          });
          logger.debug(`Added MusicBrainz ID to existing artist: ${cleanName}`);
        }
      } catch (error) {
        // Log but don't fail
        logger.debug(`Failed to update MusicBrainz ID for ${cleanName}`);
      }
    }

    return artist.id;
  }

  // Try to create new artist
  try {
    // Generate slug from name
    const slug = generateSlug(cleanName);

    // Fetch MusicBrainz ID
    let mbid = null;
    try {
      mbid = await getArtistMbid(cleanName);
      if (mbid) {
        logger.debug(`Found MusicBrainz ID for ${cleanName}: ${mbid}`);
      }
    } catch (error) {
      // Log but don't fail if MusicBrainz lookup fails
      logger.debug(`MusicBrainz lookup failed for ${cleanName}`);
    }

    const newArtist = await payload.create({
      collection: 'artists',
      data: {
        name: cleanName,
        slug,
        musicbrainzId: mbid || undefined,
      },
    });

    logger.debug(`Created artist: ${cleanName}`);
    return newArtist.id;
  } catch (error: any) {
    // Log the full error structure for debugging
    console.error(`[DEBUG] Error creating artist "${name}":`, JSON.stringify({
      status: error.status,
      hasData: !!error.data,
      hasErrors: !!error.data?.errors,
      errorCount: error.data?.errors?.length,
      errors: error.data?.errors,
    }, null, 2));

    const isMbidError = error.status === 400
      && error.data?.errors?.some((e: any) => e.path === 'musicbrainzId');
    const isSlugError = error.status === 400
      && error.data?.errors?.some((e: any) => e.path === 'slug');
    const isNameError = error.status === 400
      && error.data?.errors?.some((e: any) => e.path === 'name');

    // If name is duplicate (race condition), try finding again
    if (isNameError) {
      logger.debug(`Name conflict for "${name}" (possible race condition), retrying find`);
      const retryExisting = await payload.find({
        collection: 'artists',
        where: { name: { equals: cleanName } },
        limit: 1,
      });
      if (retryExisting.docs.length > 0) {
        logger.debug(`Found existing artist after race condition: "${name}" (id: ${retryExisting.docs[0].id})`);
        return retryExisting.docs[0].id;
      }
    }

    // If MusicBrainz ID is duplicate, retry without it
    if (isMbidError) {
      logger.debug(`MusicBrainz ID conflict for "${name}", retrying without MBID`);
      try {
        const slug = generateSlug(cleanName);
        const newArtist = await payload.create({
          collection: 'artists',
          data: {
            name: cleanName,
            slug,
          },
        });
        logger.debug(`Created artist without MBID: ${cleanName}`);
        return newArtist.id;
      } catch (retryError: any) {
        // If still failing (e.g., slug conflict), try finding by slug
        const retryIsSlugError = retryError.status === 400
          && retryError.data?.errors?.some((e: any) => e.path === 'slug');
        if (retryIsSlugError) {
          const slug = generateSlug(cleanName);
          const existingBySlug = await payload.find({
            collection: 'artists',
            where: { slug: { equals: slug } },
            limit: 1,
          });
          if (existingBySlug.docs.length > 0) {
            logger.debug(`Found existing artist by slug after MBID retry: "${name}" (id: ${existingBySlug.docs[0].id})`);
            return existingBySlug.docs[0].id;
          }
        }
        throw retryError;
      }
    }

    if (isSlugError) {
      console.error(`[DEBUG] Slug validation failed for artist: ${name}, searching by slug...`);

      // Generate the slug that would be created and search for it
      const slug = generateSlug(name);

      const existingBySlug = await payload.find({
        collection: 'artists',
        where: {
          slug: {
            equals: slug,
          },
        },
        limit: 1,
      });

      if (existingBySlug.docs.length > 0) {
        logger.debug(`Found existing artist by slug: "${name}" -> "${slug}" (id: ${existingBySlug.docs[0].id})`);
        return existingBySlug.docs[0].id;
      }
      logger.debug(`No existing artist found with slug: "${slug}"`);
    }
    // Re-throw if it's not a handled error or we couldn't find existing
    logger.debug(`Re-throwing error for artist: ${name}`);
    throw error;
  }
}

/**
 * Find or create a venue by name
 * Returns the venue ID
 */
export async function findOrCreateVenue(
  payload: Payload,
  name: string,
): Promise<number> {
  // Strip HTML tags from name
  const cleanName = stripHtmlTags(name);

  // Try to find by name
  const existing = await payload.find({
    collection: 'venues',
    where: {
      name: {
        equals: cleanName,
      },
    },
    limit: 1,
  });

  if (existing.docs.length > 0) {
    return existing.docs[0].id;
  }

  // Try to create new venue
  try {
    // Generate slug from name
    const slug = generateSlug(cleanName);

    const newVenue = await payload.create({
      collection: 'venues',
      data: {
        name: cleanName,
        slug,
      },
    });

    logger.debug(`Created venue: ${cleanName}`);
    return newVenue.id;
  } catch (error: any) {
    // If slug validation fails, likely a duplicate with slight name variation
    const isSlugError = error.status === 400
      && error.data?.errors?.some((e: any) => e.path === 'slug');

    if (isSlugError) {
      logger.debug(`Slug validation failed for venue: ${name}, searching by slug...`);

      // Generate the slug that would be created and search for it
      const slug = generateSlug(name);

      const existingBySlug = await payload.find({
        collection: 'venues',
        where: {
          slug: {
            equals: slug,
          },
        },
        limit: 1,
      });

      if (existingBySlug.docs.length > 0) {
        logger.debug(`Found existing venue by slug: "${name}" -> "${slug}" (id: ${existingBySlug.docs[0].id})`);
        return existingBySlug.docs[0].id;
      }
      logger.debug(`No existing venue found with slug: "${slug}"`);
    }
    // Re-throw if it's not a slug validation error or we couldn't find existing
    logger.debug(`Re-throwing error for venue: ${name}, isSlugError: ${isSlugError}`);
    throw error;
  }
}

/**
 * Find or create a person by name
 * Returns the person ID
 */
export async function findOrCreatePerson(
  payload: Payload,
  name: string,
  legacyId?: number,
): Promise<number> {
  // Strip HTML tags from name
  const cleanName = stripHtmlTags(name);

  // First try to find by legacy ID if provided
  if (legacyId !== undefined) {
    const existingByLegacyId = await payload.find({
      collection: 'people',
      where: {
        legacyId: {
          equals: legacyId,
        },
      },
      limit: 1,
    });

    if (existingByLegacyId.docs.length > 0) {
      return existingByLegacyId.docs[0].id;
    }
  }

  // Try to find by name
  const existing = await payload.find({
    collection: 'people',
    where: {
      name: {
        equals: cleanName,
      },
    },
    limit: 1,
  });

  if (existing.docs.length > 0) {
    return existing.docs[0].id;
  }

  // Try to create new person
  try {
    // Generate slug from name
    const slug = generateSlug(cleanName);

    const newPerson = await payload.create({
      collection: 'people',
      data: {
        name: cleanName,
        slug,
        legacyId,
        migratedAt: new Date().toISOString(),
      },
    });

    logger.debug(`Created person: ${cleanName}`);
    return newPerson.id;
  } catch (error: any) {
    // If slug validation fails, likely a duplicate with slight name variation
    const isSlugError = error.status === 400
      && error.data?.errors?.some((e: any) => e.path === 'slug');

    if (isSlugError) {
      logger.debug(`Slug validation failed for person: ${name}, searching by slug...`);

      // Generate the slug that would be created and search for it
      const slug = generateSlug(name);

      const existingBySlug = await payload.find({
        collection: 'people',
        where: {
          slug: {
            equals: slug,
          },
        },
        limit: 1,
      });

      if (existingBySlug.docs.length > 0) {
        logger.debug(`Found existing person by slug: "${name}" -> "${slug}" (id: ${existingBySlug.docs[0].id})`);
        return existingBySlug.docs[0].id;
      }
      logger.debug(`No existing person found with slug: "${slug}"`);
    }
    // Re-throw if it's not a slug validation error or we couldn't find existing
    logger.debug(`Re-throwing error for person: ${name}, isSlugError: ${isSlugError}`);
    throw error;
  }
}

/**
 * Find a DJ by legacy ID
 * Returns the DJ ID or null if not found
 */
export async function findDJByLegacyId(
  payload: Payload,
  legacyId: number,
): Promise<number | null> {
  const existing = await payload.find({
    collection: 'djs',
    where: {
      legacyId: {
        equals: legacyId,
      },
    },
    limit: 1,
  });

  if (existing.docs.length > 0) {
    return existing.docs[0].id;
  }

  return null;
}

/**
 * Find or create a record by title and artist
 * Returns the record ID
 */
export async function findOrCreateRecord(
  payload: Payload,
  title: string,
  artistId: number,
  legacyId?: number,
): Promise<number> {
  // First try to find by legacy ID if provided
  if (legacyId !== undefined) {
    const existingByLegacyId = await payload.find({
      collection: 'records',
      where: {
        legacyId: {
          equals: legacyId,
        },
      },
      limit: 1,
    });

    if (existingByLegacyId.docs.length > 0) {
      return existingByLegacyId.docs[0].id;
    }
  }

  // Try to find by title and artist
  const existing = await payload.find({
    collection: 'records',
    where: {
      and: [
        {
          title: {
            equals: title,
          },
        },
        {
          artist: {
            equals: artistId,
          },
        },
      ],
    },
    limit: 1,
  });

  if (existing.docs.length > 0) {
    return existing.docs[0].id;
  }

  // Try to create new record
  try {
    // Generate slug from title
    const slug = generateSlug(title);

    const newRecord = await payload.create({
      collection: 'records',
      data: {
        title,
        slug,
        artist: artistId as any,
        legacyId,
        migratedAt: new Date().toISOString(),
      },
    });

    logger.debug(`Created record: ${title}`);
    return newRecord.id;
  } catch (error: any) {
    // If slug validation fails, likely a duplicate with slight title variation
    const isSlugError = error.status === 400
      && error.data?.errors?.some((e: any) => e.path === 'slug');

    if (isSlugError) {
      logger.debug(`Slug validation failed for record: ${title}, searching by slug...`);

      // Generate the slug that would be created and search for it
      const slug = generateSlug(title);

      const existingBySlug = await payload.find({
        collection: 'records',
        where: {
          slug: {
            equals: slug,
          },
        },
        limit: 1,
      });

      if (existingBySlug.docs.length > 0) {
        logger.debug(`Found existing record by slug: "${title}" -> "${slug}" (id: ${existingBySlug.docs[0].id})`);
        return existingBySlug.docs[0].id;
      }
      logger.debug(`No existing record found with slug: "${slug}"`);
    }
    // Re-throw if it's not a slug validation error or we couldn't find existing
    logger.debug(`Re-throwing error for record: ${title}, isSlugError: ${isSlugError}`);
    throw error;
  }
}

/**
 * Find a DJ by display name (case-insensitive partial match)
 * Returns the DJ ID or null if not found
 */
export async function findDJByDisplayName(
  payload: Payload,
  displayName: string,
): Promise<number | null> {
  const cleanName = stripHtmlTags(displayName).trim();

  if (!cleanName) {
    return null;
  }

  // Try exact match first
  const exactMatch = await payload.find({
    collection: 'djs',
    where: {
      displayName: {
        equals: cleanName,
      },
    },
    limit: 1,
  });

  if (exactMatch.docs.length > 0) {
    return exactMatch.docs[0].id;
  }

  // Try case-insensitive contains match
  const containsMatch = await payload.find({
    collection: 'djs',
    where: {
      displayName: {
        contains: cleanName,
      },
    },
    limit: 1,
  });

  if (containsMatch.docs.length > 0) {
    return containsMatch.docs[0].id;
  }

  return null;
}

/**
 * Find or create a song by title and artist
 * Returns the song ID
 */
export async function findOrCreateSong(
  payload: Payload,
  title: string,
  artistId?: number,
): Promise<number> {
  const cleanTitle = stripHtmlTags(title).trim();

  if (!cleanTitle) {
    throw new Error('Song title is required');
  }

  // Try to find by title and artist (if provided)
  const whereClause: any = {
    title: {
      equals: cleanTitle,
    },
  };

  if (artistId) {
    whereClause.artist = {
      equals: artistId,
    };
  }

  const existing = await payload.find({
    collection: 'songs',
    where: whereClause,
    limit: 1,
  });

  if (existing.docs.length > 0) {
    return existing.docs[0].id;
  }

  // Try to create new song
  try {
    const slug = generateSlug(cleanTitle);

    const songData: any = {
      title: cleanTitle,
      slug,
    };

    if (artistId) {
      songData.artist = artistId;
    }

    const newSong = await payload.create({
      collection: 'songs',
      data: songData,
    });

    logger.debug(`Created song: ${cleanTitle}`);
    return newSong.id;
  } catch (error: any) {
    // If slug validation fails, likely a duplicate
    const isSlugError = error.status === 400
      && error.data?.errors?.some((e: any) => e.path === 'slug');

    if (isSlugError) {
      logger.debug(`Slug validation failed for song: ${cleanTitle}, searching by slug...`);

      const slug = generateSlug(cleanTitle);

      const existingBySlug = await payload.find({
        collection: 'songs',
        where: {
          slug: {
            equals: slug,
          },
        },
        limit: 1,
      });

      if (existingBySlug.docs.length > 0) {
        logger.debug(`Found existing song by slug: "${cleanTitle}" -> "${slug}" (id: ${existingBySlug.docs[0].id})`);
        return existingBySlug.docs[0].id;
      }
    }

    logger.debug(`Re-throwing error for song: ${cleanTitle}`);
    throw error;
  }
}

/**
 * Parse an OnDemand headline to extract DJ names, artist names, and clean title
 * Returns extracted DJs, artists, and remaining title
 */
export interface ParsedOnDemandHeadline {
  djNames: string[];
  artistNames: string[];
  cleanTitle: string;
}

export function parseOnDemandHeadline(headline: string): ParsedOnDemandHeadline {
  const djNames: string[] = [];
  const artistNames: string[] = [];
  let cleanTitle = headline;

  // Common patterns for DJ mentions:
  // "Show Name with DJ Name"
  // "Show Name featuring Artist"
  // "Artist - Live Session"

  // Extract "with [Name]" pattern (usually DJs)
  const withPattern = /\bwith\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)/gi;
  let match = withPattern.exec(headline);
  while (match) {
    djNames.push(match[1].trim());
    match = withPattern.exec(headline);
  }

  // Extract "featuring [Name]" or "feat. [Name]" pattern (usually artists)
  const featPattern = /\b(?:featuring|feat\.?)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)/gi;
  match = featPattern.exec(headline);
  while (match) {
    artistNames.push(match[1].trim());
    match = featPattern.exec(headline);
  }

  // Clean up the title by removing the extracted parts
  cleanTitle = headline
    .replace(withPattern, '')
    .replace(featPattern, '')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    djNames,
    artistNames,
    cleanTitle,
  };
}
