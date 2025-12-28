/**
 * Fix missing _key properties in artist reference arrays for records
 *
 * This script adds _key properties to all record.artists array items
 * that are missing them.
 */

import { createClient } from '@sanity/client';
import { sanityConfig } from './config';
import { createLogger } from './shared/logger';

const logger = createLogger('FixRecordArtistKeys');

interface RecordDoc {
  _id: string;
  _rev: string;
  artists?: Array<{
    _type: string;
    _ref: string;
    _key?: string;
  }>;
}

async function fixRecordArtistKeys(): Promise<void> {
  try {
    logger.info('Starting fix for missing _key in record.artists arrays...');

    // Check if Sanity token is provided
    if (!sanityConfig.token) {
      logger.error('No Sanity API token provided. Set SANITY_API_TOKEN environment variable.');
      return;
    }

    // Create Sanity client
    const client = createClient({
      projectId: sanityConfig.projectId,
      dataset: sanityConfig.dataset,
      token: sanityConfig.token,
      apiVersion: sanityConfig.apiVersion,
      useCdn: false,
    });

    // Fetch all records with artists arrays
    const records = await client.fetch<RecordDoc[]>(
      '*[_type == "record" && defined(artists)]{ _id, _rev, artists }',
    );

    logger.info(`Found ${records.length} records with artist arrays`);

    let fixed = 0;
    let skipped = 0;

    // Process each record
    for (const record of records) {
      if (!record.artists || record.artists.length === 0) {
        skipped += 1;
        // eslint-disable-next-line no-continue
        continue;
      }

      // Check if any items are missing _key
      const needsFix = record.artists.some((artist) => !artist._key);

      if (!needsFix) {
        skipped += 1;
        // eslint-disable-next-line no-continue
        continue;
      }

      // Add _key to items that don't have it
      const fixedArtists = record.artists.map((artist) => {
        if (artist._key) {
          return artist;
        }
        return {
          ...artist,
          _key: artist._ref, // Use the reference ID as the key
        };
      });

      // Update the document
      try {
        // eslint-disable-next-line no-await-in-loop
        await client
          .patch(record._id)
          .set({ artists: fixedArtists })
          .commit();

        fixed += 1;
        logger.info(`Fixed record: ${record._id}`);
      } catch (error) {
        logger.error(`Failed to fix record ${record._id}:`, error as Error);
      }
    }

    logger.info('\n=== Summary ===');
    logger.info(`Total records: ${records.length}`);
    logger.info(`Fixed: ${fixed}`);
    logger.info(`Skipped (already had keys): ${skipped}`);
    logger.info('\nDone!');
  } catch (error) {
    logger.error('Error during fix process:', error as Error);
  }
}

// Run the fix
fixRecordArtistKeys();
