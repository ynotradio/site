export interface MadnessBandSummary {
  id: string;
  name: string;
  abbreviation?: string;
  seed: number;
  placement: number;
  imageUrl?: string;
}

export interface LiveMatch {
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
  showScore: boolean;
  sponsor?: string;
  sponsorMessage?: string;
}

export interface MatchApiResponse {
  docs: LiveMatch[];
  totalDocs: number;
}

export type MatchStatus = 'upcoming' | 'live' | 'overtime' | 'closed';
