/**
 * Unit tests for Schedule import script
 */

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import type { Payload } from 'payload';
import { findDJByDisplayName } from './shared/payloadClient';

// Mock modules
vi.mock('./database', () => ({
  connectToDatabase: vi.fn(),
}));

vi.mock('./shared/payloadClient', () => ({
  getPayloadClient: vi.fn(),
  findDJByDisplayName: vi.fn(),
}));

vi.mock('./shared/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
  logProgress: vi.fn(),
  logSummary: vi.fn(),
}));

const mockFindDJByDisplayName = findDJByDisplayName as Mock;

describe('importSchedule', () => {
  let mockPayload: Partial<Payload>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockPayload = {
      find: vi.fn(),
      create: vi.fn(),
    };

    // Reset the mock
    mockFindDJByDisplayName.mockReset();
  });

  describe('parseArgs', () => {
    it('should default to prod-neon target', async () => {
      const { parseArgs } = await import('./importSchedule');

      process.argv = ['node', 'script.ts'];
      const options = parseArgs();

      expect(options.to).toBe('prod-neon');
    });

    it('should parse --to prod-neon argument', async () => {
      const { parseArgs } = await import('./importSchedule');

      process.argv = ['node', 'script.ts', '--to', 'prod-neon'];
      const options = parseArgs();

      expect(options.to).toBe('prod-neon');
    });

    it('should parse --to local-postgres argument', async () => {
      const { parseArgs } = await import('./importSchedule');

      process.argv = ['node', 'script.ts', '--to', 'local-postgres'];
      const options = parseArgs();

      expect(options.to).toBe('local-postgres');
    });

    it('should throw error for invalid --to value', async () => {
      const { parseArgs } = await import('./importSchedule');

      process.argv = ['node', 'script.ts', '--to', 'invalid'];

      expect(() => parseArgs()).toThrow('--to must be "prod-neon" or "local-postgres"');
    });

    it('should parse --start-id argument', async () => {
      const { parseArgs } = await import('./importSchedule');

      process.argv = ['node', 'script.ts', '--start-id', '5000'];
      const options = parseArgs();

      expect(options.startId).toBe(5000);
    });
  });

  describe('parseHostString', () => {
    it('should extract show name and DJ name from "w/" pattern', async () => {
      const { parseHostString } = await import('./importSchedule');

      const result = parseHostString('<i>Transmission</i> w/ Rob Huff');

      expect(result).toEqual({
        showName: 'Transmission',
        djName: 'Rob Huff',
      });
    });

    it('should extract show name and DJ name from "with" pattern', async () => {
      const { parseHostString } = await import('./importSchedule');

      const result = parseHostString('<i>Morning Show</i> with John Smith');

      expect(result).toEqual({
        showName: 'Morning Show',
        djName: 'John Smith',
      });
    });

    it('should return show name only when formatted but no DJ pattern', async () => {
      const { parseHostString } = await import('./importSchedule');

      const result = parseHostString('<i>Y-Not on Shuffle</i>');

      expect(result).toEqual({
        showName: 'Y-Not on Shuffle',
        djName: undefined,
      });
    });

    it('should return DJ name only when no formatting and no pattern', async () => {
      const { parseHostString } = await import('./importSchedule');

      const result = parseHostString('John Q.');

      expect(result).toEqual({
        showName: undefined,
        djName: 'John Q.',
      });
    });

    it('should handle bold formatting', async () => {
      const { parseHostString } = await import('./importSchedule');

      const result = parseHostString('<b>Teen Jesus & The Jean Teasers</b>');

      expect(result).toEqual({
        showName: 'Teen Jesus & The Jean Teasers',
        djName: undefined,
      });
    });
  });

  describe('importSchedule', () => {
    it('should skip already imported show', async () => {
      const { importSchedule } = await import('./importSchedule');

      (mockPayload.find as Mock).mockResolvedValue({
        docs: [{ id: 'existing-show' }],
      });

      const schedule = {
        id: 1,
        date: '2024-01-15',
        day: 'Monday',
        start_time: '09:00:00',
        end_time: '12:00:00',
        host: 'John Doe',
        note: 'Morning show',
        deleted: 'n',
      };

      const result = await importSchedule(mockPayload as Payload, schedule);

      expect(result).toBe('skipped');
      expect(mockPayload.create).not.toHaveBeenCalled();
    });

    it('should import new show with DJ link when DJ found by display name', async () => {
      const { importSchedule } = await import('./importSchedule');

      // Mock: show doesn't exist
      (mockPayload.find as Mock).mockResolvedValueOnce({ docs: [] }); // Show check

      // Mock: DJ found by display name
      mockFindDJByDisplayName.mockResolvedValueOnce(456);

      (mockPayload.create as Mock).mockResolvedValue({ id: 'show-id-789' });

      const schedule = {
        id: 1,
        date: '2024-01-15',
        day: 'Monday',
        start_time: '09:00:00',
        end_time: '12:00:00',
        host: '<i>Transmission</i> w/ Rob Huff',
        note: 'Morning show',
        deleted: 'n',
      };

      const result = await importSchedule(mockPayload as Payload, schedule);

      expect(result).toBe('imported');
      expect(mockFindDJByDisplayName).toHaveBeenCalledWith(mockPayload, 'Rob Huff');
      expect(mockPayload.create).toHaveBeenCalledWith({
        collection: 'shows',
        data: {
          date: '2024-01-15',
          startTime: '09:00:00',
          endTime: '12:00:00',
          host: 456,
          name: 'Transmission',
          note: {
            root: {
              type: 'root',
              format: '',
              indent: 0,
              version: 1,
              children: [
                {
                  type: 'paragraph',
                  format: '',
                  indent: 0,
                  version: 1,
                  children: [
                    {
                      detail: 0,
                      format: 0,
                      mode: 'normal',
                      style: '',
                      text: 'Morning show',
                      type: 'text',
                      version: 1,
                    },
                  ],
                  direction: 'ltr',
                },
              ],
              direction: 'ltr',
            },
          },
          legacyId: 1,
          migratedAt: expect.any(String),
        },
      });
    });

    it('should import show with DJ name in show name when DJ not found', async () => {
      const { importSchedule } = await import('./importSchedule');

      // Mock: show doesn't exist
      (mockPayload.find as Mock).mockResolvedValueOnce({ docs: [] }); // Show check

      // Mock: DJ not found
      mockFindDJByDisplayName.mockResolvedValueOnce(null);

      (mockPayload.create as Mock).mockResolvedValue({ id: 'show-id-789' });

      const schedule = {
        id: 1,
        date: '2024-01-15',
        day: 'Monday',
        start_time: '09:00:00',
        end_time: '12:00:00',
        host: '<i>Test Show</i> w/ Unknown DJ',
        note: '',
        deleted: 'n',
      };

      const result = await importSchedule(mockPayload as Payload, schedule);

      expect(result).toBe('imported');
      expect(mockFindDJByDisplayName).toHaveBeenCalledWith(mockPayload, 'Unknown DJ');
      expect(mockPayload.create).toHaveBeenCalledWith({
        collection: 'shows',
        data: {
          date: '2024-01-15',
          startTime: '09:00:00',
          endTime: '12:00:00',
          name: 'Test Show w/ Unknown DJ',
          legacyId: 1,
          migratedAt: expect.any(String),
        },
      });
    });

    it('should handle empty host', async () => {
      const { importSchedule } = await import('./importSchedule');

      (mockPayload.find as Mock).mockResolvedValue({ docs: [] });
      (mockPayload.create as Mock).mockResolvedValue({ id: 'show-id-789' });

      const schedule = {
        id: 1,
        date: '2024-01-15',
        day: 'Sunday',
        start_time: '00:00:00',
        end_time: '00:00:00',
        host: '',
        note: 'Automated playlist',
        deleted: 'n',
      };

      const result = await importSchedule(mockPayload as Payload, schedule);

      expect(result).toBe('imported');
      expect(mockPayload.create).toHaveBeenCalledWith({
        collection: 'shows',
        data: expect.objectContaining({
          name: undefined,
        }),
      });
    });

    it('should handle empty note', async () => {
      const { importSchedule } = await import('./importSchedule');

      (mockPayload.find as Mock).mockResolvedValueOnce({ docs: [] }); // Show check

      // Mock: DJ found
      mockFindDJByDisplayName.mockResolvedValueOnce(123);

      (mockPayload.create as Mock).mockResolvedValue({ id: 'show-id-789' });

      const schedule = {
        id: 1,
        date: '2024-01-15',
        day: 'Tuesday',
        start_time: '14:00:00',
        end_time: '17:00:00',
        host: '<i>Afternoon Show</i> w/ Jane Smith',
        note: '',
        deleted: 'n',
      };

      const result = await importSchedule(mockPayload as Payload, schedule);

      expect(result).toBe('imported');
      const createCall1 = (mockPayload.create as Mock).mock.calls[0][0];
      expect(createCall1.data).not.toHaveProperty('note');
    });

    it('should preserve all time fields', async () => {
      const { importSchedule } = await import('./importSchedule');

      (mockPayload.find as Mock).mockResolvedValue({ docs: [] });
      (mockPayload.create as Mock).mockResolvedValue({ id: 'show-id-789' });

      const schedule = {
        id: 1,
        date: '2024-03-20',
        day: 'Wednesday',
        start_time: '18:00:00',
        end_time: '21:00:00',
        host: '',
        note: '',
        deleted: 'n',
      };

      const result = await importSchedule(mockPayload as Payload, schedule);

      expect(result).toBe('imported');
      expect(mockPayload.create).toHaveBeenCalledWith({
        collection: 'shows',
        data: expect.objectContaining({
          date: '2024-03-20',
          startTime: '18:00:00',
          endTime: '21:00:00',
        }),
      });
    });

    it('should convert note field to Lexical format', async () => {
      const { importSchedule } = await import('./importSchedule');

      (mockPayload.find as Mock).mockResolvedValueOnce({ docs: [] }); // showExists

      // Mock: DJ found
      mockFindDJByDisplayName.mockResolvedValueOnce(123);

      (mockPayload.create as Mock).mockResolvedValue({ id: 'show-id-123' });

      const schedule = {
        id: 1,
        date: '2024-01-15',
        day: 'Monday',
        start_time: '10:00:00',
        end_time: '14:00:00',
        host: '<i>Test Show</i> w/ Test Host',
        note: 'Win Dinosaur Jr. Tickets',
        deleted: 'n',
      };

      const result = await importSchedule(mockPayload as Payload, schedule);

      expect(result).toBe('imported');
      expect(mockPayload.create).toHaveBeenCalledWith({
        collection: 'shows',
        data: expect.objectContaining({
          note: {
            root: {
              type: 'root',
              format: '',
              indent: 0,
              version: 1,
              children: [
                {
                  type: 'paragraph',
                  format: '',
                  indent: 0,
                  version: 1,
                  children: [
                    {
                      detail: 0,
                      format: 0,
                      mode: 'normal',
                      style: '',
                      text: 'Win Dinosaur Jr. Tickets',
                      type: 'text',
                      version: 1,
                    },
                  ],
                  direction: 'ltr',
                },
              ],
              direction: 'ltr',
            },
          },
        }),
      });
    });

    it('should handle empty note field', async () => {
      const { importSchedule } = await import('./importSchedule');

      (mockPayload.find as Mock).mockResolvedValueOnce({ docs: [] }); // showExists

      // Mock: DJ found
      mockFindDJByDisplayName.mockResolvedValueOnce(123);

      (mockPayload.create as Mock).mockResolvedValue({ id: 'show-id-123' });

      const schedule = {
        id: 1,
        date: '2024-01-15',
        day: 'Monday',
        start_time: '10:00:00',
        end_time: '14:00:00',
        host: '<i>Test Show</i> w/ Test Host',
        note: '',
        deleted: 'n',
      };

      const result = await importSchedule(mockPayload as Payload, schedule);

      expect(result).toBe('imported');
      const createCall2 = (mockPayload.create as Mock).mock.calls[0][0];
      expect(createCall2.data).not.toHaveProperty('note');
    });

    it('should use show name only when no DJ pattern found and has HTML formatting', async () => {
      const { importSchedule } = await import('./importSchedule');

      (mockPayload.find as Mock).mockResolvedValueOnce({ docs: [] }); // showExists
      (mockPayload.create as Mock).mockResolvedValue({ id: 'show-id-123' });

      const schedule = {
        id: 1,
        date: '2024-01-15',
        day: 'Monday',
        start_time: '10:00:00',
        end_time: '14:00:00',
        host: '<i>Y-Not on Shuffle</i>',
        note: '',
        deleted: 'n',
      };

      const result = await importSchedule(mockPayload as Payload, schedule);

      expect(result).toBe('imported');
      expect(mockFindDJByDisplayName).not.toHaveBeenCalled();
      expect(mockPayload.create).toHaveBeenCalledWith({
        collection: 'shows',
        data: expect.objectContaining({
          name: 'Y-Not on Shuffle',
        }),
      });
      const createCall3 = (mockPayload.create as Mock).mock.calls[0][0];
      expect(createCall3.data).not.toHaveProperty('host');
    });

    it('should try to find DJ when host has no HTML formatting', async () => {
      const { importSchedule } = await import('./importSchedule');

      (mockPayload.find as Mock).mockResolvedValueOnce({ docs: [] }); // showExists

      // Mock: DJ found
      mockFindDJByDisplayName.mockResolvedValueOnce(456);

      (mockPayload.create as Mock).mockResolvedValue({ id: 'show-id-123' });

      const schedule = {
        id: 1,
        date: '2024-01-15',
        day: 'Monday',
        start_time: '10:00:00',
        end_time: '14:00:00',
        host: 'John Q.',
        note: '',
        deleted: 'n',
      };

      const result = await importSchedule(mockPayload as Payload, schedule);

      expect(result).toBe('imported');
      expect(mockFindDJByDisplayName).toHaveBeenCalledWith(mockPayload, 'John Q.');
      expect(mockPayload.create).toHaveBeenCalledWith({
        collection: 'shows',
        data: expect.objectContaining({
          name: undefined,
          host: 456,
        }),
      });
    });
  });
});
