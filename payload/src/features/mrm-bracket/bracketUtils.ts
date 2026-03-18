import type { BracketMatch, MrmGroupSummary } from './types';

/** Infer a match's region from its matchNumber when region is not set. */
export const inferRegion = (matchNum: number): number => {
  // Region mapping: R1 matches 1-32, R2 matches 33-48, R3 49-56, R4 57-60, Championship 61-63
  const regionMap: Record<number, number> = {
    57: 1,
    58: 2,
    59: 3,
    60: 4,
  };
  if (matchNum in regionMap) return regionMap[matchNum];
  if (matchNum >= 61) return 5;

  // R1: 8 per region, R2: 4 per region, R3: 2 per region
  const ranges: [number, number, number][] = [
    [1, 8, 1],
    [9, 16, 2],
    [17, 24, 3],
    [25, 32, 4],
    [33, 36, 1],
    [37, 40, 2],
    [41, 44, 3],
    [45, 48, 4],
    [49, 50, 1],
    [51, 52, 2],
    [53, 54, 3],
    [55, 56, 4],
  ];
  const found = ranges.find(([lo, hi]) => matchNum >= lo && matchNum <= hi);
  return found ? found[2] : 5;
};

export interface RegionRounds {
  round1: BracketMatch[];
  round2: BracketMatch[];
  round3: BracketMatch[];
  round4: BracketMatch[];
}

export interface BracketLayout {
  regions: Record<1 | 2 | 3 | 4, RegionRounds>;
  semiLeft?: BracketMatch;
  semiRight?: BracketMatch;
  final?: BracketMatch;
}

const ROUND_KEYS: (keyof RegionRounds)[] = ['round1', 'round2', 'round3', 'round4'];

const emptyRegion = (): RegionRounds => ({
  round1: [],
  round2: [],
  round3: [],
  round4: [],
});

/** Organize matches into a bracket tree layout by region and round. */
export const organizeForBracket = (matches: BracketMatch[]): BracketLayout => {
  const layout: BracketLayout = {
    regions: {
      1: emptyRegion(),
      2: emptyRegion(),
      3: emptyRegion(),
      4: emptyRegion(),
    },
  };

  const semis = matches
    .filter((x) => (x.region ?? inferRegion(x.matchNumber)) === 5 && parseInt(x.round, 10) === 5)
    .sort((a, b) => a.matchNumber - b.matchNumber);

  matches.forEach((m) => {
    const region = m.region ?? inferRegion(m.matchNumber);
    const round = parseInt(m.round, 10);

    if (region === 5 || round >= 5) {
      if (round === 6 || m.matchNumber === 63) {
        layout.final = m;
      } else if (semis[0]?.id === m.id) {
        layout.semiLeft = m;
      } else {
        layout.semiRight = m;
      }
      return;
    }

    const regionData = layout.regions[region as 1 | 2 | 3 | 4];
    if (!regionData) return;
    const key = ROUND_KEYS[round - 1];
    if (key) regionData[key].push(m);
  });

  // Sort each round by matchNumber
  ([1, 2, 3, 4] as const).forEach((r) => {
    ROUND_KEYS.forEach((k) => {
      layout.regions[r][k].sort((a, b) => a.matchNumber - b.matchNumber);
    });
  });

  return layout;
};

/** Get band name, preferring abbreviation for compact bracket display. */
export const getBandAbbr = (band: MrmGroupSummary | string | null | undefined): string => {
  if (!band) return 'TBD';
  if (typeof band === 'string') return band;
  return band.abbreviation ?? band.name;
};

/** Get band seed number. */
export const getBandSeed = (band: MrmGroupSummary | string | null | undefined): string => {
  if (!band || typeof band === 'string') return '';
  return String(band.seed ?? '');
};

/** Compute vote percentages for a match. Returns null if no votes. */
export const getVotePcts = (m: BracketMatch): { b1: string; b2: string } | null => {
  const total = m.band1Votes + m.band2Votes;
  if (total === 0) return null;
  const p1 = Math.round((m.band1Votes / total) * 100);
  return { b1: `${p1}%`, b2: `${100 - p1}%` };
};

type CellStatus = 'live' | 'upcoming' | 'closed';

/** Determine match status for bracket cell display. */
export const getCellStatus = (m: BracketMatch): CellStatus => {
  if (m.winner) return 'closed';
  if (new Date(m.startTime).getTime() > Date.now()) return 'upcoming';
  return 'live';
};

/** Determine which band slot won: '1', '2', or null. */
export const getWinnerSlot = (m: BracketMatch): '1' | '2' | null => {
  if (!m.winner) return null;
  const wId = typeof m.winner === 'string' ? m.winner : m.winner.id;
  const b1Id = m.band1 && typeof m.band1 !== 'string' ? m.band1.id : null;
  const b2Id = m.band2 && typeof m.band2 !== 'string' ? m.band2.id : null;
  if (b1Id === wId) return '1';
  if (b2Id === wId) return '2';
  return null;
};
