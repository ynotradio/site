/**
 * Collection hooks for generating displayName fields
 *
 * These hooks are used across multiple collections to generate user-friendly
 * display names for relationships and admin UI titles.
 */

import type { FieldHook, CollectionBeforeChangeHook } from 'payload';

/**
 * DJ beforeChange hook: Generates displayName from person relationship
 *
 * Fetches person names and joins them with commas. Falls back to "DJ #<id>" if no person.
 */
export const generateDJDisplayName: CollectionBeforeChangeHook = async ({ data, req }) => {
  const updatedData = data;

  if (
    updatedData.person
    && Array.isArray(updatedData.person)
    && updatedData.person.length > 0
  ) {
    const personIds = updatedData.person.map((p: any) => (typeof p === 'object' ? p.id : p));

    try {
      const people = await req.payload.find({
        collection: 'people',
        where: {
          id: {
            in: personIds,
          },
        },
        limit: personIds.length,
      });

      if (people.docs.length > 0) {
        updatedData.displayName = people.docs.map((p: any) => p.name).join(', ');
      }
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.error('Error fetching person names for DJ:', error);
      }
    }
  }

  if (!updatedData.displayName) {
    updatedData.displayName = `DJ #${updatedData.id || 'New'}`;
  }

  return updatedData;
};

/**
 * Song/Record afterRead hook: Generates displayName from artist + title
 *
 * Returns "Artist - Title" format, falling back to just title or "Song/Record #<id>"
 */
export const generateMusicDisplayName = (entityType: 'Song' | 'Record'): FieldHook => async ({ data, req }) => {
  if (!data) return 'Untitled';

  let artistName = '';
  if (data.artist) {
    // Artist may be populated or just an ID
    if (typeof data.artist === 'object' && data.artist.name) {
      artistName = data.artist.name;
    } else if (data.artist) {
      try {
        const artist = await req.payload.findByID({
          collection: 'artists',
          id: typeof data.artist === 'object' ? data.artist.id : data.artist,
        });
        if (artist) {
          artistName = artist.name;
        }
      } catch {
        // Silently handle errors
      }
    }
  }

  if (artistName && data.title) {
    return `${artistName} - ${data.title}`;
  }
  return data.title || `${entityType} #${data.id || 'New'}`;
};
