/**
 * Utility script to reset (delete all documents of) a specific Sanity model
 *
 * Usage: npm run reset:model <modelType>
 * Example: npm run reset:model concert
 */

import { createClient } from '@sanity/client';
import * as readline from 'readline';
import { sanityConfig } from './config';
import { createLogger } from './shared/logger';

const logger = createLogger('ResetModel');

interface DeleteResult {
  documentId: string;
  success: boolean;
  error?: string;
}

/**
 * Prompt user for confirmation
 */
async function confirm(message: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${message} (yes/no): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
    });
  });
}

/**
 * Get all document IDs for a specific model type
 */
async function getDocumentIds(
  client: ReturnType<typeof createClient>,
  modelType: string,
): Promise<string[]> {
  try {
    const query = `*[_type == $type]._id`;
    const ids = await client.fetch<string[]>(query, { type: modelType });
    return ids;
  } catch (error) {
    logger.error(`Failed to fetch document IDs for type "${modelType}":`, error as Error);
    throw error;
  }
}

/**
 * Delete a document by ID
 */
async function deleteDocument(
  client: ReturnType<typeof createClient>,
  documentId: string,
): Promise<DeleteResult> {
  try {
    await client.delete(documentId);
    return {
      documentId,
      success: true,
    };
  } catch (error) {
    return {
      documentId,
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Delete all documents in batches
 */
async function deleteDocuments(
  client: ReturnType<typeof createClient>,
  documentIds: string[],
  batchSize: number = 10,
): Promise<{ deleted: number; failed: number; errors: DeleteResult[] }> {
  const results = {
    deleted: 0,
    failed: 0,
    errors: [] as DeleteResult[],
  };

  logger.info(`Deleting ${documentIds.length} documents in batches of ${batchSize}...`);

  for (let i = 0; i < documentIds.length; i += batchSize) {
    const batch = documentIds.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map((id) => deleteDocument(client, id)),
    );

    batchResults.forEach((result) => {
      if (result.success) {
        results.deleted += 1;
      } else {
        results.failed += 1;
        results.errors.push(result);
      }
    });

    // Log progress
    const progress = Math.min(i + batchSize, documentIds.length);
    logger.info(`Progress: ${progress}/${documentIds.length} (${Math.round((progress / documentIds.length) * 100)}%)`);
  }

  return results;
}

/**
 * Main reset function
 */
async function resetModel(modelType: string): Promise<void> {
  try {
    logger.info(`Starting reset process for model type: ${modelType}`);

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

    // Get all document IDs for this model type
    logger.info(`Fetching all documents of type "${modelType}"...`);
    const documentIds = await getDocumentIds(client, modelType);

    if (documentIds.length === 0) {
      logger.warn(`No documents found for type "${modelType}".`);
      return;
    }

    logger.info(`Found ${documentIds.length} documents of type "${modelType}".`);

    // Confirm deletion
    const confirmed = await confirm(
      `⚠️  This will DELETE all ${documentIds.length} documents of type "${modelType}". Are you sure?`,
    );

    if (!confirmed) {
      logger.info('Reset cancelled by user.');
      return;
    }

    // Delete all documents
    const startTime = Date.now();
    const results = await deleteDocuments(client, documentIds);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    // Log summary
    logger.info('\n=== Reset Summary ===');
    logger.info(`Total documents: ${documentIds.length}`);
    logger.info(`Successfully deleted: ${results.deleted}`);
    logger.info(`Failed: ${results.failed}`);
    logger.info(`Duration: ${duration}s`);

    if (results.errors.length > 0) {
      logger.error('\n=== Errors ===');
      results.errors.forEach((error) => {
        logger.error(`Failed to delete ${error.documentId}: ${error.error}`);
      });
    }

    if (results.deleted === documentIds.length) {
      logger.info(`\n✅ Successfully reset model "${modelType}"`);
    } else {
      logger.warn(`\n⚠️  Reset completed with ${results.failed} errors`);
    }
  } catch (error) {
    logger.error('Error during reset process:', error as Error);
    throw error;
  }
}

// Get model type from command line arguments
const modelType = process.argv[2];

if (!modelType) {
  console.error('Error: Model type is required');
  console.error('Usage: npm run reset:model <modelType>');
  console.error('Example: npm run reset:model concert');
  process.exit(1);
}

// Run the reset
resetModel(modelType).catch((error) => {
  logger.error('Fatal error:', error);
  process.exit(1);
});

// Handle process exit
process.on('exit', () => {
  logger.info('Reset process complete.');
});
