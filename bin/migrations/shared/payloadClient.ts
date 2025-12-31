/**
 * Payload client utilities for import scripts
 * Provides connection to Payload CMS with dev/prod database selection
 */

import path from 'path';
import dotenv from 'dotenv';
import type { Config, Payload } from 'payload';
import { getPayload } from 'payload';
import { createLogger } from './logger';

const logger = createLogger('PayloadClient');

/**
 * Environment mode for database selection
 */
export type DatabaseEnv = 'dev' | 'prod';

/**
 * Get the Payload instance configured for the specified environment
 */
export async function getPayloadClient(env: DatabaseEnv = 'dev'): Promise<Payload> {
  // Load environment variables from .env.local
  dotenv.config({
    path: path.resolve(process.cwd(), '.env.local'),
    override: false,
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

  // Import the payload config
  const payloadConfigModule = await import('../../../payload.config');
  const config = payloadConfigModule.default as Config;

  // Override database connection for this import
  const importConfig: Config = {
    ...config,
    db: {
      ...config.db,
      // @ts-expect-error - pool is valid for postgres adapter
      pool: {
        connectionString: databaseUri,
        ssl:
          process.env.DATABASE_SSL === 'disable' ? undefined : { rejectUnauthorized: true },
      },
    },
  };

  const payload = await getPayload({ config: importConfig });
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
): Promise<string> {
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
      return existingByLegacyId.docs[0].id;
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
    return existing.docs[0].id;
  }

  // Create new artist
  const newArtist = await payload.create({
    collection: 'artists',
    data: {
      name,
      legacyId,
      migratedAt: new Date().toISOString(),
    },
  });

  logger.debug(`Created artist: ${name}`);
  return newArtist.id;
}

/**
 * Find or create a venue by name
 * Returns the venue ID
 */
export async function findOrCreateVenue(
  payload: Payload,
  name: string,
  legacyId?: number,
): Promise<string> {
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

  // Create new venue
  const newVenue = await payload.create({
    collection: 'venues',
    data: {
      name,
      legacyId,
      migratedAt: new Date().toISOString(),
    },
  });

  logger.debug(`Created venue: ${name}`);
  return newVenue.id;
}
