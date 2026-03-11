import { describe, it, expect } from 'vitest';
import {
  inferRegion,
  organizeForBracket,
  getBandAbbr,
  getBandSeed,
  getVotePcts,
  getCellStatus,
  getWinnerSlot,
} from './bracketUtils';
import type { BracketMatch } from './types';

const makeMatch = (
  matchNumber: number,
  round: string,
  region: number,
  overrides: Partial<BracketMatch> = {},
): BracketMatch => ({
  id: `m${matchNumber}`,
  matchNumber,
  round,
  region,
  band1Votes: 0,
  band2Votes: 0,
  startTime: new Date(Date.now() + 60_000).toISOString(),
  endTime: new Date(Date.now() + 120_000).toISOString(),
  winner: null,
  band1: { id: 'b1', name: 'Radiohead', abbreviation: 'Rdhead', seed: 1, placement: 1 },
  band2: { id: 'b2', name: 'Nirvana', abbreviation: 'Nirvna', seed: 16, placement: 16 },
  ...overrides,
});

describe('inferRegion', () => {
  it('maps R1 matches 1-8 to region 1', () => {
    expect(inferRegion(1)).toBe(1);
    expect(inferRegion(8)).toBe(1);
  });

  it('maps R1 matches 9-16 to region 2', () => {
    expect(inferRegion(9)).toBe(2);
    expect(inferRegion(16)).toBe(2);
  });

  it('maps R1 matches 17-24 to region 3', () => {
    expect(inferRegion(17)).toBe(3);
    expect(inferRegion(24)).toBe(3);
  });

  it('maps R1 matches 25-32 to region 4', () => {
    expect(inferRegion(25)).toBe(4);
    expect(inferRegion(32)).toBe(4);
  });

  it('maps R2 matches to correct regions', () => {
    expect(inferRegion(33)).toBe(1);
    expect(inferRegion(37)).toBe(2);
    expect(inferRegion(41)).toBe(3);
    expect(inferRegion(45)).toBe(4);
  });

  it('maps R3 (Sweet 16) to correct regions', () => {
    expect(inferRegion(49)).toBe(1);
    expect(inferRegion(51)).toBe(2);
    expect(inferRegion(53)).toBe(3);
    expect(inferRegion(55)).toBe(4);
  });

  it('maps R4 (Elusive 8) to correct regions', () => {
    expect(inferRegion(57)).toBe(1);
    expect(inferRegion(58)).toBe(2);
    expect(inferRegion(59)).toBe(3);
    expect(inferRegion(60)).toBe(4);
  });

  it('maps championship matches to region 5', () => {
    expect(inferRegion(61)).toBe(5);
    expect(inferRegion(62)).toBe(5);
    expect(inferRegion(63)).toBe(5);
  });
});

describe('organizeForBracket', () => {
  it('places matches into correct regions and rounds', () => {
    const matches = [
      makeMatch(1, '1', 1),
      makeMatch(9, '1', 2),
      makeMatch(33, '2', 1),
      makeMatch(63, '6', 5),
    ];
    const layout = organizeForBracket(matches);
    expect(layout.regions[1].round1).toHaveLength(1);
    expect(layout.regions[2].round1).toHaveLength(1);
    expect(layout.regions[1].round2).toHaveLength(1);
    expect(layout.final?.matchNumber).toBe(63);
  });

  it('identifies semi-final matches', () => {
    const matches = [makeMatch(61, '5', 5), makeMatch(62, '5', 5), makeMatch(63, '6', 5)];
    const layout = organizeForBracket(matches);
    expect(layout.semiLeft?.matchNumber).toBe(61);
    expect(layout.semiRight?.matchNumber).toBe(62);
    expect(layout.final?.matchNumber).toBe(63);
  });

  it('sorts matches within each round by matchNumber', () => {
    const matches = [
      makeMatch(4, '1', 1),
      makeMatch(2, '1', 1),
      makeMatch(1, '1', 1),
      makeMatch(3, '1', 1),
    ];
    const layout = organizeForBracket(matches);
    const nums = layout.regions[1].round1.map((m) => m.matchNumber);
    expect(nums).toEqual([1, 2, 3, 4]);
  });

  it('handles matches without region field by inferring', () => {
    const matches = [{ ...makeMatch(17, '1', 3), region: undefined }];
    const layout = organizeForBracket(matches);
    expect(layout.regions[3].round1).toHaveLength(1);
  });
});

describe('getBandAbbr', () => {
  it('returns abbreviation when available', () => {
    expect(
      getBandAbbr({ id: '1', name: 'Radiohead', abbreviation: 'Rdhead', seed: 1, placement: 1 }),
    ).toBe('Rdhead');
  });

  it('falls back to name when no abbreviation', () => {
    expect(getBandAbbr({ id: '1', name: 'Radiohead', seed: 1, placement: 1 })).toBe('Radiohead');
  });

  it('returns TBD for null/undefined', () => {
    expect(getBandAbbr(null)).toBe('TBD');
    expect(getBandAbbr(undefined)).toBe('TBD');
  });
});

describe('getBandSeed', () => {
  it('returns seed as string', () => {
    expect(getBandSeed({ id: '1', name: 'Radiohead', seed: 3, placement: 3 })).toBe('3');
  });

  it('returns empty string for null', () => {
    expect(getBandSeed(null)).toBe('');
  });
});

describe('getVotePcts', () => {
  it('returns null when no votes', () => {
    expect(getVotePcts(makeMatch(1, '1', 1))).toBeNull();
  });

  it('calculates percentages correctly', () => {
    const m = makeMatch(1, '1', 1, { band1Votes: 75, band2Votes: 25 });
    expect(getVotePcts(m)).toEqual({ b1: '75%', b2: '25%' });
  });
});

describe('getCellStatus', () => {
  it('returns closed when winner exists', () => {
    const m = makeMatch(1, '1', 1, {
      winner: { id: 'b1', name: 'Radiohead', seed: 1, placement: 1 },
    });
    expect(getCellStatus(m)).toBe('closed');
  });

  it('returns upcoming for future matches', () => {
    const m = makeMatch(1, '1', 1);
    expect(getCellStatus(m)).toBe('upcoming');
  });

  it('returns live for current matches', () => {
    const m = makeMatch(1, '1', 1, {
      startTime: new Date(Date.now() - 60_000).toISOString(),
      endTime: new Date(Date.now() + 60_000).toISOString(),
    });
    expect(getCellStatus(m)).toBe('live');
  });
});

describe('getWinnerSlot', () => {
  it('returns null when no winner', () => {
    expect(getWinnerSlot(makeMatch(1, '1', 1))).toBeNull();
  });

  it('returns 1 when band1 wins', () => {
    const m = makeMatch(1, '1', 1, {
      winner: { id: 'b1', name: 'Radiohead', seed: 1, placement: 1 },
    });
    expect(getWinnerSlot(m)).toBe('1');
  });

  it('returns 2 when band2 wins', () => {
    const m = makeMatch(1, '1', 1, {
      winner: { id: 'b2', name: 'Nirvana', seed: 16, placement: 16 },
    });
    expect(getWinnerSlot(m)).toBe('2');
  });
});
