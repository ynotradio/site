/**
 * afterChange hook for Tournaments: scaffolds all 63 bracket matches on create.
 *
 * A 64-team single-elimination bracket has:
 *   Round 1 (64→32): 32 matches — 8 per region
 *   Round 2 (32→16): 16 matches — 4 per region
 *   Sweet 16 (16→8):  8 matches — 2 per region
 *   Elusive 8 (8→4):  4 matches — 1 per region
 *   Final 4  (4→2):   2 matches — region 5
 *   Championship:      1 match  — region 5
 *                     ──
 *                     63 total
 *
 * Matches are numbered 1-63. Within each round the numbering flows through
 * regions 1-4 in order so that consecutive pairs in round N feed the
 * corresponding single match in round N+1.
 *
 * The schedule follows the historical pattern from ynot_db.sql:
 *
 *   Week 1 (Mon–Thu): Round 1 — one region per day, 8 matches/day
 *   Week 2 Mon:       Round 2, regions 1-2 (8 matches)
 *   Week 2 Tue:       Round 2, regions 3-4 (8 matches)
 *   Week 2 Wed:       Sweet 16 (8 matches)
 *   Week 2 Thu:       Elusive 8 afternoon + Final 4 evening (6 matches)
 *   Week 2 Fri:       Championship (1 match)
 *
 * Daily slots: 14:00, 14:30, 15:00, 15:30 | 17:00, 17:30, 18:00, 18:30
 * Durations:   R1-R4 = 30 min, Final 4 = 60 min, Championship = 120 min
 */

import type { CollectionAfterChangeHook } from 'payload';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MatchDefinition {
  matchNumber: number;
  round: string;
  region: number;
  /** The matchNumber this winner feeds into (undefined for the championship). */
  nextMatchNumber: number | undefined;
  startTime: string; // ISO-8601
  endTime: string; // ISO-8601
}

// ---------------------------------------------------------------------------
// Round metadata
// ---------------------------------------------------------------------------

interface RoundMeta {
  round: string;
  startMatch: number;
  count: number;
  matchesPerRegion: number;
}

const ROUNDS: RoundMeta[] = [
  {
    round: '1', startMatch: 1, count: 32, matchesPerRegion: 8,
  },
  {
    round: '2', startMatch: 33, count: 16, matchesPerRegion: 4,
  },
  {
    round: '3', startMatch: 49, count: 8, matchesPerRegion: 2,
  },
  {
    round: '4', startMatch: 57, count: 4, matchesPerRegion: 1,
  },
  {
    round: '5', startMatch: 61, count: 2, matchesPerRegion: 0, // region 5
  },
  {
    round: '6', startMatch: 63, count: 1, matchesPerRegion: 0, // region 5
  },
];

export const TOTAL_MATCHES = 63;

// ---------------------------------------------------------------------------
// Schedule template (from ynot_db.sql historical pattern)
// ---------------------------------------------------------------------------

/**
 * Standard 8-match-day time slots (30 min each).
 *   Afternoon block: 14:00, 14:30, 15:00, 15:30
 *   Evening block:   17:00, 17:30, 18:00, 18:30
 */
export const STANDARD_SLOTS: { hour: number; minute: number }[] = [
  { hour: 14, minute: 0 },
  { hour: 14, minute: 30 },
  { hour: 15, minute: 0 },
  { hour: 15, minute: 30 },
  { hour: 17, minute: 0 },
  { hour: 17, minute: 30 },
  { hour: 18, minute: 0 },
  { hour: 18, minute: 30 },
];

interface MatchSlot {
  matchNumber: number;
  dayOffset: number;
  durationMinutes: number;
  hour: number;
  minute: number;
}

/**
 * Build the full 63-match schedule template.
 * Each entry maps a match number to its day offset and time slot.
 */
export const buildScheduleSlots = (): MatchSlot[] => {
  const slots: MatchSlot[] = [];

  /** Add a standard 8-match day (4 afternoon + 4 evening, each 30 min). */
  const addStandardDay = (startMatch: number, dayOffset: number): void => {
    STANDARD_SLOTS.forEach(({ hour, minute }, i) => {
      slots.push({
        matchNumber: startMatch + i,
        dayOffset,
        hour,
        minute,
        durationMinutes: 30,
      });
    });
  };

  // ── Week 1: Round 1 (Mon–Thu, one region per day) ───────────────────
  addStandardDay(1, 0); // Region 1
  addStandardDay(9, 1); // Region 2
  addStandardDay(17, 2); // Region 3
  addStandardDay(25, 3); // Region 4

  // ── Week 2: Round 2 (Mon–Tue) ──────────────────────────────────────
  addStandardDay(33, 7); // Regions 1-2
  addStandardDay(41, 8); // Regions 3-4

  // ── Week 2: Sweet 16 (Wed) ─────────────────────────────────────────
  addStandardDay(49, 9);

  // ── Week 2: Elusive 8 (Thu afternoon, 4 × 30 min) ─────────────────
  STANDARD_SLOTS.slice(0, 4).forEach(({ hour, minute }, i) => {
    slots.push({
      matchNumber: 57 + i,
      dayOffset: 10,
      hour,
      minute,
      durationMinutes: 30,
    });
  });

  // ── Week 2: Final 4 (Thu evening, 2 × 60 min) ─────────────────────
  slots.push({
    matchNumber: 61, dayOffset: 10, hour: 18, minute: 0, durationMinutes: 60,
  });
  slots.push({
    matchNumber: 62, dayOffset: 10, hour: 19, minute: 0, durationMinutes: 60,
  });

  // ── Week 2: Championship (Fri, 1 × 120 min) ───────────────────────
  slots.push({
    matchNumber: 63, dayOffset: 11, hour: 17, minute: 0, durationMinutes: 120,
  });

  return slots;
};

