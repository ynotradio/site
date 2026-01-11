#!/usr/bin/env tsx
/**
 * Debug post 251 to see what's causing the validation error
 */

import { connectToDatabase, type Post } from './database';
import { convertHtmlToLexical } from './shared/importUtils';
import { convertHtmlToLexicalEnhanced } from './shared/enhancedHtmlToLexical';
import { createLogger } from './shared/logger';

const logger = createLogger('DebugPost');

async function debugPost251() {
  const connection = await connectToDatabase();

  try {
    // Get post 251 - check both tables
    let rows: any[] = [];
    const [customTextRows] = await connection.execute<any[]>(
      'SELECT *, \'custom_text\' as source FROM custom_texts WHERE id = 251 LIMIT 1',
    );

    if (customTextRows.length > 0) {
      rows = customTextRows;
    } else {
      const [storyRows] = await connection.execute<any[]>(
        'SELECT *, \'story\' as source FROM stories WHERE id = 251 LIMIT 1',
      );
      rows = storyRows;
    }

    if (rows.length === 0) {
      logger.error('Post 251 not found');
      return;
    }

    const post = rows[0] as Post;

    logger.info(`Post 251: ${post.headline}`);
    logger.info(`Source: ${post.source}`);
    logger.info(`Content length: ${post.content?.length || 0}`);
    logger.info(`\nRaw HTML content:\n${post.content?.substring(0, 500)}...`);

    // Try both converters
    logger.info('\n=== Testing Basic Converter ===');
    try {
      const basicResult = convertHtmlToLexical(post.content);
      logger.info('Basic converter succeeded');
      logger.info(JSON.stringify(basicResult, null, 2));
    } catch (error) {
      logger.error('Basic converter failed:', error);
    }

    logger.info('\n=== Testing Enhanced Converter ===');
    try {
      const enhancedResult = convertHtmlToLexicalEnhanced(post.content);
      logger.info('Enhanced converter succeeded');
      logger.info(`${JSON.stringify(enhancedResult, null, 2).substring(0, 2000)}...`);
    } catch (error) {
      logger.error('Enhanced converter failed:', error);
    }

    await connection.end();
  } catch (error) {
    logger.error('Failed to debug post:', error);
    await connection.end();
    process.exit(1);
  }
}

debugPost251();
