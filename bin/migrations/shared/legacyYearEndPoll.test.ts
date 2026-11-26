import { describe, expect, it } from 'vitest';
import { legacyCategory, legacyNomineeLabel } from './legacyYearEndPoll';

const known = {
  year: 2026,
  categories: [
    {
      slug: 'songs', displayName: 'Songs of the Year', categoryType: 'songs', maxPicks: 20, requiredForContest: true,
    },
    {
      slug: 'most_anticipated_albums',
      displayName: 'Most Anticipated Albums of 2027',
      categoryType: 'custom',
      maxPicks: 2,
      requiredForContest: true,
    },
  ],
} as const;

describe('legacyNomineeLabel', () => {
  it('joins artist and title', () => {
    expect(legacyNomineeLabel({ id: 1, artist: 'Wet Leg ', title: 'CPR', votes: 4 })).toBe('Wet Leg - CPR');
  });

  it('uses whichever single column the table has', () => {
    expect(legacyNomineeLabel({ concert: 'Garbage - The Met' })).toBe('Garbage - The Met');
    expect(legacyNomineeLabel({ title: 'Severance' })).toBe('Severance');
  });
});

describe('legacyCategory', () => {
  it('takes settings from the known list', () => {
    expect(legacyCategory('songs', 2025, known)).toMatchObject({ categoryType: 'songs', maxPicks: 20 });
  });

  it('shifts years in the display name to the imported poll', () => {
    expect(legacyCategory('most_anticipated_albums', 2025, known).displayName).toBe(
      'Most Anticipated Albums of 2026',
    );
  });

  it('returns null for a table that is not a current category', () => {
    expect(legacyCategory('late_night_tv', 2025, known)).toBeNull();
  });
});
