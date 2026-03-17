/* eslint-disable no-console */
/**
 * Pure utility functions for the displayName integrity check.
 *
 * Separated from the main script so tests can import without pulling in
 * Payload CMS / @payload-config dependencies.
 */

import type { Payload } from 'payload';

// ---------------------------------------------------------------------------
// displayName computation (mirrors hooks/displayNameHooks.ts)
// ---------------------------------------------------------------------------

export async function computeDJDisplayName(
  payload: Payload,
  doc: Record<string, unknown>,
): Promise<string> {
  const person = doc.person as unknown[] | undefined;

  if (Array.isArray(person) && person.length > 0) {
    const personIds = person.map((p: unknown) => {
      if (typeof p === 'object' && p !== null && 'id' in p) {
        return (p as { id: unknown }).id;
      }
      return p;
    });

    try {
      const people = await payload.find({
        collection: 'people',
        where: { id: { in: personIds } },
        limit: personIds.length,
      });

      if (people.docs.length > 0) {
        return people.docs.map((p: Record<string, unknown>) => p.name as string).join(', ');
      }
    } catch {
      /* fall through to fallback */
    }
  }

  return `DJ #${doc.id || 'New'}`;
}

export async function computeMusicDisplayName(
  payload: Payload,
  doc: Record<string, unknown>,
  entityType: 'Song' | 'Record',
): Promise<string> {
  let artistName = '';
  const { artist } = doc;

  if (artist && typeof artist === 'object' && artist !== null && 'name' in artist) {
    artistName = String((artist as { name: unknown }).name || '');
  } else if (artist) {
    try {
      const hasId = typeof artist === 'object' && artist !== null && 'id' in artist;
      const artistId = hasId ? (artist as { id: unknown }).id : artist;
      const found = await payload.findByID({
        collection: 'artists',
        id: artistId as number | string,
      });
      if (found) {
        artistName = (found as Record<string, unknown>).name as string;
      }
    } catch {
      /* fall through */
    }
  }

  if (artistName && doc.title) {
    return `${artistName} - ${doc.title}`;
  }
  return (doc.title as string) || `${entityType} #${doc.id || 'New'}`;
}
