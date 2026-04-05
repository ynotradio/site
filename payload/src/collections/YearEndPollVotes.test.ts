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

  it('stores ipAddress for auditing', () => {
    const allFields = flattenRowFields(YearEndPollVotes.fields);
    const ipField = allFields.find((f) => f.name === 'ipAddress');
    expect(ipField).toBeDefined();
    expect(ipField?.type).toBe('text');
  });

  it('uses IP-based userId (not Auth0) — has ipAddress field unlike MRM votes', () => {
    const allFields = flattenRowFields(YearEndPollVotes.fields);
    const names = allFields.map((f) => f.name);
    // YEP stores IP address separately for auditing; MRM doesn't need this
    expect(names).toContain('ipAddress');
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

  it('allows anyone to create a vote (public IP-based voting, no auth required)', () => {
    const createFn = YearEndPollVotes.access?.create;
    expect(typeof createFn).toBe('function');
    // Public voting — unauthenticated users can submit votes
    expect((createFn as (args: { req: { user: null } }) => boolean)({ req: { user: null } })).toBe(
      true,
    );
  });

  it('has timestamps enabled', () => {
    expect(YearEndPollVotes.timestamps).toBe(true);
  });
});
