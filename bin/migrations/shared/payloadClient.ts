/**
 * Payload client utilities for import scripts
 * Provides connection to Payload CMS with database selection
 */

import path from 'path';
import dotenv from 'dotenv';
import type { Payload } from 'payload';
import { getPayload } from 'payload';
import { createLogger } from './logger';
import { getArtistMbid, getRecordingMbid } from './musicbrainz';
import { generateSlug, generateMusicSlug, stripHtmlTags } from './importUtils';

const logger = createLogger('PayloadClient');

interface PayloadFieldError {
  status?: number;
  data?: {
    errors?: Array<{ path: string }>;
  };
}

function isFieldError(error: unknown, field: string): boolean {
  const err = error as PayloadFieldError;
  return err?.status === 400 && (err?.data?.errors?.some((e) => e.path === field) ?? false);
}

async function findDocBySlug(
  payload: Payload,
  collection: string,
  slug: string,
): Promise<number | null> {
  const result = await payload.find({
    collection,
    where: { slug: { equals: slug } },
    limit: 1,
  });
  return result.docs.length > 0 ? (result.docs[0].id as number) : null;
}

function getDatabaseUri(target: PostgresTarget): string {
  if (target === 'prod-neon' || target === 'prod') {
    const uri = process.env.NEON_PROD_DATABASE_URL;
    if (!uri) {
      throw new Error(
        `Database URI not found for target "${target}". Please set NEON_PROD_DATABASE_URL in .env.local`,
      );
    }
    return uri;
  }
  if (target === 'dev-neon' || target === 'dev') {
    const uri = process.env.NEON_DEV_DATABASE_URL;
    if (!uri) {
      throw new Error(
        `Database URI not found for target "${target}". Please set NEON_DEV_DATABASE_URL in .env.local`,
      );
    }
    return uri;
  }
  const uri = process.env.NEON_DEV_DATABASE_URL || process.env.DATABASE_URI;
  if (!uri) {
    throw new Error(
      `Database URI not found for target "${target}". Please set NEON_DEV_DATABASE_URL or DATABASE_URI in .env.local`,
    );
  }
  return uri;
}

export { getDatabaseUri };

export type PostgresTarget = 'local-postgres' | 'prod-neon' | 'dev-neon' | 'dev' | 'prod';

/**
 * Get the Payload instance configured for the specified target database
 *
 * @param target - 'prod-neon' for production Neon, 'local-postgres' for local/dev
 */
export async function getPayloadClient(target: PostgresTarget = 'prod-neon'): Promise<Payload> {
  // NOTE: Scripts that call this must run with
  //   `yarn tsx --import ./bin/preload-nextenv-fix.mjs <script>.ts`
  // Otherwise payload's collection imports transitively load `bin/loadEnv.js`,
  // which crashes under tsx because of an @next/env default-export interop bug.
  // See bin/preload-nextenv-fix.mjs for the full explanation.

  // Load environment variables from .env.local with override
  dotenv.config({
    path: path.resolve(process.cwd(), '.env.local'),
    override: true,
  });

  // Select database URL based on target
  const databaseUri = getDatabaseUri(target);

  logger.info(`Connecting to ${target} database...`);

  // Override DATABASE_URI before importing config
  process.env.DATABASE_URI = databaseUri;

  // Import the payload config (it will use the overridden DATABASE_URI)
  // Import and pass the config directly to getPayload to ensure it's available
  const payloadConfigModule = await import('../../../payload.config');
  const payloadConfig = payloadConfigModule.default ?? payloadConfigModule;

  const payload = await getPayload({ config: payloadConfig as any });
  logger.info(`Connected to ${target} database successfully`);

  return payload;
}

/**
 * Find or create an artist by name
 * Returns the artist ID
 */
