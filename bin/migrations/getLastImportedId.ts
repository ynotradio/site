/**
 * Helper script to find the last imported concert ID from Sanity
 * This helps determine where to resume an incremental import
 *
 * Usage: npm run get-last-concert-id
 */

import { createClient } from '@sanity/client';
import { sanityConfig } from './config';
import { createLogger } from './shared/logger';

const logger = createLogger('GetLastImportedId');

async function getLastImportedId(): Promise<void> {
  try {
    // Check if Sanity token is provided
    if (!sanityConfig.token) {
      logger.error('No Sanity API token provided. Please set the SANITY_API_TOKEN environment variable.');
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

    // Query for the highest legacyId in concerts
    const query = `*[_type == "concert" && defined(legacyId)] | order(legacyId desc) [0] {
      _id,
      legacyId,
      date,
      title,
      artists[]->{name}
    }`;

    const lastConcert = await client.fetch(query);

    if (!lastConcert) {
      logger.info('No concerts found in Sanity with legacyId.');
      logger.info('This might be a fresh import. You can start from the beginning.');
      return;
    }

    const artistNames = lastConcert.artists?.map((a: any) => a.name).join(', ') || 'No artists';

    logger.info('\nLast imported concert:');
    logger.info(`  Legacy ID: ${lastConcert.legacyId}`);
    logger.info(`  Sanity ID: ${lastConcert._id}`);
    logger.info(`  Date: ${lastConcert.date || 'No date'}`);
    logger.info(`  Title: ${lastConcert.title || 'No title'}`);
    logger.info(`  Artists: ${artistNames}`);
    logger.info('\nTo resume import from the next concert, run:');
    logger.info(`  npm run import:concerts -- --start-id=${lastConcert.legacyId + 1}`);
    logger.info('\nOr to re-import from this concert onwards:');
    logger.info(`  npm run import:concerts -- --start-id=${lastConcert.legacyId}`);
  } catch (error) {
    logger.error('Error fetching last imported ID:', error as Error);
  }
}

// Run the script
getLastImportedId();

// Handle process exit
process.on('exit', () => {
  logger.info('Script complete.');
});
