/**
 * Fix custom_texts: update HTML headlines and regenerate content with proper block IDs
 */

// eslint-disable-next-line import/no-extraneous-dependencies
// eslint-disable-next-line import/no-extraneous-dependencies
import { Command } from 'commander';
import { connectToDatabase, type CustomText } from './database';
import { getPayloadClient } from './shared/payloadClient';
import { createLogger } from './shared/logger';
import { convertHtmlToLexicalEnhanced } from './shared/enhancedHtmlToLexical';

const logger = createLogger('FixCustomTexts');

interface ImportOptions {
  env: 'dev' | 'prod';
}

async function fixCustomTexts(options: ImportOptions): Promise<void> {
  logger.info('Fixing custom_texts with HTML headlines and block IDs...');
  logger.info(`Environment: ${options.env}`);

  let mysqlConnection;
  let payload;
  let fixed = 0;
  let skipped = 0;

  try {
    // Connect to MySQL (source)
    logger.info('Connecting to MySQL database...');
    mysqlConnection = await connectToDatabase();

    // Connect to Payload (destination)
    payload = await getPayloadClient(options.env);

    // Fetch active custom_texts from MySQL
    logger.info('Fetching custom_texts from MySQL...');
    const query = 'SELECT * FROM custom_texts WHERE status = ? ORDER BY id ASC';
    const [customTexts] = await mysqlConnection.query(query, ['active']);

    logger.info(`Found ${(customTexts as CustomText[]).length} custom_texts`);

    for (const customText of customTexts as CustomText[]) {
      const legacyId = customText.id + 10000;

      // Check if headline is HTML
      let headline = customText.title;

      if (headline.trim().startsWith('<')) {
        // Convert permalink to title case
        if (customText.permalink) {
          headline = customText.permalink
            .split('-')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        } else {
          headline = `Custom Text ${customText.id}`;
        }
        logger.info(`Custom text ${customText.id}: Fixing HTML headline -> "${headline}"`);
      }

      // Always regenerate content to fix block IDs
      logger.info(`Custom text ${customText.id}: Regenerating content with proper block IDs`);
      let content;
      try {
        content = convertHtmlToLexicalEnhanced(customText.html || '');

        // Strip out upload nodes
        const stripUploadNodes = (nodes: any[]): any[] => nodes.filter((node) => node.type !== 'upload').map((node) => {
          if (node.children && Array.isArray(node.children)) {
            return { ...node, children: stripUploadNodes(node.children) };
          }
          return node;
        });

        content.root.children = stripUploadNodes(content.root.children);

        // Check if content is empty
        const hasContent = content.root.children.some((child: any) => {
          if (child.type === 'paragraph') {
            return child.children.some((textNode: any) => textNode.text && textNode.text.trim());
          }
          return true;
        });

        if (!hasContent) {
          content = {
            root: {
              type: 'root',
              format: '',
              indent: 0,
              version: 1,
              children: [{
                type: 'paragraph',
                format: '',
                indent: 0,
                version: 1,
                children: [{
                  type: 'text',
                  text: '(No content available)',
                  format: 0,
                  mode: 'normal',
                  style: '',
                  detail: 0,
                  version: 1,
                }],
                direction: 'ltr',
              }],
              direction: 'ltr',
            },
          };
        }
      } catch (error) {
        logger.error(`  Error converting content for custom_text ${customText.id}:`, error);
        skipped += 1;
        // Skip to next custom_text
      }

      if (!content) {
        // eslint-disable-next-line no-continue
        continue;
      }

      // Update the post
      try {
        const result = await payload.find({
          collection: 'posts',
          where: { legacyId: { equals: legacyId } },
          limit: 1,
        });

        if (result.totalDocs > 0) {
          await payload.update({
            collection: 'posts',
            id: result.docs[0].id,
            data: {
              headline,
              content,
            },
          });
          logger.info(`  ✓ Updated post ${result.docs[0].id}`);
          fixed++;
        } else {
          logger.warn(`  Post with legacyId ${legacyId} not found`);
          skipped++;
        }
      } catch (error: any) {
        logger.error(`  ✗ Failed to update custom_text ${customText.id}: ${error.message}`);
        skipped++;
      }

      // Small delay
      await new Promise((resolve) => {
        setTimeout(resolve, 100);
      });
    }

    logger.info(`\n${'='.repeat(80)}`);
    logger.info('Fix completed!');
    logger.info('='.repeat(80));
    logger.info(`✅ Successfully fixed: ${fixed}`);
    logger.info(`⏭️  Skipped: ${skipped}`);
    logger.info('='.repeat(80));
  } catch (error: any) {
    logger.error('Fatal error during fix:', error);
    throw error;
  } finally {
    if (mysqlConnection) {
      await mysqlConnection.end();
      logger.info('MySQL connection closed');
    }
  }
}

// CLI setup
const program = new Command();

program
  .name('fixCustomTexts')
  .description('Fix custom_texts HTML headlines and block IDs')
  .option('--env <environment>', 'Target environment (dev or prod)', 'dev')
  .action(async (options) => {
    try {
      await fixCustomTexts({
        env: options.env,
      });
      process.exit(0);
    } catch (error) {
      logger.error('Fix failed:', error);
      process.exit(1);
    }
  });

program.parse(process.argv);
