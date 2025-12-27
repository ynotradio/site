/**
 * Helper utilities to find the last imported legacy ID from Sanity
 * This helps determine where to resume an incremental import
 */

import { createClient, SanityClient } from '@sanity/client';
import { sanityConfig } from '../config';

export interface LastImportedRecord {
  _id: string;
  legacyId: number;
  [key: string]: any;
}

/**
 * Get the last imported legacy ID for a specific content type
 */
export async function getLastImportedId(
  contentType: string,
  client?: SanityClient,
): Promise<number | null> {
  // Use provided client or create a new one
  const sanityClient = client
    || createClient({
      projectId: sanityConfig.projectId,
      dataset: sanityConfig.dataset,
      token: sanityConfig.token,
      apiVersion: sanityConfig.apiVersion,
      useCdn: false,
    });

  // Query for the highest legacyId for this content type
  const query = `*[_type == "${contentType}" && defined(legacyId)] | order(legacyId desc) [0] {
    legacyId
  }`;

  const result = await sanityClient.fetch<{ legacyId: number } | null>(query);

  return result?.legacyId || null;
}

/**
 * Get the last imported record with details for a specific content type
 */
export async function getLastImportedRecord(
  contentType: string,
  client?: SanityClient,
): Promise<LastImportedRecord | null> {
  // Use provided client or create a new one
  const sanityClient = client
    || createClient({
      projectId: sanityConfig.projectId,
      dataset: sanityConfig.dataset,
      token: sanityConfig.token,
      apiVersion: sanityConfig.apiVersion,
      useCdn: false,
    });

  // Query for the highest legacyId for this content type with all fields
  const query = `*[_type == "${contentType}" && defined(legacyId)] | order(legacyId desc) [0]`;

  const result = await sanityClient.fetch<LastImportedRecord | null>(query);

  return result;
}
