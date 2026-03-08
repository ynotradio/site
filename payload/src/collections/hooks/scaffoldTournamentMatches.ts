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

const MS_PER_DAY = 86_400_000;
const DAYS_BETWEEN_ROUNDS = 7;
const MATCH_DURATION_HOURS = 24;

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
 * Generate all 63 match definitions for a standard 64-team bracket.
 *
 * @param startDate – ISO-8601 date string for the tournament start. Each round
 *   is offset by {@link DAYS_BETWEEN_ROUNDS} days and each match within a round
 *   lasts {@link MATCH_DURATION_HOURS} hours.
 */
export const generateBracketDefinitions = (startDate: string): MatchDefinition[] => {
  const baseTime = new Date(startDate).getTime();
  const matches: MatchDefinition[] = [];

  ROUNDS.forEach((meta, roundIndex) => {
    const roundStart = new Date(baseTime + roundIndex * DAYS_BETWEEN_ROUNDS * MS_PER_DAY);
    const roundEnd = new Date(roundStart.getTime() + MATCH_DURATION_HOURS * 3_600_000);

    for (let i = 0; i < meta.count; i += 1) {
      const matchNumber = meta.startMatch + i;
      matches.push({
        matchNumber,
        round: meta.round,
        region: getRegion(matchNumber, meta),
        nextMatchNumber: getNextMatchNumber(matchNumber, roundIndex),
        startTime: roundStart.toISOString(),
        endTime: roundEnd.toISOString(),
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
