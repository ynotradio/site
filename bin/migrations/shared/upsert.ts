/**
 * Upsert utilities for Sanity migrations
 * Find existing records by legacyId and create or update accordingly
 */

import { SanityClient } from '@sanity/client';
import { createLogger } from './logger';

const logger = createLogger('Upsert');

export interface UpsertResult {
  success: boolean;
  action: 'created' | 'updated' | 'skipped';
  documentId?: string;
  error?: string;
}

export interface DocumentWithLegacyId {
  _id: string;
  _type: string;
  legacyId?: number;
  migratedAt?: string;
  [key: string]: unknown;
}

/**
 * Create an upsert handler for a Sanity client
 */
export function createUpsertHandler(client: SanityClient) {
  /**
   * Find an existing document by legacyId
   */
  async function findByLegacyId(
    documentType: string,
    legacyId: number,
  ): Promise<DocumentWithLegacyId | null> {
    const query = '*[_type == $type && legacyId == $legacyId][0]';
    const params = { type: documentType, legacyId };

    try {
      const result = await client.fetch<DocumentWithLegacyId | null>(query, params);
      return result;
    } catch (err) {
      logger.error(`Error finding document by legacyId: ${err}`);
      return null;
    }
  }

  /**
   * Upsert a document - create if not exists, update if exists
   */
  async function upsert(
    document: DocumentWithLegacyId,
    options: {
      forceUpdate?: boolean;
      skipIfExists?: boolean;
    } = {},
  ): Promise<UpsertResult> {
    const { forceUpdate = false, skipIfExists = false } = options;
    const docType = document._type;
    const legacyId = document.legacyId;

    try {
      // Check if document exists by legacyId
      let existingDoc: DocumentWithLegacyId | null = null;

      if (legacyId !== undefined) {
        existingDoc = await findByLegacyId(docType, legacyId);
      }

      if (existingDoc) {
        // Document exists
        if (skipIfExists) {
          logger.debug(`Skipping existing document: ${docType} with legacyId ${legacyId}`);
          return {
            success: true,
            action: 'skipped',
            documentId: existingDoc._id,
          };
        }

        if (!forceUpdate) {
          // Check if already migrated (has migratedAt)
          if (existingDoc.migratedAt) {
            logger.debug(`Document already migrated: ${docType} with legacyId ${legacyId}`);
            return {
              success: true,
              action: 'skipped',
              documentId: existingDoc._id,
            };
          }
        }

        // Update existing document
        const updatedDoc = {
          ...document,
          _id: existingDoc._id, // Preserve existing _id
          migratedAt: new Date().toISOString(),
        };

        const result = await client.createOrReplace(updatedDoc);
        logger.info(`Updated document: ${docType} (${result._id})`);

        return {
          success: true,
          action: 'updated',
          documentId: result._id,
        };
      }

      // Create new document
      const newDoc = {
        ...document,
        migratedAt: new Date().toISOString(),
      };

      const result = await client.createOrReplace(newDoc);
      logger.info(`Created document: ${docType} (${result._id})`);

      return {
        success: true,
        action: 'created',
        documentId: result._id,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error(`Upsert failed for ${docType} with legacyId ${legacyId}: ${errorMessage}`);

      return {
        success: false,
        action: 'skipped',
        error: errorMessage,
      };
    }
  }

  /**
   * Batch upsert multiple documents
   */
  async function batchUpsert(
    documents: DocumentWithLegacyId[],
    options: {
      forceUpdate?: boolean;
      skipIfExists?: boolean;
      onProgress?: (current: number, total: number, result: UpsertResult) => void;
    } = {},
  ): Promise<{
      total: number;
      created: number;
      updated: number;
      skipped: number;
      errors: number;
      results: UpsertResult[];
    }> {
    const { onProgress } = options;
    const results: UpsertResult[] = [];
    let created = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (let i = 0; i < documents.length; i += 1) {
      const doc = documents[i];
      // eslint-disable-next-line no-await-in-loop
      const result = await upsert(doc, options);
      results.push(result);

      if (result.success) {
        switch (result.action) {
          case 'created':
            created += 1;
            break;
          case 'updated':
            updated += 1;
            break;
          case 'skipped':
            skipped += 1;
            break;
          default:
            break;
        }
      } else {
        errors += 1;
      }

      if (onProgress) {
        onProgress(i + 1, documents.length, result);
      }
    }

    return {
      total: documents.length,
      created,
      updated,
      skipped,
      errors,
      results,
    };
  }

  /**
   * Delete a document by _legacyId
   */
  async function deleteByLegacyId(
    documentType: string,
    legacyId: number,
  ): Promise<boolean> {
    try {
      const existingDoc = await findByLegacyId(documentType, legacyId);
      if (!existingDoc) {
        logger.warn(`Document not found for deletion: ${documentType} with legacyId ${legacyId}`);
        return false;
      }

      await client.delete(existingDoc._id);
      logger.info(`Deleted document: ${documentType} (${existingDoc._id})`);
      return true;
    } catch (err) {
      logger.error(`Delete failed for ${documentType} with legacyId ${legacyId}: ${err}`);
      return false;
    }
  }

  return {
    findByLegacyId,
    upsert,
    batchUpsert,
    deleteByLegacyId,
  };
}

/**
 * Generate a deterministic document ID from legacy type and ID
 */
export function generateDocumentId(type: string, legacyId: number): string {
  return `${type}-${legacyId}`;
}

/**
 * Create a slug from a string
 */
export function createSlug(name: string): { _type: 'slug'; current: string } {
  let slug = name.toLowerCase();
  // Replace special characters
  slug = slug.replace(/[^a-z0-9]+/g, '-');
  // Remove leading/trailing hyphens
  slug = slug.replace(/^-|-$/g, '');
  return {
    _type: 'slug',
    current: slug,
  };
}
