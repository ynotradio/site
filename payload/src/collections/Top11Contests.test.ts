import { describe, expect, it, vi } from 'vitest';
import { Top11Contests } from './Top11Contests';
import { flattenRowFields } from './testUtils';

describe('Top11Contests', () => {
  it('has expected slug and grouping', () => {
    expect(Top11Contests.slug).toBe('top11-contests');
    expect(Top11Contests.admin?.group).toBe('Polls & Contests');
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
});
