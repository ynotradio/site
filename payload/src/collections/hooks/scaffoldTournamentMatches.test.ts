import { describe, expect, it } from 'vitest';
import {
  generateBracketDefinitions,
  buildScheduleSlots,
  STANDARD_SLOTS,
  TOTAL_MATCHES,
} from './scaffoldTournamentMatches';

const START_DATE = '2025-03-24T00:00:00.000Z'; // Monday

describe('buildScheduleSlots', () => {
  const slots = buildScheduleSlots();

  it(`produces exactly ${TOTAL_MATCHES} slots`, () => {
    expect(slots).toHaveLength(TOTAL_MATCHES);
  });

  it('covers match numbers 1 through 63', () => {
    const numbers = slots.map((s) => s.matchNumber).sort((a, b) => a - b);
    expect(numbers).toEqual(Array.from({ length: 63 }, (_, i) => i + 1));
  });

  it('uses 30 min duration for rounds 1-4 (matches 1-60)', () => {
    slots.filter((s) => s.matchNumber <= 60).forEach((s) => {
      expect(s.durationMinutes).toBe(30);
    });
  });

  it('uses 60 min duration for Final 4 (matches 61-62)', () => {
    [61, 62].forEach((n) => {
      expect(slots.find((s) => s.matchNumber === n)?.durationMinutes).toBe(60);
    });
  });

  it('uses 120 min duration for Championship (match 63)', () => {
    expect(slots.find((s) => s.matchNumber === 63)?.durationMinutes).toBe(120);
  });
});

describe('generateBracketDefinitions', () => {
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

  // ── Schedule: day layout ──────────────────────────────────────────────
  it('round 1 region 1 (matches 1-8) plays on tournament start day', () => {
    const region1 = defs.filter((d) => d.matchNumber >= 1 && d.matchNumber <= 8);
    region1.forEach((d) => {
      expect(new Date(d.startTime).getUTCDate()).toBe(24); // Mar 24
    });
  });

  it('round 1 spans 4 consecutive days (one region per day)', () => {
    const r1Days = new Set(
      defs
        .filter((d) => d.round === '1')
        .map((d) => new Date(d.startTime).toISOString().slice(0, 10)),
    );
    expect(r1Days.size).toBe(4);
    expect(r1Days).toContain('2025-03-24');
    expect(r1Days).toContain('2025-03-25');
    expect(r1Days).toContain('2025-03-26');
    expect(r1Days).toContain('2025-03-27');
  });

  it('round 2 starts on day+6 (following Monday)', () => {
    const m33 = defs.find((d) => d.matchNumber === 33)!;
    expect(new Date(m33.startTime).toISOString().slice(0, 10)).toBe('2025-03-30');
  });

  it('championship is on day+10', () => {
    const m63 = defs.find((d) => d.matchNumber === 63)!;
    expect(new Date(m63.startTime).toISOString().slice(0, 10)).toBe('2025-04-03');
  });

  // ── Schedule: time slots ──────────────────────────────────────────────
  it('standard day matches use morning/afternoon blocks', () => {
    // Match 1 should start at 10:00, match 5 at 13:00
    const m1 = defs.find((d) => d.matchNumber === 1)!;
    const m5 = defs.find((d) => d.matchNumber === 5)!;
    expect(new Date(m1.startTime).getUTCHours()).toBe(10);
    expect(new Date(m1.startTime).getUTCMinutes()).toBe(0);
    expect(new Date(m5.startTime).getUTCHours()).toBe(13);
    expect(new Date(m5.startTime).getUTCMinutes()).toBe(0);
  });

  // ── Schedule: match durations ─────────────────────────────────────────
  it('rounds 1-4 matches are 30 minutes long', () => {
    defs.filter((d) => ['1', '2', '3', '4'].includes(d.round)).forEach((d) => {
      const diff = new Date(d.endTime).getTime() - new Date(d.startTime).getTime();
      expect(diff).toBe(30 * 60_000);
    });
  });

  it('Final 4 matches are 60 minutes long', () => {
    defs.filter((d) => d.round === '5').forEach((d) => {
      const diff = new Date(d.endTime).getTime() - new Date(d.startTime).getTime();
      expect(diff).toBe(60 * 60_000);
    });
  });

  it('Championship match is 120 minutes long', () => {
    const m63 = defs.find((d) => d.matchNumber === 63)!;
    const diff = new Date(m63.endTime).getTime() - new Date(m63.startTime).getTime();
    expect(diff).toBe(120 * 60_000);
  });

  // ── Schedule: no overlaps ─────────────────────────────────────────────
  it('no two matches have overlapping time slots', () => {
    const sorted = [...defs].sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    );
    for (let i = 1; i < sorted.length; i += 1) {
      const prev = sorted[i - 1];
      const curr = sorted[i];
      expect(new Date(curr.startTime).getTime()).toBeGreaterThanOrEqual(
        new Date(prev.endTime).getTime(),
      );
    }
  });

  // ── Schedule: 8-slot daily pattern ────────────────────────────────────
  it('has 8 standard time slots per full day', () => {
    expect(STANDARD_SLOTS).toHaveLength(8);
    expect(STANDARD_SLOTS[0]).toEqual({ hour: 10, minute: 0 });
    expect(STANDARD_SLOTS[7]).toEqual({ hour: 14, minute: 30 });
  });
});
