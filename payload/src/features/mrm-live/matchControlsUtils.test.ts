import { describe, it, expect, vi, afterEach } from 'vitest';
import type { LiveMatch, MrmGroupSummary } from './types';
import {
  ROUND_LABELS,
  STATUS_LABELS,
  TOURNAMENT_EDIT_BASE,
  MATCH_EDIT_BASE,
  getMatchStatus,
  getVotePercent,
  getBandName,
  getBandSeed,
  isWinner,
  getWinnerSlot,
  getTournamentId,
  getNextMatchId,
  getBandImageUrl,
  getBandId,
  formatCountdown,
  getCenterDisplay,
  getVotesUrl,
  getEventsUrl,
  getGroupUrl,
} from './matchControlsUtils';

const BAND1: MrmGroupSummary = { id: 'b1', name: 'Radiohead', seed: 1, placement: 1 };
const BAND2: MrmGroupSummary = { id: 'b2', name: 'Nirvana', seed: 2, placement: 2 };

const makeMatch = (overrides: Partial<LiveMatch> = {}): LiveMatch => ({
  id: 'match-1',
  matchNumber: 1,
  round: '1',
  band1: BAND1,
  band2: BAND2,
  band1Votes: 600,
  band2Votes: 400,
  startTime: new Date(Date.now() - 60_000).toISOString(),
  endTime: new Date(Date.now() + 60_000).toISOString(),
  winner: null,
  showScore: false,
  ...overrides,
});

