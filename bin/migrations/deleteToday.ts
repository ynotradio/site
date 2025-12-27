/**
 * Script to delete concerts and artists created today
 *
 * Usage: tsx bin/migrations/deleteToday.ts
 */

import { createClient } from '@sanity/client';
import { sanityConfig } from './config';
import { createLogger } from './shared/logger';

const logger = createLogger('DeleteToday');

async function deleteTodaysData(): Promise<void> {
  try {
    logger.info('Starting deletion of today\'s concerts and artists...');

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

    // Get today's date in ISO format (YYYY-MM-DD)
    const today = new Date().toISOString().split('T')[0];
    logger.info(`Searching for documents created on: ${today}`);

    // Query for concerts created today
    const concertsQuery = `*[_type == "concert" && _createdAt >= "${today}T00:00:00Z"] { _id, date, title, artists[]->{name} }`;
    const concerts = await client.fetch(concertsQuery);
    logger.info(`Found ${concerts.length} concerts created today`);

    // Query for artists created today
    const artistsQuery = `*[_type == "artist" && _createdAt >= "${today}T00:00:00Z"] { _id, name, "concertCount": count(*[_type == "concert" && references(^._id)]) }`;
    const artists = await client.fetch(artistsQuery);
    logger.info(`Found ${artists.length} artists created today`);

    // Show what will be deleted
    if (concerts.length > 0) {
      logger.info('\nConcerts to be deleted:');
      concerts.forEach((concert: any) => {
        const artistNames = concert.artists?.map((a: any) => a.name).join(', ') || 'No artists';
        logger.info(`  - ${concert._id}: ${concert.title || concert.date} (${artistNames})`);
      });
    }

    if (artists.length > 0) {
      logger.info('\nArtists to be deleted:');
      artists.forEach((artist: any) => {
        logger.info(`  - ${artist._id}: ${artist.name} (${artist.concertCount} concerts)`);
      });
    }

    if (concerts.length === 0 && artists.length === 0) {
      logger.info('No concerts or artists found created today. Nothing to delete.');
      return;
    }

    // Confirm deletion
    logger.info(`\nTotal: ${concerts.length} concerts and ${artists.length} artists will be deleted.`);
    logger.info('Starting deletion in 3 seconds... (Press Ctrl+C to cancel)');
    await new Promise((resolve) => {
      setTimeout(resolve, 3000);
    });

    // Delete concerts first
    let concertsDeleted = 0;
    for (const concert of concerts) {
      try {
        await client.delete(concert._id);
        concertsDeleted++;
        logger.info(`Deleted concert: ${concert._id}`);
      } catch (error) {
        logger.error(`Failed to delete concert ${concert._id}:`, error as Error);
      }
    }

    // Delete artists
    let artistsDeleted = 0;
    for (const artist of artists) {
      try {
        // Check if artist still has concerts referencing it
        const concertCount = await client.fetch(
          'count(*[_type == "concert" && references($artistId)])',
          { artistId: artist._id },
        );

        if (concertCount > 0) {
          logger.warn(`Skipping artist ${artist.name} - still referenced by ${concertCount} concerts`);
        } else {
          await client.delete(artist._id);
          artistsDeleted += 1;
          logger.info(`Deleted artist: ${artist._id} (${artist.name})`);
        }
      } catch (error) {
        logger.error(`Failed to delete artist ${artist._id}:`, error as Error);
      }
    }

    logger.info('\n✅ Deletion complete!');
    logger.info(`   Concerts deleted: ${concertsDeleted}/${concerts.length}`);
    logger.info(`   Artists deleted: ${artistsDeleted}/${artists.length}`);

    if (artistsDeleted < artists.length) {
      logger.warn(`   ${artists.length - artistsDeleted} artists were not deleted because they're still referenced by concerts`);
    }
  } catch (error) {
    logger.error('Error during deletion:', error as Error);
  }
}

// Run the deletion
deleteTodaysData();

// Handle process exit
process.on('exit', () => {
  logger.info('Deletion process complete.');
});
