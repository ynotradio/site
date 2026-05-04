import { describe, it, expect } from 'vitest';
import { normalizeShowDate } from './showDateHooks';

const makeArgs = (data: Record<string, unknown>) => ({ data } as Parameters<typeof normalizeShowDate>[0]);

describe('normalizeShowDate', () => {
  describe('when data.date is present', () => {
    it('normalizes a string date to noon UTC', async () => {
      const result = await normalizeShowDate(makeArgs({ date: '2024-03-15T08:30:00.000Z' }));
      expect(result).toHaveProperty('date');
      const normalized = new Date((result as { date: string }).date);
      expect(normalized.getUTCHours()).toBe(12);
      expect(normalized.getUTCMinutes()).toBe(0);
      expect(normalized.getUTCSeconds()).toBe(0);
      expect(normalized.getUTCMilliseconds()).toBe(0);
    });

    it('normalizes a Date object to noon UTC', async () => {
      const input = new Date('2024-06-20T23:00:00.000Z');
      const result = await normalizeShowDate(makeArgs({ date: input }));
      const normalized = new Date((result as { date: string }).date);
      expect(normalized.getUTCHours()).toBe(12);
      expect(normalized.getUTCMinutes()).toBe(0);
      expect(normalized.getUTCSeconds()).toBe(0);
    });

    it('preserves the calendar date when normalizing', async () => {
      const result = await normalizeShowDate(makeArgs({ date: '2024-11-07T02:00:00.000Z' }));
      const normalized = new Date((result as { date: string }).date);
      expect(normalized.getUTCFullYear()).toBe(2024);
      expect(normalized.getUTCMonth()).toBe(10); // November (0-indexed)
      expect(normalized.getUTCDate()).toBe(7);
    });

    it('preserves other fields in the data object', async () => {
      const result = await normalizeShowDate(
        makeArgs({ date: '2024-03-15', name: 'My Show', djId: 42 }),
      );
      expect(result).toMatchObject({ name: 'My Show', djId: 42 });
    });

    it('returns an ISO string for the date', async () => {
      const result = await normalizeShowDate(makeArgs({ date: '2024-03-15' }));
      expect(typeof (result as { date: string }).date).toBe('string');
      expect((result as { date: string }).date).toMatch(/^\d{4}-\d{2}-\d{2}T12:00:00\.000Z$/);
    });

    it('normalizes a date that is already at noon UTC unchanged', async () => {
      const result = await normalizeShowDate(makeArgs({ date: '2024-05-01T12:00:00.000Z' }));
      expect((result as { date: string }).date).toBe('2024-05-01T12:00:00.000Z');
    });
  });

  describe('when data.date is absent', () => {
    it('returns data unchanged when date field is missing', async () => {
      const data = { name: 'No Date Show' };
      const result = await normalizeShowDate(makeArgs(data));
      expect(result).toEqual(data);
    });

    it('returns data unchanged when date is null', async () => {
      const data = { date: null, name: 'Null Date Show' };
      const result = await normalizeShowDate(makeArgs(data));
      expect(result).toEqual(data);
    });

    it('returns data unchanged when date is an empty string', async () => {
      const data = { date: '', name: 'Empty Date Show' };
      const result = await normalizeShowDate(makeArgs(data));
      expect(result).toEqual(data);
    });
  });
});
