#!/usr/bin/env tsx
/**
 * Test import for specific posts to debug validation issues
 * Usage: tsx bin/migrations/testImportPosts.ts
 */

import { connectToDatabase, type Post } from './database';
import { getPayloadClient } from './shared/payloadClient';
import { createLogger } from './shared/logger';
import { convertHtmlToLexical } from './shared/importUtils';
import { convertHtmlToLexicalEnhanced } from './shared/enhancedHtmlToLexical';
import { importImageFromUrl } from './shared/mediaImporter';
import { slugify, cleanHeadline } from './shared/slugify';

const logger = createLogger('TestImport');

async function testImportPosts() {
  const connection = await connectToDatabase();
  const payload = await getPayloadClient('dev');

  try {
    // Test post IDs
    const testIds = [251, 243];

    for (const postId of testIds) {
      logger.info(`\n${'='.repeat(60)}`);
      logger.info(`Testing import for post ${postId}`);
      logger.info('='.repeat(60));

      // Get post from both tables
      let post: Post | null = null;
      const [storyRows] = await connection.execute<any[]>(
        'SELECT *, "story" as source FROM stories WHERE id = ?',
        [postId],
      );

      if (storyRows.length > 0) {
        post = storyRows[0] as Post;
      } else {
        const [customTextRows] = await connection.execute<any[]>(
          'SELECT *, "custom_text" as source FROM custom_texts WHERE id = ?',
          [postId],
        );
        if (customTextRows.length > 0) {
          post = customTextRows[0] as Post;
        }
      }

      if (!post) {
        logger.error(`Post ${postId} not found in database`);
        continue;
      }

      logger.info('Post details:');
      logger.info(`  ID: ${post.id}`);
      logger.info(`  Source: ${post.source}`);
      logger.info(`  Headline: ${post.headline}`);
      logger.info(`  Start Date: ${post.start_date}`);
      logger.info(`  End Date: ${post.end_date}`);
      logger.info(`  Image URL: ${post.image_url || '(none)'}`);
      logger.info(`  Content length: ${post.content?.length || 0} chars`);
      logger.info(`  Content preview: ${post.content?.substring(0, 200) || '(empty)'}...`);

      // Convert content
      logger.info('\nConverting HTML to Lexical...');
      let content = post.source === 'custom_text'
        ? convertHtmlToLexicalEnhanced(post.content)
        : convertHtmlToLexical(post.content);

      // Check if content is empty and provide fallback
      if (!content?.root?.children || content.root.children.length === 0
          || (content.root.children.length === 1
           && content.root.children[0].children?.length === 1
           && content.root.children[0].children[0].text === '')) {
        logger.warn('  Post has empty content, using fallback');
        content = {
          root: {
            type: 'root',
            format: '',
            indent: 0,
            version: 1,
            children: [
              {
                type: 'paragraph',
                format: '',
                indent: 0,
                version: 1,
                children: [
                  {
                    type: 'text',
                    text: '(No content available)',
                    format: 0,
                    mode: 'normal',
                    style: '',
                    detail: 0,
                    version: 1,
                  },
                ],
                direction: 'ltr',
              },
            ],
            direction: 'ltr',
          },
        };
      }

      logger.info('  Lexical structure:');
      logger.info(`    Root children count: ${content.root.children.length}`);
      content.root.children.forEach((child: any, i: number) => {
        logger.info(`    Child ${i}: type="${child.type}", children=${child.children?.length || 0}`);
        if (child.type === 'block') {
          logger.info(`      Block type: ${child.fields?.blockType}`);
          logger.info(`      Block URL: ${child.fields?.url}`);
        }
      });

      // Generate slug
      const cleanedHeadline = cleanHeadline(post.headline);
      let slug: string;
      if (post.permalink) {
        slug = post.permalink;
      } else if (post.source === 'story') {
        const date = new Date(post.start_date);
        const datePrefix = date.toISOString().split('T')[0];
        const headlineSlug = slugify(post.headline);
        slug = `${datePrefix}--${headlineSlug}`;
      } else {
        slug = slugify(post.headline);
      }
      logger.info(`  Generated slug: ${slug}`);

      // Try to import image
      let imageId: string | undefined;
      if (post.image_url && post.image_url.trim() !== '') {
        logger.info(`\nImporting image: ${post.image_url}`);
        const imageResult = await importImageFromUrl(payload, post.image_url, {
          alt: `Image for post: ${post.headline}`,
          caption: post.headline,
          legacyUrl: post.image_url,
          legacyId: post.id,
        });

        if (imageResult.success && imageResult.mediaId) {
          imageId = imageResult.mediaId;
          logger.info(`  ✓ Image imported: ${imageResult.cloudinaryUrl}`);
        } else {
          logger.warn(`  ✗ Image import failed: ${imageResult.error}`);
        }
      }

      // Try to create post
      logger.info('\nAttempting to create post in Payload...');
      try {
        const result = await payload.create({
          collection: 'posts',
          data: {
            headline: cleanedHeadline,
            slug,
            startDate: post.start_date,
            endDate: post.end_date,
            content,
            image: imageId,
            imageUrl: post.image_url,
            priority: post.priority || 0,
            legacyId: post.id,
            migratedAt: new Date().toISOString(),
            _status: 'published',
          },
        });

        logger.info(`  ✓ SUCCESS! Post created with ID: ${result.id}`);
        logger.info(`  View at: /admin/collections/posts/${result.id}`);
      } catch (error: any) {
        logger.error('  ✗ FAILED to create post');
        logger.error(`  Error type: ${error.constructor.name}`);
        logger.error(`  Error message: ${error.message}`);

        if (error.data) {
          logger.error('  Error data:', JSON.stringify(error.data, null, 2));
        }

        // Log the full Lexical content for debugging
        logger.error('\nFull Lexical content that failed validation:');
        logger.error(JSON.stringify(content, null, 2));
      }
    }

    await connection.end();
    process.exit(0);
  } catch (error) {
    logger.error('Test import failed:', error);
    await connection.end();
    process.exit(1);
  }
}

testImportPosts();
