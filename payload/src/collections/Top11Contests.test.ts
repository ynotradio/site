import { describe, expect, it, vi } from 'vitest';
import { Top11Contests } from './Top11Contests';
import { flattenRowFields } from './testUtils';

describe('Top11Contests', () => {
  it('has expected slug and grouping', () => {
    expect(Top11Contests.slug).toBe('top11-contests');
    expect(Top11Contests.admin?.group).toBe('Top 11');
  });

  it('uses immutable lifecycle statuses', () => {
    const allFields = flattenRowFields(Top11Contests.fields);
    const statusField = allFields.find((field) => field.name === 'status') as {
      options?: Array<{ value: string }>;
      defaultValue?: string;
    };

    expect(statusField?.defaultValue).toBe('draft');
    expect(statusField?.options?.map((option) => option.value)).toEqual([
      'draft',
      'open',
      'closed',
      'published',
      'archived',
    ]);
  });

  it('has entries array with max 11 rows', () => {
    const entriesField = Top11Contests.fields.find((field) => field.name === 'entries') as {
      type?: string;
      minRows?: number;
      maxRows?: number;
    };

    expect(entriesField.type).toBe('array');
    expect(entriesField.minRows).toBe(1);
    expect(entriesField.maxRows).toBe(11);
  });

  it('does not have a title field; a derived displayTitle is used as the admin title', () => {
    const allFields = flattenRowFields(Top11Contests.fields);
    expect(allFields.some((field) => field.name === 'title')).toBe(false);
    expect(allFields.some((field) => field.name === 'displayTitle')).toBe(true);
    expect(Top11Contests.admin?.useAsTitle).toBe('displayTitle');
  });

  it('hides displayTitle from the admin form but keeps it readable via the API', () => {
    const displayTitleField = Top11Contests.fields.find(
      (field) => field.name === 'displayTitle',
    ) as { hidden?: boolean; admin?: { hidden?: boolean } };
    expect(displayTitleField?.hidden).toBeUndefined();
    expect(displayTitleField?.admin?.hidden).toBe(true);
  });

  describe('displayTitle derivation hook', () => {
    const displayTitleHook = Top11Contests.hooks?.beforeChange?.[2];

    it('derives a human-readable title from weekOf on create', () => {
      const data = { weekOf: '2026-06-25T00:00:00.000Z' };
      const result = displayTitleHook?.({ data } as never) as { displayTitle?: string };
      expect(result.displayTitle).toBe('Thu, Jun 25, 2026');
    });

    it('falls back to the original doc weekOf when weekOf is not part of the update', () => {
      const data = { status: 'open' };
      const originalDoc = { weekOf: '2026-06-25T00:00:00.000Z' };
      const result = displayTitleHook?.({ data, originalDoc } as never) as {
        displayTitle?: string;
      };
      expect(result.displayTitle).toBe('Thu, Jun 25, 2026');
    });

    it('leaves data untouched when there is no usable weekOf', () => {
      const data = { status: 'open' };
      const result = displayTitleHook?.({ data } as never);
      expect(result).toBe(data);
    });
  });

  it('derives the slug from weekOf instead of a title field', () => {
    const allFields = flattenRowFields(Top11Contests.fields);
    const slugField = allFields.find((field) => field.name === 'slug') as {
      admin?: { components?: { Field?: { clientProps?: { useAsSlug?: string } } } };
    };
    expect(slugField).toBeDefined();
  });

  it('does not have a bandLinks field or externalTemplateUrl field', () => {
    const allFields = flattenRowFields(Top11Contests.fields);
    const names = allFields.map((field) => field.name);
    expect(names).not.toContain('bandLinks');
    expect(names).not.toContain('externalTemplateUrl');
  });

  it('has recording fields for the show recording embed', () => {
    const messageSnapshotField = Top11Contests.fields.find(
      (field) => field.name === 'messageSnapshot',
    ) as { fields?: Array<Record<string, unknown>> };
    const nestedFields = flattenRowFields(messageSnapshotField.fields ?? []);
    const names = nestedFields.map((field) => field.name);
    expect(names).toContain('recordingUrl');
    expect(names).toContain('recordingSource');

    const sourceField = nestedFields.find((field) => field.name === 'recordingSource') as {
      options?: Array<{ value: string }>;
    };
    expect(sourceField.options?.map((option) => option.value)).toEqual([
      'mixcloud',
      'opendrive',
      'other',
    ]);
  });

  it('hides displayOrder from the entries admin form', () => {
    const entriesField = Top11Contests.fields.find((field) => field.name === 'entries') as {
      fields?: Array<{ name?: string; hidden?: boolean }>;
    };
    const displayOrderField = entriesField.fields?.find((field) => field.name === 'displayOrder');
    expect(displayOrderField?.hidden).toBe(true);
  });

  describe('displayOrder derivation hook', () => {
    const renumberHook = Top11Contests.hooks?.beforeChange?.[1];

    it('renumbers entries to match row position', () => {
      const data = {
        entries: [
          { song: 3 },
          { song: 1 },
          { song: 2 },
        ],
      };

      const result = renumberHook?.({ data } as never) as { entries: Array<{ displayOrder: number; song: number }> };

      expect(result.entries.map((e) => e.displayOrder)).toEqual([1, 2, 3]);
      expect(result.entries.map((e) => e.song)).toEqual([3, 1, 2]);
    });

    it('leaves data untouched when entries is not present', () => {
      const data = { status: 'open' };
      const result = renumberHook?.({ data } as never);
      expect(result).toBe(data);
    });
  });

  it('exposes lifecycle and operations endpoints', () => {
    const endpoints = Top11Contests.endpoints ?? [];
    const paths = endpoints.map((endpoint) => endpoint.path);

    expect(paths).toContain('/:id/open');
    expect(paths).toContain('/:id/close');
    expect(paths).toContain('/:id/publish');
    expect(paths).toContain('/:id/archive');
    expect(paths).toContain('/clone');
    expect(paths).toContain('/:id/stats');
    expect(paths).toContain('/:id/pick-winner');
  });

  describe('/:id/stats write-in grouping', () => {
    const statsEndpoint = Top11Contests.endpoints?.find((e) => e.path === '/:id/stats');

    const makeRequest = (writeInDocs: Array<{ id: number; writeIn: string; display: boolean }>) => {
      const find = vi.fn().mockImplementation(async ({ collection }: { collection: string }) => {
        if (collection === 'top11-write-ins') {
          return { docs: writeInDocs };
        }
        return { docs: [] };
      });
      const findByID = vi.fn().mockResolvedValue({
        id: 1,
        status: 'closed',
        entries: [],
      });
      return {
        req: {
          user: { role: 'admin' },
          routeParams: { id: '1' },
          payload: { find, findByID },
        },
      };
    };

    it('groups write-ins by normalized text and counts them', async () => {
      const { req } = makeRequest([
        { id: 1, writeIn: 'Free Bird', display: true },
        { id: 2, writeIn: ' free bird ', display: true },
        { id: 3, writeIn: 'Stairway to Heaven', display: false },
      ]);

      const response = await statsEndpoint?.handler(req as never);
      const body = await (response as Response).json();

      expect(body.rankedWriteIns).toEqual([
        { text: 'Free Bird', count: 2, hiddenCount: 0 },
        { text: 'Stairway to Heaven', count: 1, hiddenCount: 1 },
      ]);
      expect(body.writeInCount).toBe(3);
    });

    it('returns an empty array when there are no write-ins', async () => {
      const { req } = makeRequest([]);

      const response = await statsEndpoint?.handler(req as never);
      const body = await (response as Response).json();

      expect(body.rankedWriteIns).toEqual([]);
    });
  });

  describe('/:id/stats rankedSongs displayOrder', () => {
    const statsEndpoint = Top11Contests.endpoints?.find((e) => e.path === '/:id/stats');

    it('derives displayOrder from entries array position, not the hidden field', async () => {
      const find = vi.fn().mockImplementation(async ({ collection }: { collection: string }) => {
        if (collection === 'songs') {
          return {
            docs: [
              { id: 7, title: 'Song Seven', artist: { name: 'Artist A' } },
              { id: 3, title: 'Song Three', artist: { name: 'Artist B' } },
              { id: 9, title: 'Song Nine', artist: { name: 'Artist C' } },
            ],
          };
        }
        return { docs: [] };
      });
      // displayOrder is a hidden field, so a real read never includes it —
      // this mock matches that runtime shape.
      const findByID = vi.fn().mockResolvedValue({
        id: 1,
        status: 'closed',
        entries: [{ song: 7 }, { song: 3 }, { song: 9 }],
      });
      const req = {
        user: { role: 'admin' },
        routeParams: { id: '1' },
        payload: { find, findByID },
      };

      const response = await statsEndpoint?.handler(req as never);
      const body = await (response as Response).json();

      expect(body.rankedSongs).toEqual([
        {
          song: 7, songTitle: 'Song Seven', songArtist: 'Artist A', displayOrder: 1, votes: 0,
        },
        {
          song: 3, songTitle: 'Song Three', songArtist: 'Artist B', displayOrder: 2, votes: 0,
        },
        {
          song: 9, songTitle: 'Song Nine', songArtist: 'Artist C', displayOrder: 3, votes: 0,
        },
      ]);
    });

    it('falls back gracefully when a song cannot be found', async () => {
      const find = vi.fn().mockResolvedValue({ docs: [] });
      const findByID = vi.fn().mockResolvedValue({
        id: 1,
        status: 'closed',
        entries: [{ song: 42 }],
      });
      const req = {
        user: { role: 'admin' },
        routeParams: { id: '1' },
        payload: { find, findByID },
      };

      const response = await statsEndpoint?.handler(req as never);
      const body = await (response as Response).json();

      expect(body.rankedSongs).toEqual([
        {
          song: 42, songTitle: null, songArtist: null, displayOrder: 1, votes: 0,
        },
      ]);
    });
  });
});
