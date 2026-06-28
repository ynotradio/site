import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import type { Payload } from 'payload';

const mockLogger = vi.hoisted(() => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
}));

vi.mock('mysql2/promise', () => ({
  default: {
    createConnection: vi.fn(),
  },
  createConnection: vi.fn(),
}));

vi.mock('./database', () => ({
  getActiveOnDemand: vi.fn(),
}));

vi.mock('../../config/databases', () => ({
  getMySQLConfig: vi.fn(() => ({
    host: 'localhost',
    database: 'ynot_site',
    user: 'root',
    password: 'root',
  })),
  getLegacyDbConfig: vi.fn(() => ({
    host: 'localhost',
    database: 'ynot_site',
    user: 'root',
    password: 'root',
  })),
  migrationConfig: {
    baseUrl: 'https://www.ynotradio.net/',
  },
  parseFromToArgs: vi.fn(() => ({
    from: 'prod-mysql',
    to: 'prod-neon',
  })),
}));

vi.mock('./shared/payloadClient', () => ({
  getPayloadClient: vi.fn(),
  findOrCreateArtist: vi.fn(),
  findOrCreateSong: vi.fn(),
  parseOnDemandHeadline: vi.fn((headline: string) => ({
    djNames: [],
    artistNames: headline.includes('with')
      ? [headline.split('with').pop()?.trim() ?? '']
      : [],
    cleanTitle: headline.replace(/\s+with\s+.*$/i, '').trim(),
  })),
}));

vi.mock('./shared/logger', () => ({
  createLogger: () => mockLogger,
  logProgress: vi.fn(),
  logSummary: vi.fn(),
}));

describe('backfillOnDemandSongs', () => {
  let mockPayload: Partial<Payload>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockPayload = {
      find: vi.fn(),
      update: vi.fn(),
    };
  });

  it('prints a dry-run preview without writing any updates', async () => {
    vi.doMock('./shared/logger', () => ({
      createLogger: () => mockLogger,
      logProgress: vi.fn(),
      logSummary: vi.fn(),
    }));

    const { createConnection } = await import('mysql2/promise');
    const { getActiveOnDemand } = await import('./database');
    const { getPayloadClient } = await import('./shared/payloadClient');

    (createConnection as Mock).mockResolvedValue({
      end: vi.fn(),
    });

    (getActiveOnDemand as Mock).mockResolvedValue([
      {
        id: 524,
        date: '2026-01-23',
        image: '',
        headline: 'Trainwreck Boyfriend',
        note: '',
        songs: 'Broke / Apartment Life / Freakshow',
        audio_url: '',
        source: 'opendrive',
        deleted: 'no',
      },
      {
        id: 360,
        date: '2017-01-01',
        image: '',
        headline: 'Mike Doughty',
        note: '',
        songs: '<a href=http://www.setlist.fm/setlist/mike-doughty/2017/world-cafe-live-philadelphia-pa-43f9db8f.html" target=_blank>Click here for setlist.</a>',
        audio_url: '',
        source: 'opendrive',
        deleted: 'no',
      },
    ]);

    (getPayloadClient as Mock).mockResolvedValue(mockPayload);
    (mockPayload.find as Mock).mockImplementation(async ({ where }) => {
      if ('legacyId' in where && 'equals' in where.legacyId && where.legacyId.equals === 524) {
        return {
          docs: [
            {
              id: 1,
              headline: 'Trainwreck Boyfriend',
              artists: [{ id: 77, name: 'Trainwreck Boyfriend' }],
              artistsText: 'Trainwreck Boyfriend',
              songs: [],
            },
          ],
        };
      }

      const titleQuery = where.title?.equals ?? where.and?.[0]?.title?.equals;

      if (titleQuery === 'Broke') {
        return { docs: [{ id: 200 }] };
      }

      if (titleQuery === 'Apartment Life') {
        return { docs: [] };
      }

      if (titleQuery === 'Freakshow') {
        return { docs: [] };
      }

      return { docs: [] };
    });

    const { backfillOnDemandSongs } = await import('./backfillOnDemandSongs');
    await backfillOnDemandSongs({
      from: 'prod-mysql',
      to: 'prod-neon',
      dryRun: true,
    });

    expect(mockPayload.update).not.toHaveBeenCalled();
    expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Dry run enabled'));
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('[ready] 524 Trainwreck Boyfriend'),
    );
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('Would create 2 songs and reuse 1 existing songs.'),
    );
  });

  it('marks records with no artist candidates as warnings in dry run', async () => {
    const { createConnection } = await import('mysql2/promise');
    const { getActiveOnDemand } = await import('./database');
    const { getPayloadClient } = await import('./shared/payloadClient');

    (createConnection as Mock).mockResolvedValue({
      end: vi.fn(),
    });

    (getActiveOnDemand as Mock).mockResolvedValue([
      {
        id: 81,
        date: '2011-12-01',
        image: '',
        headline: 'Y-Not Philly 2011 Holiday Special',
        note: '',
        songs: 'Some Song / Another Song',
        audio_url: '',
        source: 'opendrive',
        deleted: 'no',
      },
    ]);

    (getPayloadClient as Mock).mockResolvedValue(mockPayload);
    (mockPayload.find as Mock).mockImplementation(async ({ collection, where }) => {
      if (collection === 'ondemand' && where.legacyId?.equals === 81) {
        return {
          docs: [
            {
              id: 81,
              headline: 'Y-Not Philly 2011 Holiday Special',
              artists: [],
              artistsText: '',
              songs: [],
            },
          ],
        };
      }

      return { docs: [] };
    });

    const { backfillOnDemandSongs } = await import('./backfillOnDemandSongs');
    await backfillOnDemandSongs({
      from: 'prod-mysql',
      to: 'prod-neon',
      dryRun: true,
    });

    expect(mockPayload.update).not.toHaveBeenCalled();
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('[warning] 81 Y-Not Philly 2011 Holiday Special'),
    );
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('Would update 0 OnDemand records.'),
    );
  });
});
