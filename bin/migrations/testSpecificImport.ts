/**
 * Test importing a specific failing post to see the error
 */

import { connectToDatabase } from './database';
import { getPayloadClient } from './shared/payloadClient';
import { createLogger } from './shared/logger';
import { convertHtmlToLexical } from './shared/importUtils';
import { slugify } from './shared/slugify';

const logger = createLogger('TestImport');

async function testImport() {
  const connection = await connectToDatabase();
  const payload = await getPayloadClient('dev');
  
  // Try importing ID 7 which is not deleted
  const testId = 7;
  
  const [rows] = await connection.query(
    'SELECT * FROM stories WHERE id = ?',
    [testId],
  );
  
  const story = (rows as any[])[0];
  
  logger.info(`Testing import of post ${testId}: "${story.headline}"`);
  logger.info(`  Deleted: ${story.deleted}`);
  logger.info(`  Start: ${story.start_date}`);
  logger.info(`  End: ${story.end_date}`);
  logger.info(`  Content: ${story.story.substring(0, 200)}...`);
  
  try {
    const content = convertHtmlToLexical(story.story);
    logger.info('✓ Content converted successfully');
    
    const date = new Date(story.start_date);
    const datePrefix = date.toISOString().split('T')[0];
    const headlineSlug = slugify(story.headline);
    const slug = `${datePrefix}--${headlineSlug}`;
    
    logger.info(`  Slug: ${slug}`);
    
    const result = await payload.create({
      collection: 'posts',
      data: {
        headline: story.headline,
        slug,
        startDate: story.start_date,
        endDate: story.end_date,
        content,
        priority: story.priority || 0,
        legacyId: story.id,
        _status: 'published',
      },
    });
    
    logger.info(`✓ Successfully created post ${result.id}`);
  } catch (error: any) {
    logger.error('✗ Failed to import:');
    logger.error(error.message);
    if (error.data) {
      logger.error('Validation errors:', JSON.stringify(error.data, null, 2));
    }
  }
  
  await connection.end();
  process.exit(0);
}

testImport().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
