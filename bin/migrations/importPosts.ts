/**
 * Migration script for importing posts from MySQL to Sanity
 *
 * This script imports data from two legacy tables:
 *   - stories: Front page content with headline, story text, dates, images, and priority
 *   - custom_texts: Custom pages with permalink-based URLs and HTML content
 *
 * Both are unified into the new "post" document type in Sanity.
 *
 * MySQL Schema (stories):
 *   id, start_date, end_date, headline, story, pic, pic_url, priority, deleted
 *
 * MySQL Schema (custom_texts):
 *   id, title, permalink, html, status
 *
 * Usage: npm run import:posts
 */

import { createClient } from '@sanity/client';
import * as mysql from 'mysql2/promise';
import { dbConfig, sanityConfig, migrationConfig } from './config';
import {
  createLogger,
  logSummary,
  logProgress,
} from './shared/logger';
import {
  createUpsertHandler,
  generateDocumentId,
  createSlug,
  DocumentWithLegacyId,
} from './shared/upsert';
import {
  createImageUploader,
  fixImagePath,
} from './shared/imageUploader';
import {
  validateRequired,
  validateUrl,
  validateDate,
  mergeResults,
  logValidationErrors,
  ValidationResult,
} from './shared/validation';
import { htmlToPortableText } from './shared/richTextConverter';

const logger = createLogger('ImportPosts');

// Story interface matching the MySQL table structure
interface Story {
  id: number;
  start_date: string | null;
  end_date: string | null;
  headline: string | null;
  story: string | null;
  pic: string | null;
  pic_url: string | null;
  priority: number | null;
  deleted: string;
}

// CustomText interface matching the MySQL table structure
interface CustomText {
  id: number;
  title: string | null;
  permalink: string | null;
  html: string | null;
  status: string;
}

/**
 * Connect to the MySQL database
 */
async function connectToDatabase(): Promise<mysql.Connection> {
  try {
    const connection = await mysql.createConnection({
      host: dbConfig.host,
      database: dbConfig.database,
      user: dbConfig.user,
      password: dbConfig.password,
    });
    logger.info('Connected to database successfully.');
    return connection;
  } catch (error) {
    logger.error('Database connection failed:', error as Error);
    throw error;
  }
}

/**
 * Get active stories from the database (excluding soft-deleted records)
 */
async function getActiveStories(connection: mysql.Connection): Promise<Story[]> {
  try {
    const [rows] = await connection.query<mysql.RowDataPacket[]>(
      "SELECT * FROM stories WHERE deleted NOT IN ('y', 'Y', 'yes', 'Yes', 'YES') ORDER BY priority",
    );
    logger.info(`Retrieved ${rows.length} stories from the database.`);
    return rows as Story[];
  } catch (error) {
    logger.error('Query failed for stories:', error as Error);
    throw error;
  }
}

/**
 * Get active custom texts from the database
 */
async function getActiveCustomTexts(connection: mysql.Connection): Promise<CustomText[]> {
  try {
    const [rows] = await connection.query<mysql.RowDataPacket[]>(
      "SELECT * FROM custom_texts WHERE status = 'active' ORDER BY id",
    );
    logger.info(`Retrieved ${rows.length} custom texts from the database.`);
    return rows as CustomText[];
  } catch (error) {
    logger.error('Query failed for custom_texts:', error as Error);
    throw error;
  }
}

/**
 * Validate a story record
 */
function validateStory(story: Story): ValidationResult {
  return mergeResults(
    validateRequired(story.headline, 'headline'),
    validateUrl(story.pic_url, 'pic_url'),
    validateDate(story.start_date, 'start_date'),
    validateDate(story.end_date, 'end_date'),
  );
}

/**
 * Validate a custom text record
 */
function validateCustomText(customText: CustomText): ValidationResult {
  return mergeResults(
    validateRequired(customText.title, 'title'),
    validateRequired(customText.permalink, 'permalink'),
  );
}

/**
 * Format a date string for Sanity (ISO 8601 datetime format)
 */
