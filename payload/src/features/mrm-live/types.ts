export interface MrmGroupSummary {
  id: string;
  name: string;
  abbreviation?: string;
  seed: number;
  placement: number;
}

export interface NextMatchRef {
  id: string;
  matchNumber: number;
  band1?: MrmGroupSummary | null;
  band2?: MrmGroupSummary | null;
}

export interface LiveMatch {
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
  showScore: boolean;
  nextMatch?: NextMatchRef | string | null;
  sponsor?: string;
  sponsorMessage?: string;
}

export interface MatchApiResponse {
  docs: LiveMatch[];
  totalDocs: number;
}

export type MatchStatus = 'upcoming' | 'live' | 'overtime' | 'closed';

/** @deprecated use MrmGroupSummary */
export type MadnessBandSummary = MrmGroupSummary;
