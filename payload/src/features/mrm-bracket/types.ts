export interface MadnessTournamentSummary {
  id: string;
  name: string;
  year: number;
  status: string;
  startDate: string;
}

export interface MadnessBandSummary {
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
  band1?: MadnessBandSummary | null;
  band2?: MadnessBandSummary | null;
  band1Votes: number;
  band2Votes: number;
  startTime: string;
  endTime: string;
  winner?: MadnessBandSummary | null;
}

export interface TournamentApiResponse {
  docs: MadnessTournamentSummary[];
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