function formatDatetime(dateStr: string | null): string | null {
  if (!dateStr) return null;

  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return null;

  return date.toISOString();
}

/**
 * Create a slug from a permalink or title
 */
function createSlugFromPermalink(permalink: string): { _type: 'slug'; current: string } {
  // Permalinks are already URL-safe, just normalize them
  let slug = permalink.toLowerCase();
  // Remove leading/trailing slashes
  slug = slug.replace(/^\/+|\/+$/g, '');
  // Replace special characters
  slug = slug.replace(/[^a-z0-9]+/g, '-');
  // Remove leading/trailing hyphens
  slug = slug.replace(/^-|-$/g, '');

  return {
    _type: 'slug',
    current: slug || 'untitled',
  };
}

/**
 * Transform a story record to a Sanity post document
 */
async function transformStoryToDocument(
  story: Story,
  imageUploader: ReturnType<typeof createImageUploader>,
): Promise<DocumentWithLegacyId> {
  const { id, headline } = story;

  // Create slug from headline
  const slug = createSlug(headline || `story-${id}`);

  // Create the base document
  const doc: DocumentWithLegacyId = {
    _id: generateDocumentId('post-story', id),
    _type: 'post',
    title: headline || '',
    slug,
    postType: 'story',
    legacyId: id,
    legacySource: 'stories',
  };

  // Add content (convert HTML to portable text if present)
  if (story.story) {
    doc.content = htmlToPortableText(story.story);
  }

  // Add dates
  if (story.start_date) {
    const startDate = formatDatetime(story.start_date);
    if (startDate) {
      doc.startDate = startDate;
    }
  }

  if (story.end_date) {
    const endDate = formatDatetime(story.end_date);
    if (endDate) {
      doc.endDate = endDate;
    }
  }

  // Add priority
  if (story.priority !== null && story.priority !== undefined) {
    doc.priority = story.priority;
  }

  // Add link URL if present
  if (story.pic_url) {
    doc.linkUrl = story.pic_url;
  }

  // Handle image upload (pic field contains the image filename)
  if (story.pic) {
    const imageUrl = fixImagePath(story.pic, migrationConfig.baseUrl);
    if (imageUrl) {
      const result = await imageUploader.uploadFromUrl(imageUrl, `post-story-${id}.jpg`);
      if (result.success && result.imageValue) {
        doc.image = result.imageValue;
      } else {
        logger.warn(`Failed to upload image for story ${id}: ${result.error}`);
        // Store the original URL as fallback
        doc.imageUrl = imageUrl;
      }
    }
  }

  return doc;
}

/**
 * Transform a custom text record to a Sanity post document
 */
function transformCustomTextToDocument(
  customText: CustomText,
): DocumentWithLegacyId {
  const {
    id, title, permalink, html,
  } = customText;

  // Create slug from permalink
  const slug = createSlugFromPermalink(permalink || `custom-${id}`);

  // Create the base document
  const doc: DocumentWithLegacyId = {
    _id: generateDocumentId('post-custom', id),
    _type: 'post',
    title: title || '',
    slug,
    postType: 'custom',
    legacyId: id,
    legacySource: 'custom_texts',
  };

  // Store HTML content as embed (custom texts typically have raw HTML)
  if (html) {
    doc.htmlEmbed = html;
    // Also try to convert to portable text for richer editing
    doc.content = htmlToPortableText(html);
  }

  return doc;
}

/**
 * Generate a migration report
 */
