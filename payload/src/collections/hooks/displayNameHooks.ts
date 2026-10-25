import type { CollectionBeforeChangeHook } from 'payload';

export const generateDJDisplayName: CollectionBeforeChangeHook = async ({ data, req }) => {
  const updatedData = data;

  // Respect manually entered display names; only auto-generate when empty
  if (!updatedData.displayName) {
    if (updatedData.person && Array.isArray(updatedData.person) && updatedData.person.length > 0) {
      const personIds = updatedData.person.map((p: unknown) => (typeof p === 'object' && p !== null && 'id' in p ? (p as { id: unknown }).id : p));

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
          updatedData.displayName = people.docs
            .map((p: { name?: unknown }) => String(p.name || ''))
            .join(' & ');
        }
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.error('Error fetching person names for DJ:', error);
        }
      }

      if (!updatedData.displayName) {
        updatedData.displayName = `DJ #${updatedData.id || 'New'}`;
      }
    }
  }

  return updatedData;
};

// New DJs are entered with one name; the Person record behind them is created
// (or reused, when someone with that exact name exists) so DJs stay linked to
// People for reviewers and co-host lookups. Failing to link never blocks the save.
export const linkPersonToDJ: CollectionBeforeChangeHook = async ({ data, req, operation }) => {
  const updatedData = data;
  const name = typeof updatedData.displayName === 'string' ? updatedData.displayName.trim() : '';
  const hasPerson = Array.isArray(updatedData.person) && updatedData.person.length > 0;

  if (operation !== 'create' || hasPerson || !name) {
    return updatedData;
  }

  try {
    const existing = await req.payload.find({
      collection: 'people',
      where: { name: { equals: name } },
      limit: 1,
      req,
    });
    const person = existing.docs[0] ?? (await req.payload.create({ collection: 'people', data: { name }, req }));
    updatedData.person = [person.id];
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error('Error linking person for DJ:', error);
    }
  }

  return updatedData;
};

export const generateMusicDisplayName = (entityType: 'Song' | 'Record'): CollectionBeforeChangeHook => async ({ data, req }) => {
  const updatedData = data;
  let artistName = '';

  if (updatedData.artist) {
    if (
      typeof updatedData.artist === 'object'
        && (updatedData.artist as { name?: string }).name
    ) {
      artistName = (updatedData.artist as { name: string }).name;
    } else {
      try {
        const artist = await req.payload.findByID({
          collection: 'artists',
          id:
              typeof updatedData.artist === 'object'
                ? (updatedData.artist as { id: unknown }).id
                : updatedData.artist,
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
