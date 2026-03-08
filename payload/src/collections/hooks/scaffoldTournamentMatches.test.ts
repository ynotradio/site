import { describe, expect, it } from 'vitest';
import {
  generateBracketDefinitions,
  TOTAL_MATCHES,
} from './scaffoldTournamentMatches';

const START_DATE = '2025-03-01T00:00:00.000Z';

describe('generateBracketDefinitions', () => {
  // Generate once for all tests
  const defs = generateBracketDefinitions(START_DATE);

  it(`generates exactly ${TOTAL_MATCHES} matches`, () => {
    expect(defs).toHaveLength(TOTAL_MATCHES);
  });

  it('assigns match numbers 1 through 63', () => {
    const numbers = defs.map((d) => d.matchNumber).sort((a, b) => a - b);
    expect(numbers).toEqual(Array.from({ length: 63 }, (_, i) => i + 1));
  });

  // ── Round counts ──────────────────────────────────────────────────────
  it.each([
    ['1', 32],
    ['2', 16],
    ['3', 8],
    ['4', 4],
    ['5', 2],
    ['6', 1],
  ])('round %s has %i matches', (round, count) => {
    expect(defs.filter((d) => d.round === round)).toHaveLength(count);
  });

  // ── Region assignments ────────────────────────────────────────────────
  it('assigns regions 1-4 for rounds 1-4 and region 5 for Final 4+', () => {
    defs.forEach((d) => {
      if (['1', '2', '3', '4'].includes(d.round)) {
        expect(d.region).toBeGreaterThanOrEqual(1);
        expect(d.region).toBeLessThanOrEqual(4);
      } else {
        expect(d.region).toBe(5);
      }
    });
  });

  it('distributes round 1 evenly across 4 regions (8 per region)', () => {
    const r1 = defs.filter((d) => d.round === '1');
    for (let region = 1; region <= 4; region += 1) {
      expect(r1.filter((d) => d.region === region)).toHaveLength(8);
    }
  });

  it('distributes round 2 evenly across 4 regions (4 per region)', () => {
    const r2 = defs.filter((d) => d.round === '2');
    for (let region = 1; region <= 4; region += 1) {
      expect(r2.filter((d) => d.region === region)).toHaveLength(4);
    }
  });

  // ── nextMatchNumber wiring ────────────────────────────────────────────
  it('championship (match 63) has no nextMatchNumber', () => {
    const championship = defs.find((d) => d.matchNumber === 63);
    expect(championship?.nextMatchNumber).toBeUndefined();
  });

  it('Final 4 matches both advance to championship', () => {
    const m61 = defs.find((d) => d.matchNumber === 61);
    const m62 = defs.find((d) => d.matchNumber === 62);
    expect(m61?.nextMatchNumber).toBe(63);
    expect(m62?.nextMatchNumber).toBe(63);
  });

  it('every non-championship match has a nextMatchNumber', () => {
    defs.forEach((d) => {
      if (d.matchNumber < 63) {
        expect(d.nextMatchNumber).toBeDefined();
        expect(d.nextMatchNumber).toBeGreaterThan(d.matchNumber);
      }
    });
  });

  it('pairs of consecutive matches in a round feed the same next match', () => {
    // Round 1: matches 1,2 → same next; 3,4 → same next; etc.
    const r1 = defs.filter((d) => d.round === '1').sort((a, b) => a.matchNumber - b.matchNumber);
    for (let i = 0; i < r1.length; i += 2) {
      expect(r1[i].nextMatchNumber).toBe(r1[i + 1].nextMatchNumber);
    }
  });

  it('round 1 matches 1,2 feed into round 2 match 33', () => {
    const m1 = defs.find((d) => d.matchNumber === 1);
    const m2 = defs.find((d) => d.matchNumber === 2);
    expect(m1?.nextMatchNumber).toBe(33);
    expect(m2?.nextMatchNumber).toBe(33);
  });

  it('round 2 matches 33,34 feed into round 3 match 49', () => {
    const m33 = defs.find((d) => d.matchNumber === 33);
    const m34 = defs.find((d) => d.matchNumber === 34);
    expect(m33?.nextMatchNumber).toBe(49);
    expect(m34?.nextMatchNumber).toBe(49);
  });

  // ── Timestamps ────────────────────────────────────────────────────────
  it('round 1 matches start on the tournament start date', () => {
    const r1 = defs.filter((d) => d.round === '1');
    r1.forEach((d) => {
      expect(d.startTime).toBe(START_DATE);
    });
  });

  it('each round starts 7 days after the previous one', () => {
    const r2Start = defs.find((d) => d.round === '2')?.startTime;
    const expected = new Date(new Date(START_DATE).getTime() + 7 * 86_400_000).toISOString();
    expect(r2Start).toBe(expected);
  });

  it('end time is 24 hours after start time', () => {
    defs.forEach((d) => {
      const diff = new Date(d.endTime).getTime() - new Date(d.startTime).getTime();
      expect(diff).toBe(24 * 3_600_000);
    });
  });
});