export async function findOrCreateArtist(payload: Payload, name: string): Promise<number> {
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

  try {
    let mbid: string | null = null;
    try {
      mbid = await getArtistMbid(cleanName);
      if (mbid) logger.debug(`Found MusicBrainz ID for ${cleanName}: ${mbid}`);
    } catch {
      logger.debug(`MusicBrainz lookup failed for ${cleanName}`);
    }

    const newArtist = await payload.create({
      collection: 'artists',
      data: {
        name: cleanName,
        slug: generateSlug(cleanName),
        musicbrainzId: mbid || undefined,
      },
    });

    logger.debug(`Created artist: ${cleanName}`);
    return newArtist.id;
  } catch (error: any) {
    logger.debug(
      `Error creating artist "${name}": status=${error.status}, errors=${JSON.stringify(error.data?.errors)}`,
    );

    const isMbidError = isFieldError(error, 'musicbrainzId');
    const isSlugError = isFieldError(error, 'slug');
    const isNameError = isFieldError(error, 'name');

    if (isNameError) {
      logger.debug(`Name conflict for "${name}" (possible race condition), retrying find`);
      const retryExisting = await payload.find({
        collection: 'artists',
        where: { name: { equals: cleanName } },
        limit: 1,
      });
      if (retryExisting.docs.length > 0) {
        logger.debug(
          `Found existing artist after race condition: "${name}" (id: ${retryExisting.docs[0].id})`,
        );
        return retryExisting.docs[0].id;
      }
    }

    if (isMbidError) {
      logger.debug(`MusicBrainz ID conflict for "${name}", retrying without MBID`);
      try {
        const newArtist = await payload.create({
          collection: 'artists',
          data: { name: cleanName, slug: generateSlug(cleanName) },
        });
        logger.debug(`Created artist without MBID: ${cleanName}`);
        return newArtist.id;
      } catch (retryError) {
        if (isFieldError(retryError, 'slug')) {
          const slug = generateSlug(cleanName);
          const id = await findDocBySlug(payload, 'artists', slug);
          if (id !== null) {
            logger.debug(`Found existing artist by slug after MBID retry: "${name}" (id: ${id})`);
            return id;
          }
        }
        throw retryError;
      }
    }

    if (isSlugError) {
      logger.debug(`Slug validation failed for artist: ${name}, searching by slug...`);
      const slug = generateSlug(name);
      const id = await findDocBySlug(payload, 'artists', slug);
      if (id !== null) {
        logger.debug(`Found existing artist by slug: "${name}" -> "${slug}" (id: ${id})`);
        return id;
      }
      logger.debug(`No existing artist found with slug: "${slug}"`);
    }

    logger.debug(`Re-throwing error for artist: ${name}`);
    throw error;
  }
}

/**
 * Find or create a venue by name
 * Returns the venue ID
 */
