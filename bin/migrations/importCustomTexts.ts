/**
 * Import only custom_texts from MySQL to Payload
 *
 * This script imports custom_texts as Pages with special handling:
 * - Uses enhanced HTML-to-Lexical converter for complex content
 * - Generates slugs from permalinks
 * - Sets appropriate dates for always-visible content
 *
 * Usage:
 *   npx tsx bin/migrations/importCustomTexts.ts [--env dev|prod]
 */

// eslint-disable-next-line import/no-extraneous-dependencies
import { Command } from 'commander';
import { connectToDatabase, type CustomText } from './database';
import { getPayloadClient } from './shared/payloadClient';
import { createLogger } from './shared/logger';
import { convertHtmlToLexicalEnhanced } from './shared/enhancedHtmlToLexical';

const logger = createLogger('CustomTextsImport');

interface ImportOptions {
  env: 'dev' | 'prod';
}

interface ImportStats {
  total: number;
  success: number;
  skipped: number;
  errors: number;
}

/**
 * Import a single custom_text as a post
 */
async function importCustomText(
  payload: any,
  customText: CustomText,
): Promise<'success' | 'skipped' | 'error'> {
  const legacyId = customText.id;

  try {
    // Check if already imported — if so we update in place so re-running the
    // script refreshes stale custom-text content (e.g. new Mixcloud embeds).
    const existing = await payload.find({
      collection: 'pages',
      where: { legacyId: { equals: legacyId } },
      limit: 1,
    });
    const existingId = existing.totalDocs > 0 ? existing.docs[0].id : undefined;

    logger.info(`Importing custom_text ${customText.id}: ${customText.title}`);

    // Generate proper title from permalink if title is HTML
    let { title } = customText;
    if (title && title.trim().startsWith('<')) {
      // Title is HTML (likely an image tag), use permalink instead
      if (customText.permalink) {
        // Convert permalink to title case: "top220of2020" -> "Top 220 Of 2020"
        title = customText.permalink
          .split('-')
          .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      } else {
        title = `Custom Text ${customText.id}`;
      }
      logger.info(`  Converted HTML title to: "${title}"`);
    }

    // Convert HTML content to Lexical format using enhanced converter
    let content;
    try {
      content = convertHtmlToLexicalEnhanced(customText.html || '');

      // Strip out upload nodes (images) since they have placeholder IDs that fail validation
      // Images will need to be re-added manually or via a separate import process
      const stripUploadNodes = (nodes: any[]): any[] => nodes
        .filter((node) => node.type !== 'upload')
        .map((node) => {
          if (node.children && Array.isArray(node.children)) {
            return { ...node, children: stripUploadNodes(node.children) };
          }
          return node;
        });

      content.root.children = stripUploadNodes(content.root.children);

      // Check if content is empty or just has empty paragraph
      const hasContent = content.root.children.some((child: any) => {
        if (child.type === 'paragraph') {
          return child.children.some((textNode: any) => textNode.text && textNode.text.trim());
        }
        return true;
      });

      if (!hasContent) {
        logger.warn(`  Custom text ${customText.id} has empty content, using fallback`);
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
    } catch (conversionError) {
      logger.error(`  Error converting content for custom_text ${customText.id}:`, conversionError);
      // Use fallback content
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

    // Generate slug from permalink
    const slug = customText.permalink || `custom-text-${customText.id}`;

    const data = {
      title,
      content,
      slug,
      // generateSlug: false ensures the pageSlugify hook doesn't overwrite
      // our permalink-derived slug.
      generateSlug: false,
      _status: 'published' as const,
      legacyId,
    };

    if (existingId !== undefined) {
      await payload.update({ collection: 'pages', id: existingId, data });
      logger.info(`  ✓ Updated custom_text ${customText.id} (page ${existingId})`);
    } else {
      const newPage = await payload.create({ collection: 'pages', data });
      logger.info(`  ✓ Imported custom_text ${customText.id} as page ${newPage.id}`);
    }
    return 'success';
  } catch (error: any) {
    logger.error(`  ✗ Failed to import custom_text ${customText.id}`);
    logger.error(`  Error: ${error.message}`);
    if (error.data) {
      logger.error('  Error data:', JSON.stringify(error.data, null, 2));
    }
    return 'error';
  }
}

/**
 * Main import function
 */
async function importCustomTexts(options: ImportOptions): Promise<void> {
  logger.info('Starting custom_texts import...');
  logger.info(`Environment: ${options.env}`);

  const stats: ImportStats = {
    total: 0,
    success: 0,
    skipped: 0,
    errors: 0,
  };

  let mysqlConnection;
  let payload;

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

    stats.total = (customTexts as CustomText[]).length;
    logger.info(`Found ${stats.total} active custom_texts to import`);

    // Import each custom_text
    for (let i = 0; i < (customTexts as CustomText[]).length; i += 1) {
      const customText = (customTexts as CustomText[])[i];

      // Progress indicator every 10 items
      if ((i + 1) % 10 === 0) {
        const percentage = Math.round(((i + 1) / stats.total) * 100);
        logger.info(
          `Progress: ${i + 1}/${stats.total} (${percentage}%) - Custom text ${customText.id}`,
        );
      }

      const result = await importCustomText(payload, customText);

      if (result === 'success') {
        stats.success += 1;
      } else if (result === 'skipped') {
        stats.skipped += 1;
      } else {
        stats.errors += 1;
      }

      // Small delay to avoid overwhelming the database
      await new Promise((resolve) => {
        setTimeout(resolve, 100);
      });
    }

    // Print summary
    logger.info(`\n${'='.repeat(80)}`);
    logger.info('Import completed!');
    logger.info('='.repeat(80));
    logger.info(`Total custom_texts processed: ${stats.total}`);
    logger.info(`✅ Successfully imported: ${stats.success}`);
    logger.info(`⏭️  Skipped (already exists): ${stats.skipped}`);
    logger.info(`❌ Failed: ${stats.errors}`);
    logger.info('='.repeat(80));
  } catch (error: any) {
    logger.error('Fatal error during import:', error);
    throw error;
  } finally {
    // Close connections
    if (mysqlConnection) {
      await mysqlConnection.end();
      logger.info('MySQL connection closed');
    }
  }
}

function isMainModule(): boolean {
  if (typeof import.meta !== 'undefined' && import.meta.url) {
    return import.meta.url === `file://${process.argv[1]}`;
  }
  return require.main === module;
}

// CLI setup — only runs when executed directly, not when imported by tests
if (isMainModule()) {
  const program = new Command();

  program
    .name('importCustomTexts')
    .description('Import custom_texts from MySQL to Payload CMS')
    .option('--env <environment>', 'Target environment (dev or prod)', 'dev')
    .action(async (options) => {
      try {
        await importCustomTexts({
          env: options.env,
        });
        process.exit(0);
      } catch (error) {
        logger.error('Import failed:', error);
        process.exit(1);
      }
    });

  program.parse(process.argv);
}

export { importCustomText, importCustomTexts };
