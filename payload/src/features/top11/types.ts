export type Top11ContestStatus = 'draft' | 'open' | 'closed' | 'published' | 'archived';

export interface Top11Contest {
  id: number;
  title: string;
  status: Top11ContestStatus;
  weekOf: string;
  settings?: {
    excludePriorWinners?: boolean;
    priorWinnerLookbackContests?: number;
  };
}

export interface Top11RankedSong {
  song: number;
  displayOrder: number;
  votes: number;
}

export interface Top11RankedWriteIn {
  text: string;
  count: number;
  hiddenCount: number;
}

export interface Top11ContestStats {
  contestId: number;
  status: Top11ContestStatus;
  totalVotes: number;
  uniqueVoters: number;
  contestants: number;
  newsletterOptInContestants: number;
  writeInCount: number;
  rankedWriteIns: Top11RankedWriteIn[];
  rankedSongs: Top11RankedSong[];
}

export interface Top11Winner {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

export interface Top11PickWinnerResult {
  winner: Top11Winner;
  drawLogId: number;
  totalEntries: number;
  eligibleEntries: number;
  excludePriorWinners: boolean;
}
