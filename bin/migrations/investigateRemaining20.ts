/**
 * Investigate the 20 failing posts
 */

import { connectToDatabase } from './database';
import { createLogger } from './shared/logger';

const logger = createLogger('InvestigateFailures');

const missingIds = [28, 142, 227, 243, 261, 349, 363, 371, 373, 389, 397, 426, 429, 440, 445, 540, 585, 740, 774, 779];

async function investigate() {
  const connection = await connectToDatabase();
  
  logger.info(`Investigating ${missingIds.length} failing posts...\n`);
  
  let deletedCount = 0;
  let emptyContent = 0;
  let otherIssues = 0;
  
  for (const id of missingIds) {
    const [rows] = await connection.query(
      'SELECT id, headline, deleted, story FROM stories WHERE id = ?',
      [id],
    );
    
    const story = (rows as any[])[0];
    
    if (!story) {
      logger.info(`ID ${id}: NOT FOUND IN DATABASE`);
      otherIssues++;
      continue;
    }
    
    let issue = '';
    if (story.deleted === 'y') {
      issue = '❌ DELETED';
      deletedCount++;
    } else if (!story.story || story.story.trim() === '') {
      issue = '⚠️  EMPTY CONTENT';
      emptyContent++;
    } else {
      issue = '❓ OTHER';
      otherIssues++;
    }
    
    logger.info(`ID ${id}: ${issue} - "${story.headline}"`);
    if (issue === '❓ OTHER') {
      logger.info(`  Content preview: ${(story.story || '').substring(0, 100)}`);
    }
  }
  
  logger.info(`\n📊 Failure Analysis:`);
  logger.info(`  Deleted posts: ${deletedCount}`);
  logger.info(`  Empty content: ${emptyContent}`);
  logger.info(`  Other issues: ${otherIssues}`);
  logger.info(`  Total: ${deletedCount + emptyContent + otherIssues}`);
  
  await connection.end();
  process.exit(0);
}

investigate().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
