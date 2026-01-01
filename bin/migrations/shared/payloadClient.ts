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
  // Note: We import it but don't use it directly since getPayload will load it
  await import('../../../payload.config');

  const payload = await getPayload({ config: undefined as any });
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
  legacyId?: number,
): Promise<number> {
  // First try to find by legacy ID if provided
  if (legacyId !== undefined) {
    const existingByLegacyId = await payload.find({
      collection: 'artists',
      where: {
        legacyId: {
          equals: legacyId,
        },
      },
      limit: 1,
    });

    if (existingByLegacyId.docs.length > 0) {
      const artist = existingByLegacyId.docs[0];

      // If artist exists but doesn't have MusicBrainz ID, try to add it
      if (!artist.musicbrainzId) {
        try {
          const mbid = await getArtistMbid(name);
          if (mbid) {
            await payload.update({
              collection: 'artists',
              id: artist.id,
              data: {
                musicbrainzId: mbid,
              },
            });
            logger.debug(`Added MusicBrainz ID to existing artist: ${name}`);
          }
        } catch (error) {
          // Log but don't fail
          logger.debug(`Failed to update MusicBrainz ID for ${name}`);
        }
      }

      return artist.id;
    }
  }

  // Try to find by name
  const existing = await payload.find({
    collection: 'artists',
    where: {
      name: {
        equals: name,
      },
    },
    limit: 1,
  });

  if (existing.docs.length > 0) {
    const artist = existing.docs[0];

    // If artist exists but doesn't have MusicBrainz ID, try to add it
    if (!artist.musicbrainzId) {
      try {
        const mbid = await getArtistMbid(name);
        if (mbid) {
          await payload.update({
            collection: 'artists',
            id: artist.id,
            data: {
              musicbrainzId: mbid,
            },
          });
          logger.debug(`Added MusicBrainz ID to existing artist: ${name}`);
        }
      } catch (error) {
        // Log but don't fail
        logger.debug(`Failed to update MusicBrainz ID for ${name}`);
      }
    }

    return artist.id;
  }

  // Try to create new artist
  try {
    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing dashes

    // Fetch MusicBrainz ID if not provided
    let mbid = null;
    if (!legacyId) {
      // Only lookup for new artists (not during migration with legacyId)
      try {
        mbid = await getArtistMbid(name);
        if (mbid) {
          logger.debug(`Found MusicBrainz ID for ${name}: ${mbid}`);
        }
      } catch (error) {
        // Log but don't fail if MusicBrainz lookup fails
        logger.debug(`MusicBrainz lookup failed for ${name}`);
      }
    }

    const newArtist = await payload.create({
      collection: 'artists',
      data: {
        name,
        slug,
        musicbrainzId: mbid || undefined,
        legacyId,
        migratedAt: new Date().toISOString(),
      },
    });

    logger.debug(`Created artist: ${name}`);
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

    // If slug validation fails, likely a duplicate with slight name variation
    const isSlugError = error.status === 400
      && error.data?.errors?.some((e: any) => e.path === 'slug');

    if (isSlugError) {
      console.error(`[DEBUG] Slug validation failed for artist: ${name}, searching by slug...`);

      // Generate the slug that would be created and search for it
      const slug = name
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/--+/g, '-')
        .replace(/^-+|-+$/g, ''); // Remove leading/trailing dashes

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
    // Re-throw if it's not a slug validation error or we couldn't find existing
    logger.debug(`Re-throwing error for artist: ${name}, isSlugError: ${isSlugError}`);
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
  legacyId?: number,
): Promise<number> {
  // First try to find by legacy ID if provided
  if (legacyId !== undefined) {
    const existingByLegacyId = await payload.find({
      collection: 'venues',
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
    collection: 'venues',
    where: {
      name: {
        equals: name,
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
    const slug = name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing dashes

    const newVenue = await payload.create({
      collection: 'venues',
      data: {
        name,
        slug,
        legacyId,
        migratedAt: new Date().toISOString(),
      },
    });

    logger.debug(`Created venue: ${name}`);
    return newVenue.id;
  } catch (error: any) {
    // If slug validation fails, likely a duplicate with slight name variation
    const isSlugError = error.status === 400
      && error.data?.errors?.some((e: any) => e.path === 'slug');

    if (isSlugError) {
      logger.debug(`Slug validation failed for venue: ${name}, searching by slug...`);

      // Generate the slug that would be created and search for it
      const slug = name
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/--+/g, '-')
        .replace(/^-+|-+$/g, ''); // Remove leading/trailing dashes

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
        equals: name,
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
    const slug = name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing dashes

    const newPerson = await payload.create({
      collection: 'people',
      data: {
        name,
        slug,
        legacyId,
        migratedAt: new Date().toISOString(),
      },
    });

    logger.debug(`Created person: ${name}`);
    return newPerson.id;
  } catch (error: any) {
    // If slug validation fails, likely a duplicate with slight name variation
    const isSlugError = error.status === 400
      && error.data?.errors?.some((e: any) => e.path === 'slug');

    if (isSlugError) {
      logger.debug(`Slug validation failed for person: ${name}, searching by slug...`);

      // Generate the slug that would be created and search for it
      const slug = name
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/--+/g, '-')
        .replace(/^-+|-+$/g, ''); // Remove leading/trailing dashes

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
    const slug = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing dashes

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
      const slug = title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/--+/g, '-')
        .replace(/^-+|-+$/g, ''); // Remove leading/trailing dashes

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
