export interface MrmTournamentSummary {
  id: string;
  name: string;
  year: number;
  status: string;
  startDate: string;
}

export interface MrmGroupSummary {
  id: string;
  name: string;
  abbreviation?: string;
  seed: number;
  placement: number;
}

export interface BracketMatch {
  id: string;
  matchNumber: number;
  round: string;
  region?: number;
  band1?: MrmGroupSummary | null;
  band2?: MrmGroupSummary | null;
  band1Votes: number;
  band2Votes: number;
  startTime: string;
  endTime: string;
  winner?: MrmGroupSummary | null;
}

export interface TournamentApiResponse {
  docs: MrmTournamentSummary[];
  totalDocs: number;
}

export interface MatchesApiResponse {
  docs: BracketMatch[];
  totalDocs: number;
}

export const ROUND_LABELS: Record<string, string> = {
  1: 'Round 1 (64→32)',
  2: 'Round 2 (32→16)',
  3: 'Sweet 16 (16→8)',
  4: 'Elusive 8 (8→4)',
  5: 'Final 4 (4→2)',
  6: 'Championship',
};

/** @deprecated use MrmTournamentSummary */
export type MadnessTournamentSummary = MrmTournamentSummary;

/** @deprecated use MrmGroupSummary */
export type MadnessBandSummary = MrmGroupSummary;