export async function findOrCreateVenue(payload: Payload, name: string): Promise<number> {
  // Strip HTML tags from name
  const cleanName = stripHtmlTags(name);

  const existing = await payload.find({
    collection: 'venues',
    where: { name: { equals: cleanName } },
    limit: 1,
  });

  if (existing.docs.length > 0) {
    return existing.docs[0].id;
  }

  try {
    const newVenue = await payload.create({
      collection: 'venues',
      data: { name: cleanName, slug: generateSlug(cleanName) },
    });

    logger.debug(`Created venue: ${cleanName}`);
    return newVenue.id;
  } catch (error: any) {
    const isSlugError = isFieldError(error, 'slug');

    if (isSlugError) {
      logger.debug(`Slug validation failed for venue: ${name}, searching by slug...`);
      const slug = generateSlug(name);
      const id = await findDocBySlug(payload, 'venues', slug);
      if (id !== null) {
        logger.debug(`Found existing venue by slug: "${name}" -> "${slug}" (id: ${id})`);
        return id;
      }
      logger.debug(`No existing venue found with slug: "${slug}"`);
    }
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

  if (legacyId !== undefined) {
    const existingByLegacyId = await payload.find({
      collection: 'people',
      where: { legacyId: { equals: legacyId } },
      limit: 1,
    });
    if (existingByLegacyId.docs.length > 0) return existingByLegacyId.docs[0].id;
  }

  const existing = await payload.find({
    collection: 'people',
    where: { name: { equals: cleanName } },
    limit: 1,
  });

  if (existing.docs.length > 0) {
    return existing.docs[0].id;
  }

  try {
    const newPerson = await payload.create({
      collection: 'people',
      data: {
        name: cleanName,
        slug: generateSlug(cleanName),
        legacyId,
        migratedAt: new Date().toISOString(),
      },
    });

    logger.debug(`Created person: ${cleanName}`);
    return newPerson.id;
  } catch (error: any) {
    const isSlugError = isFieldError(error, 'slug');

    if (isSlugError) {
      logger.debug(`Slug validation failed for person: ${name}, searching by slug...`);
      const slug = generateSlug(name);
      const id = await findDocBySlug(payload, 'people', slug);
      if (id !== null) {
        logger.debug(`Found existing person by slug: "${name}" -> "${slug}" (id: ${id})`);
        return id;
      }
      logger.debug(`No existing person found with slug: "${slug}"`);
    }
    logger.debug(`Re-throwing error for person: ${name}, isSlugError: ${isSlugError}`);
    throw error;
  }
}

/**
 * Find a DJ by legacy ID
 * Returns the DJ ID or null if not found
 */
export async function findDJByLegacyId(payload: Payload, legacyId: number): Promise<number | null> {
  const existing = await payload.find({
    collection: 'djs',
    where: { legacyId: { equals: legacyId } },
    limit: 1,
  });

  return existing.docs.length > 0 ? existing.docs[0].id : null;
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
  if (legacyId !== undefined) {
    const existingByLegacyId = await payload.find({
      collection: 'records',
      where: { legacyId: { equals: legacyId } },
      limit: 1,
    });
    if (existingByLegacyId.docs.length > 0) return existingByLegacyId.docs[0].id;
  }

  const existing = await payload.find({
    collection: 'records',
    where: {
      and: [{ title: { equals: title } }, { artist: { equals: artistId } }],
    },
    limit: 1,
  });

  if (existing.docs.length > 0) {
    return existing.docs[0].id;
  }

  try {
    const newRecord = await payload.create({
      collection: 'records',
      data: {
        title,
        artist: artistId as any,
        legacyId,
        migratedAt: new Date().toISOString(),
      },
    });

    logger.debug(`Created record: ${title}`);
    return newRecord.id;
  } catch (error: any) {
    const isSlugError = isFieldError(error, 'slug');

    if (isSlugError) {
      logger.debug(`Slug validation failed for record: ${title}, searching by slug...`);

      let artistName = '';
      try {
        const artist = await payload.findByID({ collection: 'artists', id: artistId });
        artistName = artist?.name || '';
      } catch {
        /* ignore */
      }

      const slug = generateMusicSlug(artistName, title);
      const id = await findDocBySlug(payload, 'records', slug);
      if (id !== null) {
        logger.debug(`Found existing record by slug: "${title}" -> "${slug}" (id: ${id})`);
        return id;
      }
      logger.debug(`No existing record found with slug: "${slug}"`);
    }
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

  const where = {
    title: { equals: cleanTitle },
    ...(artistId && { artist: { equals: artistId } }),
  };

  const existing = await payload.find({
    collection: 'songs',
    where,
    limit: 1,
  });

  if (existing.docs.length > 0) {
    return existing.docs[0].id;
  }

  let recordingMbid: string | null = null;
  let artistName = '';
  if (artistId) {
    try {
      const artist = await payload.findByID({ collection: 'artists', id: artistId });
      artistName = artist?.name || '';
    } catch {
      /* ignore */
    }
  }
  try {
    recordingMbid = await getRecordingMbid(cleanTitle, artistName || undefined);
  } catch {
    logger.debug(`MusicBrainz recording lookup failed for "${cleanTitle}"`);
  }

  const baseSongData = {
    title: cleanTitle,
    ...(artistId && { artist: artistId }),
  };

  const resolveBySlug = async (resolvedArtistName: string) => {
    const slug = generateMusicSlug(resolvedArtistName, cleanTitle);
    return findDocBySlug(payload, 'songs', slug);
  };

  const fetchArtistName = async (): Promise<string> => {
    if (!artistId) return '';
    try {
      const artist = await payload.findByID({ collection: 'artists', id: artistId });
      return artist?.name || '';
    } catch {
      return '';
    }
  };

  try {
    const newSong = await payload.create({
      collection: 'songs',
      data: { ...baseSongData, musicbrainzId: recordingMbid || undefined },
    });
    logger.debug(`Created song: ${cleanTitle}`);
    return newSong.id;
  } catch (error: any) {
    const isMbidError = isFieldError(error, 'musicbrainzId');

    if (isMbidError) {
      logger.debug(`MusicBrainz ID conflict for song "${cleanTitle}", retrying without MBID`);
      try {
        const newSong = await payload.create({ collection: 'songs', data: baseSongData });
        logger.debug(`Created song without MBID: ${cleanTitle}`);
        return newSong.id;
      } catch (retryError) {
        if (isFieldError(retryError, 'slug')) {
          const name = artistName || (await fetchArtistName());
          const id = await resolveBySlug(name);
          if (id !== null) {
            logger.debug(`Found existing song by slug after MBID retry: "${cleanTitle}" (id: ${id})`);
            return id;
          }
        }
        throw retryError;
      }
    }

    if (isFieldError(error, 'slug')) {
      logger.debug(`Slug validation failed for song: ${cleanTitle}, searching by slug...`);
      const name = artistName || (await fetchArtistName());
      const id = await resolveBySlug(name);
      if (id !== null) {
        logger.debug(`Found existing song by slug: "${cleanTitle}" (id: ${id})`);
        return id;
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
  const withPattern = /\bwith\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)/gi;
  const featPattern = /\b(?:featuring|feat\.?)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)/gi;

  const djNames = [...headline.matchAll(withPattern)].map((m) => m[1].trim());
  const artistNames = [...headline.matchAll(featPattern)].map((m) => m[1].trim());

  const cleanTitle = headline
    .replace(withPattern, '')
    .replace(featPattern, '')
    .replace(/\s+/g, ' ')
    .trim();

  return { djNames, artistNames, cleanTitle };
}