function generateReport(stats: {
  totalStories: number;
  totalCustomTexts: number;
  storiesCreated: number;
  storiesUpdated: number;
  storiesSkipped: number;
  storiesErrors: number;
  customTextsCreated: number;
  customTextsUpdated: number;
  customTextsSkipped: number;
  customTextsErrors: number;
  storyValidationErrors: Array<{ id: number; headline: string; errors: string[] }>;
  customTextValidationErrors: Array<{ id: number; title: string; errors: string[] }>;
}): string {
  const timestamp = new Date().toISOString();
  let report = '# Post Migration Report\n\n';
  report += `**Generated:** ${timestamp}\n\n`;

  report += '## Stories Summary\n\n';
  report += '| Metric | Count |\n';
  report += '|--------|-------|\n';
  report += `| Total Records | ${stats.totalStories} |\n`;
  report += `| Created | ${stats.storiesCreated} |\n`;
  report += `| Updated | ${stats.storiesUpdated} |\n`;
  report += `| Skipped | ${stats.storiesSkipped} |\n`;
  report += `| Errors | ${stats.storiesErrors} |\n`;
  report += `| Validation Errors | ${stats.storyValidationErrors.length} |\n\n`;

  report += '## Custom Texts Summary\n\n';
  report += '| Metric | Count |\n';
  report += '|--------|-------|\n';
  report += `| Total Records | ${stats.totalCustomTexts} |\n`;
  report += `| Created | ${stats.customTextsCreated} |\n`;
  report += `| Updated | ${stats.customTextsUpdated} |\n`;
  report += `| Skipped | ${stats.customTextsSkipped} |\n`;
  report += `| Errors | ${stats.customTextsErrors} |\n`;
  report += `| Validation Errors | ${stats.customTextValidationErrors.length} |\n\n`;

  if (stats.storyValidationErrors.length > 0) {
    report += '## Story Validation Errors\n\n';
    stats.storyValidationErrors.forEach((item) => {
      report += `### Story ID ${item.id}: ${item.headline}\n\n`;
      item.errors.forEach((err) => {
        report += `- ${err}\n`;
      });
      report += '\n';
    });
  }

  if (stats.customTextValidationErrors.length > 0) {
    report += '## Custom Text Validation Errors\n\n';
    stats.customTextValidationErrors.forEach((item) => {
      report += `### Custom Text ID ${item.id}: ${item.title}\n\n`;
      item.errors.forEach((err) => {
        report += `- ${err}\n`;
      });
      report += '\n';
    });
  }

  return report;
}

/**
 * Main import function
 */