// ---------------------------------------------------------------------------
// Pure bracket generation
// ---------------------------------------------------------------------------

/**
 * Return the region (1-4) for a match within rounds 1-4, or 5 for Final 4+.
 */
const getRegion = (matchNumber: number, roundMeta: RoundMeta): number => {
  if (roundMeta.matchesPerRegion === 0) return 5;
  const offsetInRound = matchNumber - roundMeta.startMatch;
  return Math.floor(offsetInRound / roundMeta.matchesPerRegion) + 1;
};

/**
 * Return the match number in the next round that the winner of `matchNumber`
 * advances to, or undefined for the championship.
 */
const getNextMatchNumber = (matchNumber: number, roundIndex: number): number | undefined => {
  if (roundIndex >= ROUNDS.length - 1) return undefined; // championship
  const current = ROUNDS[roundIndex];
  const next = ROUNDS[roundIndex + 1];
  const offsetInRound = matchNumber - current.startMatch;
  return next.startMatch + Math.floor(offsetInRound / 2);
};

/**
 * Build a UTC Date from a base date, day offset, hour, and minute.
 */
const buildTime = (baseDate: Date, dayOffset: number, hour: number, minute: number): Date => {
  const d = new Date(baseDate);
  d.setUTCDate(d.getUTCDate() + dayOffset);
  d.setUTCHours(hour, minute, 0, 0);
  return d;
};

/**
 * Generate all 63 match definitions for a standard 64-team bracket.
 *
 * @param startDate – ISO-8601 date string for the tournament start (should be
 *   a Monday). The schedule follows the historical 2-week pattern:
 *   - 8 matches/day with 30-min slots in afternoon (14:00) and evening (17:00) blocks
 *   - Final 4 matches are 60 min, Championship is 120 min
 */
export const generateBracketDefinitions = (startDate: string): MatchDefinition[] => {
  const baseDate = new Date(startDate);
  // Normalize to midnight UTC so time slots are clean
  baseDate.setUTCHours(0, 0, 0, 0);

  const scheduleSlots = buildScheduleSlots();
  const slotByMatch = new Map<number, MatchSlot>();
  scheduleSlots.forEach((slot) => slotByMatch.set(slot.matchNumber, slot));

  const matches: MatchDefinition[] = [];

  ROUNDS.forEach((meta, roundIndex) => {
    for (let i = 0; i < meta.count; i += 1) {
      const matchNumber = meta.startMatch + i;
      const slot = slotByMatch.get(matchNumber)!;
      const start = buildTime(baseDate, slot.dayOffset, slot.hour, slot.minute);
      const end = new Date(start.getTime() + slot.durationMinutes * 60_000);

      matches.push({
        matchNumber,
        round: meta.round,
        region: getRegion(matchNumber, meta),
        nextMatchNumber: getNextMatchNumber(matchNumber, roundIndex),
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      });
    }
  });

  return matches;
};

// ---------------------------------------------------------------------------
// Payload afterChange hook
// ---------------------------------------------------------------------------

export const scaffoldTournamentMatches: CollectionAfterChangeHook = async ({
  doc,
  operation,
  req,
}) => {
  if (operation !== 'create') return doc;

  const tournamentId: number | string = doc.id;
  const { startDate } = doc as { startDate: string };
  const definitions = generateBracketDefinitions(startDate);

  // Create matches from the championship backwards so that by the time we
  // create earlier-round matches the nextMatch document already exists and
  // we can reference its ID.
  const reversed = [...definitions].reverse();

  // Map matchNumber → created Payload document ID
  const matchIdByNumber = new Map<number, number | string>();

  // eslint-disable-next-line no-restricted-syntax
  for (const def of reversed) {
    const nextMatchId = def.nextMatchNumber
      ? matchIdByNumber.get(def.nextMatchNumber)
      : undefined;

    try {
      // eslint-disable-next-line no-await-in-loop
      const created = await req.payload.create({
        collection: 'modern-rock-madness-matches',
        data: {
          tournament: tournamentId,
          matchNumber: def.matchNumber,
          round: def.round,
          region: def.region,
          startTime: def.startTime,
          endTime: def.endTime,
          band1Votes: 0,
          band2Votes: 0,
          showScore: false,
          ...(nextMatchId != null ? { nextMatch: nextMatchId } : {}),
        },
        req,
      });

      matchIdByNumber.set(def.matchNumber, created.id);
    } catch (error) {
      req.payload.logger.error(
        `Failed to scaffold match #${def.matchNumber} for tournament ${tournamentId}: ${error}`,
      );
    }
  }

  req.payload.logger.info(
    `Scaffolded ${matchIdByNumber.size}/${TOTAL_MATCHES} matches for tournament "${doc.name}" (${tournamentId})`,
  );

  return doc;
};
