import { describe, expect, it, vi } from 'vitest';
import {
  generateBracketDefinitions,
  buildScheduleSlots,
  STANDARD_SLOTS,
  TOTAL_MATCHES,
  scaffoldTournamentMatches,
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
    slots
      .filter((s) => s.matchNumber <= 60)
      .forEach((s) => {
        expect(s.durationMinutes).toBe(30);
      });
  });

  it('uses 60 min duration for Fantastic 4 (matches 61-62)', () => {
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
  it('assigns regions 1-4 for rounds 1-4 and region 5 for Fantastic 4+', () => {
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

  it('Fantastic 4 matches both advance to championship', () => {
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
    defs
      .filter((d) => ['1', '2', '3', '4'].includes(d.round))
      .forEach((d) => {
        const diff = new Date(d.endTime).getTime() - new Date(d.startTime).getTime();
        expect(diff).toBe(30 * 60_000);
      });
  });

  it('Fantastic 4 matches are 60 minutes long', () => {
    defs
      .filter((d) => d.round === '5')
      .forEach((d) => {
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

// ---------------------------------------------------------------------------
// scaffoldTournamentMatches hook
// ---------------------------------------------------------------------------

const makeReq = (createFn: ReturnType<typeof vi.fn>) => ({
  payload: {
    create: createFn,
    logger: {
      info: vi.fn(),
      error: vi.fn(),
    },
  },
});

describe('scaffoldTournamentMatches hook', () => {
  it('returns doc unchanged for non-create operations', async () => {
    const doc = { id: 1, name: 'Test', startDate: '2025-03-24' };
    const req = makeReq(vi.fn());

    const result = await scaffoldTournamentMatches({
      doc,
      operation: 'update',
      req: req as any,
      collection: {} as any,
      context: {} as any,
      previousDoc: doc,
    });

    expect(result).toBe(doc);
    expect(req.payload.create).not.toHaveBeenCalled();
  });

  it('creates all 63 matches for a new tournament', async () => {
    const doc = { id: 42, name: 'MRM 2025', startDate: '2025-03-24T00:00:00.000Z' };
    let idCounter = 100;
    // eslint-disable-next-line no-plusplus
    const createFn = vi.fn().mockImplementation(() => Promise.resolve({ id: idCounter++ }));
    const req = makeReq(createFn);

    const result = await scaffoldTournamentMatches({
      doc,
      operation: 'create',
      req: req as any,
      collection: {} as any,
      context: {} as any,
      previousDoc: undefined as any,
    });

    expect(result).toBe(doc);
    expect(createFn).toHaveBeenCalledTimes(TOTAL_MATCHES);
    expect(req.payload.logger.info).toHaveBeenCalledWith(
      expect.stringContaining(`${TOTAL_MATCHES}/${TOTAL_MATCHES}`),
    );
  });

  it('creates matches in reverse order (championship first)', async () => {
    const doc = { id: 7, name: 'MRM 2025', startDate: '2025-03-24T00:00:00.000Z' };
    const createdMatchNumbers: number[] = [];
    let idCounter = 200;
    const createFn = vi.fn().mockImplementation(({ data }: { data: { matchNumber: number } }) => {
      createdMatchNumbers.push(data.matchNumber);
      // eslint-disable-next-line no-plusplus
      return Promise.resolve({ id: idCounter++ });
    });
    const req = makeReq(createFn);

    await scaffoldTournamentMatches({
      doc,
      operation: 'create',
      req: req as any,
      collection: {} as any,
      context: {} as any,
      previousDoc: undefined as any,
    });

    expect(createdMatchNumbers[0]).toBe(63); // championship first
    expect(createdMatchNumbers[createdMatchNumbers.length - 1]).toBe(1); // first match last
  });

  it('wires nextMatch id for non-championship matches', async () => {
    const doc = { id: 5, name: 'MRM 2025', startDate: '2025-03-24T00:00:00.000Z' };
    let idCounter = 300;
    const callDataByMatchNumber = new Map<number, Record<string, unknown>>();
    const createFn = vi.fn().mockImplementation(({ data }: { data: Record<string, unknown> }) => {
      // eslint-disable-next-line no-plusplus
      const id = idCounter++;
      const createdId = id;
      callDataByMatchNumber.set(data.matchNumber as number, { ...data, createdId });
      return Promise.resolve({ id });
    });
    const req = makeReq(createFn);

    await scaffoldTournamentMatches({
      doc,
      operation: 'create',
      req: req as any,
      collection: {} as any,
      context: {} as any,
      previousDoc: undefined as any,
    });

    // Championship (63) should have no nextMatch
    const champ = callDataByMatchNumber.get(63)!;
    expect(champ.nextMatch).toBeUndefined();

    // Fantastic 4 (61, 62) should reference championship's created id
    const champCreatedId = champ.createdId as number;
    const m61 = callDataByMatchNumber.get(61)!;
    const m62 = callDataByMatchNumber.get(62)!;
    expect(m61.nextMatch).toBe(champCreatedId);
    expect(m62.nextMatch).toBe(champCreatedId);
  });

  it('logs error and continues when a match creation fails', async () => {
    const doc = { id: 9, name: 'MRM 2025', startDate: '2025-03-24T00:00:00.000Z' };
    let idCounter = 400;
    const createFn = vi.fn().mockImplementation(({ data }: { data: { matchNumber: number } }) => {
      if (data.matchNumber === 62) return Promise.reject(new Error('DB error'));
      // eslint-disable-next-line no-plusplus
      return Promise.resolve({ id: idCounter++ });
    });
    const req = makeReq(createFn);

    await scaffoldTournamentMatches({
      doc,
      operation: 'create',
      req: req as any,
      collection: {} as any,
      context: {} as any,
      previousDoc: undefined as any,
    });

    expect(req.payload.logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Failed to scaffold match #62'),
    );
    // Still called for all 63 matches
    expect(createFn).toHaveBeenCalledTimes(TOTAL_MATCHES);
    // Info log reflects actual successful count (62 out of 63)
    expect(req.payload.logger.info).toHaveBeenCalledWith(
      expect.stringContaining(`62/${TOTAL_MATCHES}`),
    );
  });

  it('uses correct collection name and base data fields', async () => {
    const doc = { id: 3, name: 'Test', startDate: '2025-03-24T00:00:00.000Z' };
    let idCounter = 500;
    // eslint-disable-next-line no-plusplus
    const createFn = vi.fn().mockResolvedValue({ id: idCounter++ });
    const req = makeReq(createFn);

    await scaffoldTournamentMatches({
      doc,
      operation: 'create',
      req: req as any,
      collection: {} as any,
      context: {} as any,
      previousDoc: undefined as any,
    });

    const firstCall = createFn.mock.calls[0][0];
    expect(firstCall.collection).toBe('modern-rock-madness-matches');
    expect(firstCall.overrideAccess).toBe(true);
    expect(firstCall.data.tournament).toBe(3);
    expect(firstCall.data.band1Votes).toBe(0);
    expect(firstCall.data.band2Votes).toBe(0);
    expect(firstCall.data.showScore).toBe(false);
  });
});
