import { describe, expect, it } from 'vitest';
import { ModernRockMadnessMatchEvents } from './MadnessMatchEvents';

describe('ModernRockMadnessMatchEvents', () => {
  it('has the correct slug', () => {
    expect(ModernRockMadnessMatchEvents.slug).toBe('modern-rock-madness-match-events');
  });

  it('is grouped under Modern Rock Madness', () => {
    expect(ModernRockMadnessMatchEvents.admin?.group).toBe('Modern Rock Madness');
  });

  it('has required fields', () => {
    const fields = ModernRockMadnessMatchEvents.fields as Array<{
      name: string;
      required?: boolean;
    }>;
    const requiredNames = fields.filter((f) => f.required).map((f) => f.name);
    expect(requiredNames).toContain('match');
    expect(requiredNames).toContain('eventType');
  });

  it('has match as a relationship to modern-rock-madness-matches', () => {
    const fields = ModernRockMadnessMatchEvents.fields as Array<{
      name: string;
      type: string;
      relationTo?: string;
    }>;
    const matchField = fields.find((f) => f.name === 'match');
    expect(matchField?.type).toBe('relationship');
    expect(matchField?.relationTo).toBe('modern-rock-madness-matches');
  });

  it('has 4 event type options', () => {
    const fields = ModernRockMadnessMatchEvents.fields as Array<{
      name: string;
      options?: Array<{ value: string }>;
    }>;
    const eventTypeField = fields.find((f) => f.name === 'eventType');
    expect(eventTypeField?.options).toHaveLength(4);
    const values = eventTypeField?.options?.map((o) => o.value);
    expect(values).toContain('overtime_extended');
    expect(values).toContain('rematch');
    expect(values).toContain('admin_vote');
    expect(values).toContain('match_closed');
  });

  it('has snapshot as a JSON field', () => {
    const fields = ModernRockMadnessMatchEvents.fields as Array<{ name: string; type: string }>;
    const snapshotField = fields.find((f) => f.name === 'snapshot');
    expect(snapshotField?.type).toBe('json');
  });

  it('is append-only (no update or delete)', () => {
    const updateFn = ModernRockMadnessMatchEvents.access?.update;
    const deleteFn = ModernRockMadnessMatchEvents.access?.delete;
    expect(typeof updateFn).toBe('function');
    expect(typeof deleteFn).toBe('function');
    expect((updateFn as () => boolean)()).toBe(false);
    expect((deleteFn as () => boolean)()).toBe(false);
  });

  it('restricts read access to admin and editor roles', () => {
    const readFn = ModernRockMadnessMatchEvents.access?.read;
    expect(typeof readFn).toBe('function');
    expect(
      (readFn as (args: { req: { user: null } }) => boolean)({ req: { user: null } }),
    ).toBe(false);
  });

  it('has timestamps enabled', () => {
    expect(ModernRockMadnessMatchEvents.timestamps).toBe(true);
  });
});
