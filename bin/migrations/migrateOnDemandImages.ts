/**
 * Migration script to convert OnDemand image URLs to media relationships
 * 
 * This script:
 * 1. Adds image_id column to ondemand table (if not exists)
 * 2. For each ondemand record with an image URL, creates/finds a media record
 * 3. Updates ondemand record to reference the media record via image_id
 * 
 * Run with: yarn tsx bin/migrations/migrateOnDemandImages.ts
 */

import dotenv from 'dotenv';
import { getPayloadClient } from './shared/payloadClient';
import { importImageFromUrl } from './shared/mediaImporter';
import { createLogger } from './shared/logger';
import postgres from 'postgres';

// Load environment variables
dotenv.config({ path: '.env.local' });

const logger = createLogger('migrateOnDemandImages');

interface OnDemandRecord {
  id: number;
  image: string;
  headline: string;
}

async function main() {
  logger.info('Starting OnDemand image migration...');
  
  // Get database connection
  const dbUrl = process.env.NEON_DEV_DATABASE_URL;
  if (!dbUrl) {
    throw new Error('NEON_DEV_DATABASE_URL environment variable not set');
  }
  
  const sql = postgres(dbUrl);
  
  try {
    // Check if image_id column exists
    const columnCheck = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'ondemand' AND column_name = 'image_id'
    `;
    
    if (columnCheck.length === 0) {
      logger.info('Adding image_id column to ondemand table...');
      await sql`
        ALTER TABLE ondemand 
        ADD COLUMN image_id INTEGER REFERENCES media(id)
      `;
      logger.info('✓ image_id column added');
    } else {
      logger.info('image_id column already exists');
    }
    
    // Get payload client
    const payload = await getPayloadClient();
    
    // Get all ondemand records with image URLs
    const records = await sql<OnDemandRecord[]>`
      SELECT id, image, headline 
      FROM ondemand 
      WHERE image IS NOT NULL 
        AND image != '' 
        AND image_id IS NULL
      ORDER BY id
    `;
    
    logger.info(`Found ${records.length} ondemand records to migrate`);
    
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    
    for (const record of records) {
      try {
        logger.debug(`Processing ondemand ${record.id}: ${record.headline}`);
        
        // Import/find the image
        const imageResult = await importImageFromUrl(payload, record.image, {
          alt: `On-demand: ${record.headline}`,
          caption: '',
          legacyUrl: record.image,
        });
        
        if (imageResult.success && imageResult.mediaId) {
          // Update ondemand record with media ID
          await sql`
            UPDATE ondemand 
            SET image_id = ${parseInt(imageResult.mediaId, 10)}
            WHERE id = ${record.id}
          `;
          
          logger.info(`✓ Migrated ondemand ${record.id} -> media ${imageResult.mediaId}`);
          successCount++;
        } else {
          logger.warn(`Failed to import image for ondemand ${record.id}: ${imageResult.error}`);
          errorCount++;
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Error processing ondemand ${record.id}: ${errorMsg}`);
        errorCount++;
      }
    }
    
    logger.info('Migration complete!');
    logger.info(`✓ Success: ${successCount}`);
    logger.info(`- Skipped: ${skipCount}`);
    logger.info(`✗ Errors: ${errorCount}`);
    
  } finally {
    await sql.end();
  }
}

main().catch((error) => {
  logger.error('Migration failed:', error);
  process.exit(1);
});
