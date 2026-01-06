/**
 * Unit tests for Schedule import script
 */

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import type { Payload } from 'payload';

// Mock modules
vi.mock('./database', () => ({
  connectToDatabase: vi.fn(),
}));

vi.mock('./shared/payloadClient', () => ({
  getPayloadClient: vi.fn(),
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

describe('importSchedule', () => {
  let mockPayload: Partial<Payload>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockPayload = {
      find: vi.fn(),
      create: vi.fn(),
    };
  });

  describe('parseArgs', () => {
    it('should parse --env dev argument', async () => {
      const { parseArgs } = await import('./importSchedule');

      process.argv = ['node', 'script.ts', '--env', 'dev'];
      const options = parseArgs();

      expect(options.env).toBe('dev');
    });

    it('should throw error for invalid --env value', async () => {
      const { parseArgs } = await import('./importSchedule');

      process.argv = ['node', 'script.ts', '--env', 'invalid'];

      expect(() => parseArgs()).toThrow('--env must be either "dev" or "prod"');
    });

    it('should parse --start-id argument', async () => {
      const { parseArgs } = await import('./importSchedule');

      process.argv = ['node', 'script.ts', '--start-id', '5000'];
      const options = parseArgs();

      expect(options.startId).toBe(5000);
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

      expect(result).toBe(false);
      expect(mockPayload.create).not.toHaveBeenCalled();
    });

    it('should import new show with DJ link', async () => {
      const { importSchedule } = await import('./importSchedule');

      // Mock: show doesn't exist, person exists, DJ exists
      (mockPayload.find as Mock)
        .mockResolvedValueOnce({ docs: [] }) // Show check
        .mockResolvedValueOnce({ docs: [{ id: 'person-id-123' }] }) // Person lookup
        .mockResolvedValueOnce({ docs: [{ id: 'dj-id-456' }] }); // DJ lookup

      (mockPayload.create as Mock).mockResolvedValue({ id: 'show-id-789' });

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

      expect(result).toBe(true);
      expect(mockPayload.create).toHaveBeenCalledWith({
        collection: 'shows',
        data: {
          date: '2024-01-15',
          startTime: '09:00:00',
          endTime: '12:00:00',
          host: 'dj-id-456',
          name: undefined,
          note: 'Morning show',
          legacyId: 1,
          migratedAt: expect.any(String),
        },
      });
    });

    it('should import show without DJ link when DJ not found', async () => {
      const { importSchedule } = await import('./importSchedule');

      // Mock: show doesn't exist, person not found
      (mockPayload.find as Mock)
        .mockResolvedValueOnce({ docs: [] }) // Show check
        .mockResolvedValueOnce({ docs: [] }); // Person lookup (not found)

      (mockPayload.create as Mock).mockResolvedValue({ id: 'show-id-789' });

      const schedule = {
        id: 1,
        date: '2024-01-15',
        day: 'Monday',
        start_time: '09:00:00',
        end_time: '12:00:00',
        host: 'Unknown DJ',
        note: '',
        deleted: 'n',
      };

      const result = await importSchedule(mockPayload as Payload, schedule);

      expect(result).toBe(true);
      expect(mockPayload.create).toHaveBeenCalledWith({
        collection: 'shows',
        data: {
          date: '2024-01-15',
          startTime: '09:00:00',
          endTime: '12:00:00',
          host: undefined,
          name: 'Unknown DJ',
          note: undefined,
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

      expect(result).toBe(true);
      expect(mockPayload.create).toHaveBeenCalledWith({
        collection: 'shows',
        data: expect.objectContaining({
          host: undefined,
          name: undefined,
        }),
      });
    });

    it('should handle empty note', async () => {
      const { importSchedule } = await import('./importSchedule');

      (mockPayload.find as Mock)
        .mockResolvedValueOnce({ docs: [] })
        .mockResolvedValueOnce({ docs: [{ id: 'person-id' }] })
        .mockResolvedValueOnce({ docs: [{ id: 'dj-id' }] });

      (mockPayload.create as Mock).mockResolvedValue({ id: 'show-id-789' });

      const schedule = {
        id: 1,
        date: '2024-01-15',
        day: 'Tuesday',
        start_time: '14:00:00',
        end_time: '17:00:00',
        host: 'Jane Smith',
        note: '',
        deleted: 'n',
      };

      const result = await importSchedule(mockPayload as Payload, schedule);

      expect(result).toBe(true);
      expect(mockPayload.create).toHaveBeenCalledWith({
        collection: 'shows',
        data: expect.objectContaining({
          note: undefined,
        }),
      });
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

      expect(result).toBe(true);
      expect(mockPayload.create).toHaveBeenCalledWith({
        collection: 'shows',
        data: expect.objectContaining({
          date: '2024-03-20',
          startTime: '18:00:00',
          endTime: '21:00:00',
        }),
      });
    });
  });
});
