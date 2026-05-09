import { describe, expect, it, vi } from 'vitest';
import { OnDemand } from './OnDemand';
import { flattenRowFields } from './testUtils';

describe('OnDemand', () => {
  it('has the correct slug', () => {
    expect(OnDemand.slug).toBe('ondemand');
  });

  it('has correct labels', () => {
    expect(OnDemand.labels?.singular).toBe('On Demand Recording');
    expect(OnDemand.labels?.plural).toBe('On Demand Recordings');
  });

  it('uses headline as admin title', () => {
    expect(OnDemand.admin?.useAsTitle).toBe('headline');
  });

  it('is grouped under Radio', () => {
    expect(OnDemand.admin?.group).toBe('Radio');
  });

  it('has drafts enabled', () => {
    expect((OnDemand.versions as { drafts?: boolean })?.drafts).toBe(true);
  });

  it('sorts by date descending by default', () => {
    expect(OnDemand.defaultSort).toBe('-date');
  });

  it('has timestamps enabled', () => {
    expect(OnDemand.timestamps).toBe(true);
  });

  it('has public read access', () => {
    const readFn = OnDemand.access?.read as () => boolean;
    expect(readFn()).toBe(true);
  });

  it('requires authentication to create', () => {
    const createFn = OnDemand.access?.create as (args: { req: { user: unknown } }) => boolean;
    expect(createFn({ req: { user: null } })).toBe(false);
    expect(createFn({ req: { user: { id: '1' } } })).toBe(true);
  });

  it('allows admin, editor, and dj to update', () => {
    const updateFn = OnDemand.access?.update as (args: { req: { user: unknown } }) => boolean;
    expect(updateFn({ req: { user: { role: 'admin' } } })).toBe(true);
    expect(updateFn({ req: { user: { role: 'editor' } } })).toBe(true);
    expect(updateFn({ req: { user: { role: 'dj' } } })).toBe(true);
    expect(updateFn({ req: { user: { role: 'viewer' } } })).toBe(false);
    expect(updateFn({ req: { user: null } })).toBe(false);
  });

  it('allows only admin to delete', () => {
    const deleteFn = OnDemand.access?.delete as (args: { req: { user: unknown } }) => boolean;
    expect(deleteFn({ req: { user: { role: 'admin' } } })).toBe(true);
    expect(deleteFn({ req: { user: { role: 'editor' } } })).toBe(false);
    expect(deleteFn({ req: { user: { role: 'dj' } } })).toBe(false);
  });

  it('has date as a required date field with index', () => {
    const fields = flattenRowFields(OnDemand.fields as Record<string, unknown>[]);
    const dateField = fields.find((f) => f.name === 'date');
    expect(dateField?.type).toBe('date');
    expect(dateField?.required).toBe(true);
    expect(dateField?.index).toBe(true);
  });

  it('has headline as a required text field with index', () => {
    const fields = flattenRowFields(OnDemand.fields as Record<string, unknown>[]);
    const headlineField = fields.find((f) => f.name === 'headline');
    expect(headlineField?.type).toBe('text');
    expect(headlineField?.required).toBe(true);
    expect(headlineField?.index).toBe(true);
  });

  it('has djs as a hasMany relationship to djs', () => {
    const fields = flattenRowFields(OnDemand.fields as Record<string, unknown>[]);
    const djsField = fields.find((f) => f.name === 'djs');
    expect(djsField?.type).toBe('relationship');
    expect(djsField?.relationTo).toBe('djs');
    expect(djsField?.hasMany).toBe(true);
  });

  it('has artists as a hasMany relationship to artists', () => {
    const fields = flattenRowFields(OnDemand.fields as Record<string, unknown>[]);
    const artistsField = fields.find((f) => f.name === 'artists');
    expect(artistsField?.type).toBe('relationship');
    expect(artistsField?.relationTo).toBe('artists');
    expect(artistsField?.hasMany).toBe(true);
  });

  it('has songs as a hasMany relationship to songs', () => {
    const fields = flattenRowFields(OnDemand.fields as Record<string, unknown>[]);
    const songsField = fields.find((f) => f.name === 'songs');
    expect(songsField?.type).toBe('relationship');
    expect(songsField?.relationTo).toBe('songs');
    expect(songsField?.hasMany).toBe(true);
  });

  it('filters songs by selected artists', () => {
    const fields = flattenRowFields(OnDemand.fields as Record<string, unknown>[]);
    const songsField = fields.find((f) => f.name === 'songs') as { filterOptions?: Function };
    expect(typeof songsField?.filterOptions).toBe('function');

    // Without artists selected, returns true (no filter)
    const noArtists = songsField?.filterOptions?.({ data: {} });
    expect(noArtists).toBe(true);

    // With empty artists array, returns true
    const emptyArtists = songsField?.filterOptions?.({ data: { artists: [] } });
    expect(emptyArtists).toBe(true);

    // With artists selected, filters by artist IDs
    const withArtists = songsField?.filterOptions?.({
      data: { artists: ['artist-1', 'artist-2'] },
    });
    expect(withArtists).toEqual({ artist: { in: ['artist-1', 'artist-2'] } });

    // Handles object-form artist entries (populated relationships)
    const withObjectArtists = songsField?.filterOptions?.({
      data: { artists: [{ id: 'artist-3' }] },
    });
    expect(withObjectArtists).toEqual({ artist: { in: ['artist-3'] } });
  });

  it('has audioUrl as a text field', () => {
    const fields = flattenRowFields(OnDemand.fields as Record<string, unknown>[]);
    const audioUrlField = fields.find((f) => f.name === 'audioUrl');
    expect(audioUrlField?.type).toBe('text');
  });

  it('has source as a select field with opendrive, soundcloud, and other options', () => {
    const fields = flattenRowFields(OnDemand.fields as Record<string, unknown>[]);
    const sourceField = fields.find((f) => f.name === 'source') as {
      type?: string;
      options?: { value: string }[];
    };
    expect(sourceField?.type).toBe('select');
    const values = sourceField?.options?.map((o) => o.value);
    expect(values).toContain('opendrive');
    expect(values).toContain('soundcloud');
    expect(values).toContain('other');
  });

  it('has legacyId as a unique number field', () => {
    const fields = flattenRowFields(OnDemand.fields as Record<string, unknown>[]);
    const legacyField = fields.find((f) => f.name === 'legacyId');
    expect(legacyField?.type).toBe('number');
    expect(legacyField?.unique).toBe(true);
  });

  it('has expected default columns', () => {
    expect(OnDemand.admin?.defaultColumns).toContain('headline');
    expect(OnDemand.admin?.defaultColumns).toContain('date');
    expect(OnDemand.admin?.defaultColumns).toContain('djs');
    expect(OnDemand.admin?.defaultColumns).toContain('_status');
  });

  it('includes headline, artistsText and songsText in listSearchableFields', () => {
    expect(OnDemand.admin?.listSearchableFields).toContain('headline');
    expect(OnDemand.admin?.listSearchableFields).toContain('artistsText');
    expect(OnDemand.admin?.listSearchableFields).toContain('songsText');
  });

  it('has artistsText as a hidden readOnly text field with a beforeChange hook', () => {
    const fields = flattenRowFields(OnDemand.fields as Record<string, unknown>[]);
    const artistsTextField = fields.find((f) => f.name === 'artistsText');
    expect(artistsTextField?.type).toBe('text');
    const admin = artistsTextField?.admin as { hidden?: boolean; readOnly?: boolean } | undefined;
    expect(admin?.hidden).toBe(true);
    expect(admin?.readOnly).toBe(true);
    const hooks = artistsTextField?.hooks as { beforeChange?: unknown[] } | undefined;
    expect(hooks?.beforeChange?.length ?? 0).toBeGreaterThan(0);
  });

  it('has songsText as a hidden readOnly text field with a beforeChange hook', () => {
    const fields = flattenRowFields(OnDemand.fields as Record<string, unknown>[]);
    const songsTextField = fields.find((f) => f.name === 'songsText');
    expect(songsTextField?.type).toBe('text');
    const admin = songsTextField?.admin as { hidden?: boolean; readOnly?: boolean } | undefined;
    expect(admin?.hidden).toBe(true);
    expect(admin?.readOnly).toBe(true);
    const hooks = songsTextField?.hooks as { beforeChange?: unknown[] } | undefined;
    expect(hooks?.beforeChange?.length ?? 0).toBeGreaterThan(0);
  });

  it('syncArtistsText hook returns empty string when artists is empty', async () => {
    const fields = flattenRowFields(OnDemand.fields as Record<string, unknown>[]);
    const artistsTextField = fields.find((f) => f.name === 'artistsText');
    const hooks = artistsTextField?.hooks as { beforeChange?: ((args: unknown) => unknown)[] };
    const hook = hooks?.beforeChange?.[0];
    expect(typeof hook).toBe('function');
    const result = await hook!({ siblingData: { artists: [] }, req: { payload: { find: vi.fn() } } });
    expect(result).toBe('');
  });

  it('syncArtistsText hook fetches and joins artist names', async () => {
    const fields = flattenRowFields(OnDemand.fields as Record<string, unknown>[]);
    const artistsTextField = fields.find((f) => f.name === 'artistsText');
    const hooks = artistsTextField?.hooks as { beforeChange?: ((args: unknown) => unknown)[] };
    const hook = hooks?.beforeChange?.[0];
    const mockFind = vi.fn().mockResolvedValue({ docs: [{ name: 'The National' }, { name: 'Phoebe Bridgers' }] });
    const result = await hook!({
      siblingData: { artists: [1, 2] },
      req: { payload: { find: mockFind } },
    });
    expect(result).toBe('The National, Phoebe Bridgers');
    expect(mockFind).toHaveBeenCalledWith(
      expect.objectContaining({ collection: 'artists', where: { id: { in: [1, 2] } } }),
    );
  });

  it('syncArtistsText hook handles object-form artist entries', async () => {
    const fields = flattenRowFields(OnDemand.fields as Record<string, unknown>[]);
    const artistsTextField = fields.find((f) => f.name === 'artistsText');
    const hooks = artistsTextField?.hooks as { beforeChange?: ((args: unknown) => unknown)[] };
    const hook = hooks?.beforeChange?.[0];
    const mockFind = vi.fn().mockResolvedValue({ docs: [{ name: 'The National' }] });
    const result = await hook!({
      siblingData: { artists: [{ id: 1, name: 'The National' }] },
      req: { payload: { find: mockFind } },
    });
    expect(result).toBe('The National');
    expect(mockFind).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: { in: [1] } } }),
    );
  });

  it('syncArtistsText hook returns empty string on fetch error', async () => {
    const fields = flattenRowFields(OnDemand.fields as Record<string, unknown>[]);
    const artistsTextField = fields.find((f) => f.name === 'artistsText');
    const hooks = artistsTextField?.hooks as { beforeChange?: ((args: unknown) => unknown)[] };
    const hook = hooks?.beforeChange?.[0];
    const mockFind = vi.fn().mockRejectedValue(new Error('DB error'));
    const result = await hook!({
      siblingData: { artists: [1] },
      req: { payload: { find: mockFind } },
    });
    expect(result).toBe('');
  });

  it('syncSongsText hook returns empty string when songs is empty', async () => {
    const fields = flattenRowFields(OnDemand.fields as Record<string, unknown>[]);
    const songsTextField = fields.find((f) => f.name === 'songsText');
    const hooks = songsTextField?.hooks as { beforeChange?: ((args: unknown) => unknown)[] };
    const hook = hooks?.beforeChange?.[0];
    expect(typeof hook).toBe('function');
    const result = await hook!({ siblingData: { songs: [] }, req: { payload: { find: vi.fn() } } });
    expect(result).toBe('');
  });

  it('syncSongsText hook fetches and joins song displayNames', async () => {
    const fields = flattenRowFields(OnDemand.fields as Record<string, unknown>[]);
    const songsTextField = fields.find((f) => f.name === 'songsText');
    const hooks = songsTextField?.hooks as { beforeChange?: ((args: unknown) => unknown)[] };
    const hook = hooks?.beforeChange?.[0];
    const mockFind = vi.fn().mockResolvedValue({
      docs: [
        { displayName: 'The National — Bloodbuzz Ohio' },
        { displayName: 'Phoebe Bridgers — Savior Complex' },
      ],
    });
    const result = await hook!({
      siblingData: { songs: [10, 11] },
      req: { payload: { find: mockFind } },
    });
    expect(result).toBe('The National — Bloodbuzz Ohio, Phoebe Bridgers — Savior Complex');
    expect(mockFind).toHaveBeenCalledWith(
      expect.objectContaining({ collection: 'songs', where: { id: { in: [10, 11] } } }),
    );
  });

  it('syncSongsText hook falls back to title when displayName is missing', async () => {
    const fields = flattenRowFields(OnDemand.fields as Record<string, unknown>[]);
    const songsTextField = fields.find((f) => f.name === 'songsText');
    const hooks = songsTextField?.hooks as { beforeChange?: ((args: unknown) => unknown)[] };
    const hook = hooks?.beforeChange?.[0];
    const mockFind = vi.fn().mockResolvedValue({ docs: [{ title: 'Bloodbuzz Ohio' }] });
    const result = await hook!({
      siblingData: { songs: [10] },
      req: { payload: { find: mockFind } },
    });
    expect(result).toBe('Bloodbuzz Ohio');
  });

  it('syncSongsText hook returns empty string on fetch error', async () => {
    const fields = flattenRowFields(OnDemand.fields as Record<string, unknown>[]);
    const songsTextField = fields.find((f) => f.name === 'songsText');
    const hooks = songsTextField?.hooks as { beforeChange?: ((args: unknown) => unknown)[] };
    const hook = hooks?.beforeChange?.[0];
    const mockFind = vi.fn().mockRejectedValue(new Error('DB error'));
    const result = await hook!({
      siblingData: { songs: [10] },
      req: { payload: { find: mockFind } },
    });
    expect(result).toBe('');
  });
});
