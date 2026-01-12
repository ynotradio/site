/**
 * Debug import process - run with detailed logging and smaller batches
 */

import { connectToDatabase } from './database';
import { getPayloadClient } from './shared/payloadClient';
import { createLogger } from './shared/logger';

const logger = createLogger('ImportDebug');

async function debugImport() {
  logger.info('Starting import debug...');
  
  const connection = await connectToDatabase();
  const payload = await getPayloadClient('dev');
  
  // Get total counts
  const [storyCount] = await connection.query('SELECT COUNT(*) as count FROM stories');
  const [customTextCount] = await connection.query(
    'SELECT COUNT(*) as count FROM custom_texts WHERE status = ?',
    ['active'],
  );
  
  logger.info(`MySQL totals: ${(storyCount as any)[0].count} stories, ${(customTextCount as any)[0].count} custom_texts`);
  
  // Get Payload counts
  const payloadStories = await payload.find({
    collection: 'posts',
    where: { legacyId: { less_than: 10000 } },
    limit: 0,
  });
  
  const payloadCustomTexts = await payload.find({
    collection: 'posts',
    where: { legacyId: { greater_than_equal: 10000 } },
    limit: 0,
  });
  
  logger.info(`Payload totals: ${payloadStories.totalDocs} stories, ${payloadCustomTexts.totalDocs} custom_texts`);
  
  // Find gaps - which legacyIds are missing?
  const [allStories] = await connection.query('SELECT id FROM stories ORDER BY id ASC');
  const storyIds = (allStories as any[]).map((s) => s.id);
  
  const importedStories = await payload.find({
    collection: 'posts',
    where: { legacyId: { less_than: 10000 } },
    limit: 1000,
    pagination: false,
  });
  
  const importedIds = new Set(importedStories.docs.map((p: any) => p.legacyId));
  const missingIds = storyIds.filter((id) => !importedIds.has(id));
  
  logger.info(`\n📊 Missing Stories Analysis:`);
  logger.info(`Total missing: ${missingIds.length}`);
  logger.info(`First 20 missing IDs: ${missingIds.slice(0, 20).join(', ')}`);
  logger.info(`Last 20 missing IDs: ${missingIds.slice(-20).join(', ')}`);
  
  // Check if there's a pattern - are they all at the end?
  if (missingIds.length > 0) {
    const maxImportedId = Math.max(...Array.from(importedIds));
    const minMissingId = Math.min(...missingIds);
    
    logger.info(`\n📈 Import Range:`);
    logger.info(`Highest imported ID: ${maxImportedId}`);
    logger.info(`Lowest missing ID: ${minMissingId}`);
    
    if (minMissingId > maxImportedId) {
      logger.info(`✅ All missing IDs are AFTER the highest imported ID`);
      logger.info(`   This suggests the import stopped early, not random failures`);
    } else {
      logger.info(`⚠️  Missing IDs are scattered - there are gaps in the import`);
    }
  }
  
  // Check the last few imported posts to see if there's a pattern
  const lastImported = await payload.find({
    collection: 'posts',
    where: { legacyId: { less_than: 10000 } },
    sort: '-legacyId',
    limit: 10,
  });
  
  logger.info(`\n🔍 Last 10 imported stories (by legacyId):`);
  lastImported.docs.forEach((post: any) => {
    logger.info(`  ID ${post.legacyId}: ${post.headline.substring(0, 50)}`);
  });
  
  await connection.end();
  process.exit(0);
}

debugImport().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
