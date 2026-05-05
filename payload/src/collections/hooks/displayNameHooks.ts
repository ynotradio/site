import type { CollectionBeforeChangeHook } from 'payload';

export const generateDJDisplayName: CollectionBeforeChangeHook = async ({ data, req }) => {
  const updatedData = data;

  if (updatedData.person && Array.isArray(updatedData.person) && updatedData.person.length > 0) {
    const personIds = updatedData.person.map(
      (p: unknown) => (typeof p === 'object' && p !== null && 'id' in p ? (p as { id: unknown }).id : p),
    );

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
        updatedData.displayName = people.docs.map(
          (p: { name?: unknown }) => String(p.name || ''),
        ).join(', ');
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

export const generateMusicDisplayName = (entityType: 'Song' | 'Record'): CollectionBeforeChangeHook => async ({ data, req }) => {
  const updatedData = data;
  let artistName = '';

  if (updatedData.artist) {
    if (typeof updatedData.artist === 'object' && (updatedData.artist as { name?: string }).name) {
      artistName = (updatedData.artist as { name: string }).name;
    } else {
      try {
        const artist = await req.payload.findByID({
          collection: 'artists',
          id: typeof updatedData.artist === 'object' ? (updatedData.artist as { id: unknown }).id : updatedData.artist,
        });
        if (artist) {
          artistName = artist.name;
        }
      } catch {
        // Silently handle errors
      }
    }
  }

  if (artistName && updatedData.title) {
    updatedData.displayName = `${artistName} - ${updatedData.title}`;
  } else {
    updatedData.displayName = updatedData.title || `${entityType} #${updatedData.id || 'New'}`;
  }

  return updatedData;
};
