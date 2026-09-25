import { describe, expect, it, vi } from 'vitest';
import { Top11Contests } from './Top11Contests';
import { flattenRowFields } from './testUtils';

// The real lexicalEditor only resolves its feature list inside a live Payload
// instance, so mock it to expose the config for feature-swap assertions
// (same pattern as Posts.test.ts).
vi.mock('@payloadcms/richtext-lexical', () => ({
  lexicalEditor: vi.fn((config) => ({ _type: 'lexical', _config: config })),
  BlocksFeature: vi.fn((config) => ({ _type: 'blocks', ...config })),
  UploadFeature: vi.fn((config) => ({ _type: 'upload', key: 'upload', ...config })),
}));

describe('Top11Contests', () => {
  it('has expected slug and grouping', () => {
    expect(Top11Contests.slug).toBe('top11-contests');
    expect(Top11Contests.admin?.group).toBe('Top 11');
  });

  it('uses the contest lifecycle statuses', () => {
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

  it('has entries array with max 11 rows and collapsed song labels', () => {
    const entriesField = Top11Contests.fields.find((field) => field.name === 'entries') as {
      type?: string;
      minRows?: number;
      maxRows?: number;
      admin?: { initCollapsed?: boolean; components?: { RowLabel?: string } };
    };

    expect(entriesField.type).toBe('array');
    expect(entriesField.minRows).toBe(1);
    expect(entriesField.maxRows).toBe(11);
    expect(entriesField.admin?.initCollapsed).toBe(true);
    expect(entriesField.admin?.components?.RowLabel).toContain('Top11EntryRowLabel');
  });

  it('collapses nominee rows and uses song labels', () => {
    const nomineesField = Top11Contests.fields.find((field) => field.name === 'nominees') as {
      admin?: { initCollapsed?: boolean; components?: { RowLabel?: string } };
    };

    expect(nomineesField.admin?.initCollapsed).toBe(true);
    expect(nomineesField.admin?.components?.RowLabel).toContain('Top11NomineeRowLabel');
  });

  describe('nominees field', () => {
    const nomineesField = Top11Contests.fields.find((field) => field.name === 'nominees') as {
      type?: string;
      minRows?: number;
      maxRows?: number;
      validate?: (value: unknown) => true | string;
    };

    it('is an unbounded array distinct from entries', () => {
      expect(nomineesField.type).toBe('array');
      expect(nomineesField.minRows).toBeUndefined();
      expect(nomineesField.maxRows).toBeUndefined();
    });

    it('accepts an empty or undefined nominee pool', () => {
      expect(nomineesField.validate?.(undefined)).toBe(true);
      expect(nomineesField.validate?.([])).toBe(true);
    });

    it('accepts a nominee pool larger than 11 songs', () => {
      const pool = Array.from({ length: 57 }, (_, i) => ({ song: i + 1 }));
      expect(nomineesField.validate?.(pool)).toBe(true);
    });

    it('rejects a nominee row with no song', () => {
      expect(nomineesField.validate?.([{ song: undefined }])).toBe(
        'Each nominee must reference a valid song',
      );
    });

    it('rejects a duplicate song in the nominee pool', () => {
      expect(nomineesField.validate?.([{ song: 5 }, { song: 5 }])).toBe(
        'A song can only appear once in the nominee pool',
      );
    });
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

  it('lets editors change any field on a published or archived contest', async () => {
    const data = { weekOf: '2026-09-23T00:00:00.000Z', entries: [{ song: 2 }, { song: 1 }] };
    const hooks = Top11Contests.hooks?.beforeChange ?? [];
    await Promise.all(
      ['published', 'archived'].map(async (status) => {
        const originalDoc = { status, weekOf: '2026-09-16T00:00:00.000Z' };
        let result: unknown = data;
        // eslint-disable-next-line no-restricted-syntax -- hooks run in order
        for (const hook of hooks) {
          // eslint-disable-next-line no-await-in-loop
          result = await hook({ data: result, originalDoc, operation: 'update' } as never);
        }
        expect(result).toMatchObject({ slug: '2026-09-23', entries: [{ song: 2 }, { song: 1 }] });
      }),
    );
  });

  describe('displayTitle derivation hook', () => {
    const displayTitleHook = Top11Contests.hooks?.beforeChange?.[1];

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

    it('moves the slug along with weekOf so a date change updates the URL', () => {
      const data = { weekOf: '2026-09-23T00:00:00.000Z' };
      const originalDoc = { weekOf: '2026-09-16T00:00:00.000Z', slug: '2026-09-16' };
      const result = displayTitleHook?.({ data, originalDoc, operation: 'update' } as never) as {
        slug?: string;
      };
      expect(result.slug).toBe('2026-09-23');
    });

    it('leaves data untouched when there is no usable weekOf', () => {
      const data = { status: 'open' };
      const result = displayTitleHook?.({ data } as never);
      expect(result).toBe(data);
    });
  });

  it('has votingOpensAt and votingClosesAt as date fields with dayAndTime picker and a time-inclusive display format', () => {
    const allFields = flattenRowFields(Top11Contests.fields);
    const votingOpensAt = allFields.find((field) => field.name === 'votingOpensAt') as {
      type?: string;
      admin?: { date?: { pickerAppearance?: string; displayFormat?: string } };
    };
    const votingClosesAt = allFields.find((field) => field.name === 'votingClosesAt') as {
      type?: string;
      admin?: { date?: { pickerAppearance?: string; displayFormat?: string } };
    };
    expect(votingOpensAt?.type).toBe('date');
    expect(votingOpensAt?.admin?.date?.pickerAppearance).toBe('dayAndTime');
    expect(votingOpensAt?.admin?.date?.displayFormat).toBe('yyyy-MM-dd h:mm a');
    expect(votingClosesAt?.type).toBe('date');
    expect(votingClosesAt?.admin?.date?.pickerAppearance).toBe('dayAndTime');
    expect(votingClosesAt?.admin?.date?.displayFormat).toBe('yyyy-MM-dd h:mm a');
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

  it('embeds the show recording via the body rich text instead of dedicated fields', () => {
    const messageSnapshotField = Top11Contests.fields.find(
      (field) => field.name === 'messageSnapshot',
    ) as { fields?: Array<Record<string, unknown>> };
    const nestedFields = flattenRowFields(messageSnapshotField.fields ?? []);
    const names = nestedFields.map((field) => field.name);
    expect(names).not.toContain('recordingUrl');
    expect(names).not.toContain('recordingSource');

    const bodyField = nestedFields.find((field) => field.name === 'body');
    expect(bodyField?.type).toBe('richText');
  });

  it('swaps the body editor default upload for the alignment-aware one', () => {
    const messageSnapshotField = Top11Contests.fields.find(
      (field) => field.name === 'messageSnapshot',
    ) as { fields?: Array<Record<string, unknown>> };
    const bodyField = flattenRowFields(messageSnapshotField.fields ?? []).find(
      (field) => field.name === 'body',
    ) as { editor?: { _config?: { features?: unknown } } };

    // eslint-disable-next-line no-underscore-dangle -- Payload uses `_config` internally
    const featuresCallback = bodyField?.editor?._config?.features;
    expect(typeof featuresCallback).toBe('function');

    const mockDefaultFeatures = [
      { id: 'paragraph', key: 'paragraph' },
      { id: 'default-upload', key: 'upload' },
    ];
    const result = featuresCallback!({ defaultFeatures: mockDefaultFeatures });

    // paragraph (default) + ImageAlignmentUploadFeature + EmbedFeature
    expect(result).toHaveLength(3);
    expect(result.some((f: any) => f.id === 'default-upload')).toBe(false);
    const uploadFeature = result.find((f: any) => f._type === 'upload') as any;
    expect(uploadFeature.collections.media.fields.map((f: any) => f.name)).toEqual([
      'alignment',
      'size',
      'linkUrl',
    ]);
    expect(result[2]._type).toBe('blocks');
  });

  it('hides displayOrder from the entries admin form', () => {
    const entriesField = Top11Contests.fields.find((field) => field.name === 'entries') as {
      fields?: Array<{ name?: string; hidden?: boolean }>;
    };
    const displayOrderField = entriesField.fields?.find((field) => field.name === 'displayOrder');
    expect(displayOrderField?.hidden).toBe(true);
  });

  describe('displayOrder derivation hook', () => {
    const renumberHook = Top11Contests.hooks?.beforeChange?.[0];

    it('renumbers entries to match row position', () => {
      const data = {
        entries: [{ song: 3 }, { song: 1 }, { song: 2 }],
      };

      const result = renumberHook?.({ data } as never) as {
        entries: Array<{ displayOrder: number; song: number }>;
      };

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

  describe('/clone', () => {
    const cloneEndpoint = Top11Contests.endpoints?.find((e) => e.path === '/clone');

    it('copies entries and the nominee ballot without reusing row ids', async () => {
      const findByID = vi.fn().mockResolvedValue({
        id: 5,
        status: 'published',
        weekOf: '2026-09-16T00:00:00.000Z',
        entries: [
          { id: 'e1', song: 7 },
          { id: 'e2', song: 3 },
        ],
        nominees: [
          { id: 'n1', song: 7 },
          { id: 'n2', song: 12 },
        ],
        settings: { excludePriorWinners: true },
      });
      const create = vi.fn().mockImplementation(async ({ data }) => ({ id: 6, ...data }));
      const req = {
        user: { role: 'admin' },
        json: async () => ({ sourceContestId: 5 }),
        payload: { findByID, create },
      };

      await cloneEndpoint?.handler(req as never);

      const { data } = create.mock.calls[0][0];
      expect(data.status).toBe('draft');
      expect(data.weekOf).toBe('2026-09-23T00:00:00.000Z');
      expect(data.entries).toEqual([{ song: 7 }, { song: 3 }]);
      expect(data.nominees).toEqual([{ song: 7 }, { song: 12 }]);
    });

    it('clones a contest with no nominees to an empty ballot', async () => {
      const findByID = vi.fn().mockResolvedValue({
        id: 5,
        weekOf: '2026-09-16T00:00:00.000Z',
        entries: [{ id: 'e1', song: 7 }],
      });
      const create = vi.fn().mockImplementation(async ({ data }) => ({ id: 6, ...data }));
      const req = {
        user: { role: 'admin' },
        json: async () => ({ sourceContestId: 5 }),
        payload: { findByID, create },
      };

      await cloneEndpoint?.handler(req as never);

      expect(create.mock.calls[0][0].data.nominees).toEqual([]);
    });
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
          song: 7,
          songTitle: 'Song Seven',
          songArtist: 'Artist A',
          displayOrder: 1,
          votes: 0,
        },
        {
          song: 3,
          songTitle: 'Song Three',
          songArtist: 'Artist B',
          displayOrder: 2,
          votes: 0,
        },
        {
          song: 9,
          songTitle: 'Song Nine',
          songArtist: 'Artist C',
          displayOrder: 3,
          votes: 0,
        },
      ]);
    });

    it("includes nominees not on last week's entries chart, ranked by votes", async () => {
      // song 5 is a nominee that is NOT in entries -- before the fix its votes
      // were counted but never surfaced in rankedSongs. It should now appear,
      // and (with the most votes) rank first.
      const find = vi.fn().mockImplementation(async ({ collection }: { collection: string }) => {
        if (collection === 'songs') {
          return {
            docs: [
              { id: 7, title: 'Song Seven', artist: { name: 'Artist A' } },
              { id: 3, title: 'Song Three', artist: { name: 'Artist B' } },
              { id: 5, title: 'Song Five', artist: { name: 'Artist E' } },
            ],
          };
        }
        if (collection === 'top11-votes') {
          return {
            docs: [
              { id: 1, song: 5, voterEmail: 'a@example.com' },
              { id: 2, song: 5, voterEmail: 'b@example.com' },
              { id: 3, song: 7, voterEmail: 'c@example.com' },
            ],
          };
        }
        return { docs: [] };
      });
      const findByID = vi.fn().mockResolvedValue({
        id: 1,
        status: 'open',
        entries: [{ song: 7 }, { song: 3 }],
        nominees: [{ song: 7 }, { song: 3 }, { song: 5 }],
      });
      const req = {
        user: { role: 'admin' },
        routeParams: { id: '1' },
        payload: { find, findByID },
      };

      const response = await statsEndpoint?.handler(req as never);
      const body = await (response as Response).json();

      expect(body.rankedSongs).toEqual([
        { song: 5, songTitle: 'Song Five', songArtist: 'Artist E', displayOrder: 3, votes: 2 },
        { song: 7, songTitle: 'Song Seven', songArtist: 'Artist A', displayOrder: 1, votes: 1 },
        { song: 3, songTitle: 'Song Three', songArtist: 'Artist B', displayOrder: 2, votes: 0 },
      ]);
    });

    it('uses alphabetical artist order to break equal vote counts', async () => {
      const find = vi.fn().mockImplementation(async ({ collection }: { collection: string }) => {
        if (collection === 'songs') {
          return {
            docs: [
              { id: 7, title: 'Chart Song', artist: { name: 'Artist B' } },
              { id: 5, title: 'Ballot Song', artist: { name: 'Artist A' } },
            ],
          };
        }
        if (collection === 'top11-votes') {
          return {
            docs: [
              { id: 1, song: 7, voterEmail: 'a@example.com' },
              { id: 2, song: 5, voterEmail: 'b@example.com' },
            ],
          };
        }
        return { docs: [] };
      });
      const findByID = vi.fn().mockResolvedValue({
        id: 1,
        status: 'open',
        entries: [{ song: 7 }],
        nominees: [{ song: 5 }],
      });
      const req = {
        user: { role: 'admin' },
        routeParams: { id: '1' },
        payload: { find, findByID },
      };

      const response = await statsEndpoint?.handler(req as never);
      const body = await (response as Response).json();

      expect(body.rankedSongs.map((song: { song: number }) => song.song)).toEqual([5, 7]);
    });

    it('normalizes populated entry and nominee relationships', async () => {
      const find = vi.fn().mockImplementation(async ({ collection }: { collection: string }) => {
        if (collection === 'songs') {
          return { docs: [{ id: 7, title: 'Song Seven', artist: { name: 'Artist A' } }] };
        }
        return { docs: [] };
      });
      const findByID = vi.fn().mockResolvedValue({
        id: 1,
        status: 'open',
        entries: [{ song: { id: 7 } }],
        nominees: [{ song: { id: 7 } }],
      });
      const req = {
        user: { role: 'admin' },
        routeParams: { id: '1' },
        payload: { find, findByID },
      };

      const response = await statsEndpoint?.handler(req as never);
      const body = await (response as Response).json();

      expect(body.rankedSongs).toEqual([
        { song: 7, songTitle: 'Song Seven', songArtist: 'Artist A', displayOrder: 1, votes: 0 },
      ]);
      expect(find).toHaveBeenCalledWith(expect.objectContaining({ where: { id: { in: [7] } } }));
    });

    it('de-dupes songs that appear in both entries and nominees', async () => {
      const find = vi.fn().mockImplementation(async ({ collection }: { collection: string }) => {
        if (collection === 'songs') {
          return { docs: [{ id: 7, title: 'Song Seven', artist: { name: 'Artist A' } }] };
        }
        return { docs: [] };
      });
      const findByID = vi.fn().mockResolvedValue({
        id: 1,
        status: 'open',
        entries: [{ song: 7 }],
        nominees: [{ song: 7 }],
      });
      const req = {
        user: { role: 'admin' },
        routeParams: { id: '1' },
        payload: { find, findByID },
      };

      const response = await statsEndpoint?.handler(req as never);
      const body = await (response as Response).json();

      expect(body.rankedSongs).toEqual([
        { song: 7, songTitle: 'Song Seven', songArtist: 'Artist A', displayOrder: 1, votes: 0 },
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
          song: 42,
          songTitle: null,
          songArtist: null,
          displayOrder: 1,
          votes: 0,
        },
      ]);
    });
  });
});