async function importPosts(): Promise<void> {
  let connection: mysql.Connection | null = null;

  try {
    logger.info('Starting post import process...');
    logger.info('Importing from both "stories" and "custom_texts" tables into unified "post" type');

    // Check if Sanity token is provided
    if (!sanityConfig.token) {
      logger.error('No Sanity API token provided. Please set the SANITY_API_TOKEN environment variable.');
      return;
    }

    logger.info(`Using Sanity project: ${sanityConfig.projectId}, dataset: ${sanityConfig.dataset}`);

    // Create Sanity client
    const client = createClient({
      projectId: sanityConfig.projectId,
      dataset: sanityConfig.dataset,
      token: sanityConfig.token,
      apiVersion: sanityConfig.apiVersion,
      useCdn: false,
    });

    // Create utilities
    const upsertHandler = createUpsertHandler(client);
    const imageUploader = createImageUploader(client);

    // Connect to the database
    connection = await connectToDatabase();

    // Get active records from both tables
    const stories = await getActiveStories(connection);
    const customTexts = await getActiveCustomTexts(connection);

    const totalRecords = stories.length + customTexts.length;
    if (totalRecords === 0) {
      logger.warn('No posts found to import.');
      return;
    }

    logger.info(`Found ${stories.length} stories and ${customTexts.length} custom texts to import.`);

    // Track stats
    const stats = {
      totalStories: stories.length,
      totalCustomTexts: customTexts.length,
      storiesCreated: 0,
      storiesUpdated: 0,
      storiesSkipped: 0,
      storiesErrors: 0,
      customTextsCreated: 0,
      customTextsUpdated: 0,
      customTextsSkipped: 0,
      customTextsErrors: 0,
      storyValidationErrors: [] as Array<{ id: number; headline: string; errors: string[] }>,
      customTextValidationErrors: [] as Array<{ id: number; title: string; errors: string[] }>,
    };

    // Process stories
    logger.info('Processing stories...');
    for (let i = 0; i < stories.length; i += 1) {
      const story = stories[i];

      // Validate the record
      const validationResult = validateStory(story);
      if (!validationResult.isValid) {
        logValidationErrors(story.id, validationResult);
        stats.storyValidationErrors.push({
          id: story.id,
          headline: story.headline || `Unknown (ID: ${story.id})`,
          errors: validationResult.errors.map((e) => `${e.field}: ${e.message}`),
        });
        stats.storiesSkipped += 1;
        // eslint-disable-next-line no-continue
        continue;
      }

      try {
        // Transform to Sanity document
        // eslint-disable-next-line no-await-in-loop
        const doc = await transformStoryToDocument(story, imageUploader);

        // Upsert to Sanity
        // eslint-disable-next-line no-await-in-loop
        const result = await upsertHandler.upsert(doc);

        if (result.success) {
          if (result.action === 'created') {
            stats.storiesCreated += 1;
          } else if (result.action === 'updated') {
            stats.storiesUpdated += 1;
          } else {
            stats.storiesSkipped += 1;
          }
        } else {
          stats.storiesErrors += 1;
          logger.error(`Failed to upsert story ${story.id}: ${result.error}`);
        }
      } catch (error) {
        stats.storiesErrors += 1;
        logger.error(`Error processing story ${story.id}:`, error as Error);
      }

      // Log progress every 10 records
      if ((i + 1) % 10 === 0 || i === stories.length - 1) {
        logProgress(i + 1, stories.length, `Processed story: ${story.headline || story.id}`);
      }
    }

    // Process custom texts
    logger.info('Processing custom texts...');
    for (let i = 0; i < customTexts.length; i += 1) {
      const customText = customTexts[i];

      // Validate the record
      const validationResult = validateCustomText(customText);
      if (!validationResult.isValid) {
        logValidationErrors(customText.id, validationResult);
        stats.customTextValidationErrors.push({
          id: customText.id,
          title: customText.title || `Unknown (ID: ${customText.id})`,
          errors: validationResult.errors.map((e) => `${e.field}: ${e.message}`),
        });
        stats.customTextsSkipped += 1;
        // eslint-disable-next-line no-continue
        continue;
      }

      try {
        // Transform to Sanity document
        const doc = transformCustomTextToDocument(customText);

        // Upsert to Sanity
        // eslint-disable-next-line no-await-in-loop
        const result = await upsertHandler.upsert(doc);

        if (result.success) {
          if (result.action === 'created') {
            stats.customTextsCreated += 1;
          } else if (result.action === 'updated') {
            stats.customTextsUpdated += 1;
          } else {
            stats.customTextsSkipped += 1;
          }
        } else {
          stats.customTextsErrors += 1;
          logger.error(`Failed to upsert custom text ${customText.id}: ${result.error}`);
        }
      } catch (error) {
        stats.customTextsErrors += 1;
        logger.error(`Error processing custom text ${customText.id}:`, error as Error);
      }

      // Log progress every 10 records
      if ((i + 1) % 10 === 0 || i === customTexts.length - 1) {
        logProgress(i + 1, customTexts.length, `Processed custom text: ${customText.title || customText.id}`);
      }
    }

    // Log summary
    const totalSuccess = stats.storiesCreated + stats.storiesUpdated
      + stats.customTextsCreated + stats.customTextsUpdated;
    const totalSkipped = stats.storiesSkipped + stats.customTextsSkipped;
    const totalErrors = stats.storiesErrors + stats.customTextsErrors;

    logSummary({
      total: totalRecords,
      success: totalSuccess,
      skipped: totalSkipped,
      errors: totalErrors,
    });

    // Generate and log report
    const report = generateReport(stats);
    logger.info(`\n${report}`);

    logger.info('Post import completed!');
  } catch (error) {
    logger.error('Error during import process:', error as Error);
  } finally {
    // Close the database connection
    if (connection) {
      await connection.end();
      logger.info('Database connection closed.');
    }
  }
}

// Run the import process
importPosts();

// Handle process exit
process.on('exit', () => {
  logger.info('Import process complete.');
});
