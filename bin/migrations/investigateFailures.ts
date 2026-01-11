/**
 * Investigate why specific posts fail to import
 */

import { connectToDatabase } from './database';
import { createLogger } from './shared/logger';

const logger = createLogger('InvestigateFailures');

async function investigate() {
  const connection = await connectToDatabase();
  
  // Check a few missing IDs to see if there's a pattern
  const missingIds = [1, 7, 8, 11, 13, 15]; // First few missing
  
  logger.info('Investigating missing post IDs...\n');
  
  for (const id of missingIds) {
    const [rows] = await connection.query(
      'SELECT id, headline, start_date, end_date, deleted, story FROM stories WHERE id = ?',
      [id],
    );
    
    const story = (rows as any[])[0];
    
    if (!story) {
      logger.info(`ID ${id}: NOT FOUND IN DATABASE`);
      continue;
    }
    
    logger.info(`ID ${id}: "${story.headline}"`);
    logger.info(`  Start: ${story.start_date}, End: ${story.end_date}`);
    logger.info(`  Deleted: ${story.deleted}`);
    logger.info(`  Content length: ${story.story?.length || 0} chars`);
    logger.info(`  Content preview: ${(story.story || '').substring(0, 100)}`);
    logger.info('');
  }
  
  // Check if deleted stories are being filtered
  const [deletedCount] = await connection.query(
    "SELECT COUNT(*) as count FROM stories WHERE deleted = 'y'",
  );
  
  const [notDeletedCount] = await connection.query(
    "SELECT COUNT(*) as count FROM stories WHERE deleted != 'y' OR deleted IS NULL",
  );
  
  logger.info(`\n📊 Deleted Status:`);
  logger.info(`  Deleted (deleted='y'): ${(deletedCount as any)[0].count}`);
  logger.info(`  Not deleted: ${(notDeletedCount as any)[0].count}`);
  
  await connection.end();
  process.exit(0);
}

investigate().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
