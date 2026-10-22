import { APIError } from 'payload';
import type { CollectionBeforeValidateHook } from 'payload';

/**
 * Duplicate-artist prevention.
 *
 * Free typing invites the same act being entered several times — "Pet Shop Boys"
 * vs "pet shop boys" vs "Pet  Shop Boys" — which silently fragments artist pages
 * and the New Music / catalog views. This hook blocks a create (or a rename)
 * that collides with an existing artist under a normalized comparison, with a
 * clear message telling the editor to pick the existing artist instead.
 *
 * The comparison is intentionally conservative: case- and whitespace-insensitive
 * only. It does NOT try to guess that "PSB" == "Pet Shop Boys" or strip "The",
 * so it never blocks two genuinely different acts.
 */

/** Normalize a name for duplicate comparison: lowercase, collapse whitespace, trim. */
export function normalizeArtistName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, ' ').trim();
}

export const preventDuplicateArtistName: CollectionBeforeValidateHook = async ({
  data,
  req,
  operation,
  originalDoc,
}) => {
  const name = typeof data?.name === 'string' ? data.name : undefined;
  if (!name) return data;

  const normalized = normalizeArtistName(name);
  if (!normalized) return data;

  // On update, only check when the name actually changed — renaming to a new
  // casing of the same name, or saving other fields, should not trip the guard.
  if (operation === 'update' && originalDoc) {
    const previous = normalizeArtistName(String((originalDoc as { name?: unknown }).name ?? ''));
    if (previous === normalized) return data;
  }

  // `like` is case-insensitive contains, so this returns candidates that share
  // the text; we then confirm an exact normalized match in JS (a contains match
  // like "The Cure" for a new "Cure" is correctly rejected as NOT a duplicate).
  const { docs } = await req.payload.find({
    collection: 'artists',
    where: { name: { like: name } },
    limit: 100,
    depth: 0,
    overrideAccess: true,
    req,
  });

  const originalId = (originalDoc as { id?: unknown } | undefined)?.id;
  const clash = docs.find((doc) => {
    if (originalId != null && doc.id === originalId) return false;
    return normalizeArtistName(String((doc as { name?: unknown }).name ?? '')) === normalized;
  });

  if (clash) {
    throw new APIError(
      `An artist named "${(clash as { name?: unknown }).name}" already exists. `
        + 'Select the existing artist instead of creating a duplicate.',
      400,
      undefined,
      true, // isPublic — surface this message to the editor
    );
  }

  return data;
};