describe('constants', () => {
  it('ROUND_LABELS maps round numbers to display names', () => {
    expect(ROUND_LABELS['1']).toBe('Round 1');
    expect(ROUND_LABELS['6']).toBe('Championship');
    expect(ROUND_LABELS['3']).toBe('Swell 16');
  });

  it('STATUS_LABELS maps statuses to display strings', () => {
    expect(STATUS_LABELS.live).toContain('LIVE');
    expect(STATUS_LABELS.upcoming).toContain('Upcoming');
    expect(STATUS_LABELS.overtime).toContain('Overtime');
    expect(STATUS_LABELS.closed).toContain('Closed');
  });

  it('TOURNAMENT_EDIT_BASE and MATCH_EDIT_BASE start with /admin/collections', () => {
    expect(TOURNAMENT_EDIT_BASE).toMatch(/^\/admin\/collections\//);
    expect(MATCH_EDIT_BASE).toMatch(/^\/admin\/collections\//);
  });
});

describe('getMatchStatus', () => {
  afterEach(() => vi.restoreAllMocks());

  it('returns upcoming when current time is before startTime', () => {
    const match = makeMatch({
      startTime: new Date(Date.now() + 60_000).toISOString(),
      endTime: new Date(Date.now() + 120_000).toISOString(),
    });
    expect(getMatchStatus(match)).toBe('upcoming');
  });

  it('returns live when current time is between startTime and endTime', () => {
    const match = makeMatch({
      startTime: new Date(Date.now() - 60_000).toISOString(),
      endTime: new Date(Date.now() + 60_000).toISOString(),
    });
    expect(getMatchStatus(match)).toBe('live');
  });

  it('returns overtime when past endTime with no winner', () => {
    const match = makeMatch({
      startTime: new Date(Date.now() - 120_000).toISOString(),
      endTime: new Date(Date.now() - 60_000).toISOString(),
      winner: null,
    });
    expect(getMatchStatus(match)).toBe('overtime');
  });

  it('returns closed when past endTime with a winner', () => {
    const match = makeMatch({
      startTime: new Date(Date.now() - 120_000).toISOString(),
      endTime: new Date(Date.now() - 60_000).toISOString(),
      winner: BAND1,
    });
    expect(getMatchStatus(match)).toBe('closed');
  });
});

describe('getVotePercent', () => {
  it('returns 50 when total is 0', () => {
    expect(getVotePercent(0, 0)).toBe(50);
  });

  it('calculates percentage correctly', () => {
    expect(getVotePercent(600, 1000)).toBe(60);
    expect(getVotePercent(1, 3)).toBe(33);
  });

  it('handles 100% correctly', () => {
    expect(getVotePercent(500, 500)).toBe(100);
  });
});

describe('getBandName', () => {
  it('returns (TBD) for null or undefined', () => {
    expect(getBandName(null)).toBe('(TBD)');
    expect(getBandName(undefined)).toBe('(TBD)');
  });

  it('returns the string directly when band is a string', () => {
    expect(getBandName('Radiohead')).toBe('Radiohead');
  });

  it('returns band.name when band is an object', () => {
    expect(getBandName(BAND1)).toBe('Radiohead');
  });
});

describe('getBandSeed', () => {
  it('returns null for null, undefined, or string', () => {
    expect(getBandSeed(null)).toBeNull();
    expect(getBandSeed(undefined)).toBeNull();
    expect(getBandSeed('Radiohead')).toBeNull();
  });

  it('returns the seed number for object bands', () => {
    expect(getBandSeed(BAND1)).toBe(1);
    expect(getBandSeed(BAND2)).toBe(2);
  });
});

describe('isWinner', () => {
  it('returns false when match has no winner', () => {
    const match = makeMatch({ winner: null });
    expect(isWinner(match, 'band1')).toBe(false);
  });

  it('returns false when band is null', () => {
    const match = makeMatch({ band1: null, winner: BAND1 });
    expect(isWinner(match, 'band1')).toBe(false);
  });

  it('returns false when band is a string', () => {
    const match = makeMatch({ band1: 'some-id', winner: BAND1 } as unknown as LiveMatch);
    expect(isWinner(match, 'band1')).toBe(false);
  });

  it('returns true when band id matches winner id (object winner)', () => {
    const match = makeMatch({ winner: BAND1 });
    expect(isWinner(match, 'band1')).toBe(true);
    expect(isWinner(match, 'band2')).toBe(false);
  });

  it('returns true when band id matches winner string id', () => {
    const match = makeMatch({ winner: 'b1' as unknown as MrmGroupSummary });
    expect(isWinner(match, 'band1')).toBe(true);
    expect(isWinner(match, 'band2')).toBe(false);
  });
});

describe('getWinnerSlot', () => {
  it('returns null when there is no winner', () => {
    expect(getWinnerSlot(makeMatch({ winner: null }))).toBeNull();
  });

  it('returns "1" when band1 is the winner', () => {
    expect(getWinnerSlot(makeMatch({ winner: BAND1 }))).toBe('1');
  });

  it('returns "2" when band2 is the winner', () => {
    expect(getWinnerSlot(makeMatch({ winner: BAND2 }))).toBe('2');
  });
});

describe('getTournamentId', () => {
  it('returns null when no tournament is set', () => {
    expect(getTournamentId(makeMatch())).toBeNull();
  });

  it('returns string when tournament is a string id', () => {
    const match = makeMatch({ tournament: 'tourney-123' } as LiveMatch & {
      tournament: string;
    });
    expect(getTournamentId(match)).toBe('tourney-123');
  });

  it('returns id when tournament is an object', () => {
    const match = makeMatch({ tournament: { id: 'tourney-456' } } as LiveMatch & {
      tournament: { id: string };
    });
    expect(getTournamentId(match)).toBe('tourney-456');
  });
});

describe('getNextMatchId', () => {
  it('returns null when nextMatch is null', () => {
    expect(getNextMatchId(makeMatch({ nextMatch: null }))).toBeNull();
  });

  it('returns string directly when nextMatch is a string', () => {
    expect(getNextMatchId(makeMatch({ nextMatch: 'next-match-1' as unknown as LiveMatch['nextMatch'] }))).toBe(
      'next-match-1',
    );
  });

  it('returns id when nextMatch is an object', () => {
    const match = makeMatch({ nextMatch: { id: 'next-2', matchNumber: 2 } });
    expect(getNextMatchId(match)).toBe('next-2');
  });
});

describe('getBandImageUrl', () => {
  it('returns null for null or string band', () => {
    expect(getBandImageUrl(null)).toBeNull();
    expect(getBandImageUrl('band-id')).toBeNull();
  });

  it('returns band image url when present', () => {
    const band = { ...BAND1, image: { url: 'https://example.com/img.jpg' } };
    expect(getBandImageUrl(band as unknown as LiveMatch['band1'])).toBe('https://example.com/img.jpg');
  });

  it('falls back to first artist image when band has no image', () => {
    const band = {
      ...BAND1,
      image: null,
      artists: [{ name: 'Artist 1', image: { url: 'https://example.com/artist.jpg' } }],
    };
    expect(getBandImageUrl(band as unknown as LiveMatch['band1'])).toBe('https://example.com/artist.jpg');
  });

  it('returns null when band has no image and no artists', () => {
    const band = { ...BAND1, image: null, artists: [] };
    expect(getBandImageUrl(band as unknown as LiveMatch['band1'])).toBeNull();
  });
});

describe('getBandId', () => {
  it('returns null for null or string band', () => {
    expect(getBandId(null)).toBeNull();
    expect(getBandId('band-id')).toBeNull();
  });

  it('returns string id for object band', () => {
    expect(getBandId(BAND1)).toBe('b1');
  });
});

describe('formatCountdown', () => {
  it('returns 00:00:00 for zero or negative ms', () => {
    expect(formatCountdown(0)).toBe('00:00:00');
    expect(formatCountdown(-1000)).toBe('00:00:00');
  });

  it('formats seconds correctly', () => {
    expect(formatCountdown(30_000)).toBe('00:00:30');
  });

  it('formats minutes correctly', () => {
    expect(formatCountdown(90_000)).toBe('00:01:30');
  });

  it('formats hours correctly', () => {
    expect(formatCountdown(3_661_000)).toBe('01:01:01');
  });

  it('pads single digits with zeros', () => {
    expect(formatCountdown(3_600_000 + 5_000)).toBe('01:00:05');
  });
});

describe('getCenterDisplay', () => {
  afterEach(() => vi.restoreAllMocks());

  it('returns final for closed matches', () => {
    const match = makeMatch({
      startTime: new Date(Date.now() - 120_000).toISOString(),
      endTime: new Date(Date.now() - 60_000).toISOString(),
      winner: BAND1,
    });
    const result = getCenterDisplay(match);
    expect(result.type).toBe('final');
    expect(result.text).toBe('Final');
  });

  it('returns vs for upcoming matches', () => {
    const match = makeMatch({
      startTime: new Date(Date.now() + 60_000).toISOString(),
      endTime: new Date(Date.now() + 120_000).toISOString(),
    });
    const result = getCenterDisplay(match);
    expect(result.type).toBe('vs');
    expect(result.text).toBe('VS');
  });

  it('returns OT countdown for overtime (past end, no winner)', () => {
    const match = makeMatch({
      startTime: new Date(Date.now() - 120_000).toISOString(),
      endTime: new Date(Date.now() - 60_000).toISOString(),
      winner: null,
    });
    const result = getCenterDisplay(match);
    expect(result.type).toBe('countdown');
    expect(result.text).toBe('OT');
  });

  it('returns countdown for live matches', () => {
    const match = makeMatch({
      startTime: new Date(Date.now() - 60_000).toISOString(),
      endTime: new Date(Date.now() + 3_600_000).toISOString(),
    });
    const result = getCenterDisplay(match);
    expect(result.type).toBe('countdown');
    expect(result.text).toMatch(/^\d{2}:\d{2}:\d{2}$/);
  });
});

describe('URL helpers', () => {
  it('getVotesUrl returns correct URL with match filter', () => {
    const url = getVotesUrl('match-99');
    expect(url).toContain('match-99');
    expect(url).toContain('where[match][equals]=match-99');
    expect(url).toContain('/admin/collections/');
  });

  it('getEventsUrl returns correct URL with match filter', () => {
    const url = getEventsUrl('match-42');
    expect(url).toContain('match-42');
    expect(url).toContain('where[match][equals]=match-42');
    expect(url).toContain('/admin/collections/');
  });

  it('getGroupUrl returns group admin URL', () => {
    const url = getGroupUrl('group-7');
    expect(url).toContain('group-7');
    expect(url).toContain('/admin/collections/');
  });
});
