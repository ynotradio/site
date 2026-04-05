import { describe, expect, it } from 'vitest';
import { YearEndPollVotes } from './YearEndPollVotes';
import { flattenRowFields } from './testUtils';

describe('YearEndPollVotes', () => {
  it('has the correct slug', () => {
    expect(YearEndPollVotes.slug).toBe('year-end-poll-votes');
  });

  it('is grouped under Polls & Contests', () => {
    expect(YearEndPollVotes.admin?.group).toBe('Polls & Contests');
  });

  it('has required fields', () => {
    const allFields = flattenRowFields(YearEndPollVotes.fields);
    const requiredNames = allFields.filter((f) => f.required).map((f) => f.name);
    expect(requiredNames).toContain('poll');
    expect(requiredNames).toContain('category');
    expect(requiredNames).toContain('nomineeId');
    expect(requiredNames).toContain('userId');
  });

  it('has poll as a relationship to year-end-polls', () => {
    const allFields = flattenRowFields(YearEndPollVotes.fields);
    const pollField = allFields.find((f) => f.name === 'poll');
    expect(pollField?.type).toBe('relationship');
    expect(pollField?.relationTo).toBe('year-end-polls');
    expect(pollField?.required).toBe(true);
    expect(pollField?.index).toBe(true);
  });

  it('has category as a relationship to year-end-poll-categories', () => {
    const allFields = flattenRowFields(YearEndPollVotes.fields);
    const categoryField = allFields.find((f) => f.name === 'category');
    expect(categoryField?.type).toBe('relationship');
    expect(categoryField?.relationTo).toBe('year-end-poll-categories');
    expect(categoryField?.required).toBe(true);
    expect(categoryField?.index).toBe(true);
  });

  it('has nomineeId indexed for fast lookups', () => {
    const allFields = flattenRowFields(YearEndPollVotes.fields);
    const nomineeIdField = allFields.find((f) => f.name === 'nomineeId');
    expect(nomineeIdField?.index).toBe(true);
  });

  it('has userId indexed for duplicate prevention', () => {
    const allFields = flattenRowFields(YearEndPollVotes.fields);
    const userIdField = allFields.find((f) => f.name === 'userId');
    expect(userIdField?.index).toBe(true);
  });

  it('uses Auth0 userId for duplicate prevention (not IP address)', () => {
    const allFields = flattenRowFields(YearEndPollVotes.fields);
    const names = allFields.map((f) => f.name);
    // Matches MRM Votes pattern: Auth0 sub claim stored in userId
    expect(names).toContain('userId');
    expect(names).not.toContain('ipAddress');
  });

  it('has no legacyId or migratedAt fields', () => {
    const allFields = flattenRowFields(YearEndPollVotes.fields);
    const names = allFields.map((f) => f.name);
    expect(names).not.toContain('legacyId');
    expect(names).not.toContain('migratedAt');
  });

  it('restricts read access to admin and editor roles', () => {
    const readFn = YearEndPollVotes.access?.read;
    expect(typeof readFn).toBe('function');
    expect((readFn as (args: { req: { user: null } }) => boolean)({ req: { user: null } })).toBe(
      false,
    );
  });

  it('requires authentication to create a vote (same as MRM Votes)', () => {
    const createFn = YearEndPollVotes.access?.create;
    expect(typeof createFn).toBe('function');
    // Unauthenticated users cannot vote
    expect((createFn as (args: { req: { user: null } }) => boolean)({ req: { user: null } })).toBe(
      false,
    );
    // Authenticated users can vote
    const mockUser = { id: '1', email: 'test@test.com', role: 'editor' };
    expect(
      (createFn as (args: { req: { user: typeof mockUser } }) => boolean)({
        req: { user: mockUser },
      }),
    ).toBe(true);
  });

  it('has timestamps enabled', () => {
    expect(YearEndPollVotes.timestamps).toBe(true);
  });
});
