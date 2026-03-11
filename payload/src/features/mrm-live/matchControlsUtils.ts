import type { LiveMatch, MatchStatus } from './types';

export const TOURNAMENT_EDIT_BASE = '/admin/collections/modern-rock-madness-tournaments';
export const MATCH_EDIT_BASE = '/admin/collections/modern-rock-madness-matches';
export const LIVE_DASHBOARD_URL = '/admin/mrm-live';

export const ROUND_LABELS: Record<string, string> = {
  1: 'Round 1',
  2: 'Round 2',
  3: 'Sweet 16',
  4: 'Elusive 8',
  5: 'Final 4',
  6: 'Championship',
};

export const STATUS_LABELS: Record<MatchStatus, string> = {
  live: '🔴 LIVE',
  upcoming: '⏳ Upcoming',
  overtime: '⏰ Overtime',
  closed: '✅ Closed',
};

export const getMatchStatus = (match: LiveMatch): MatchStatus => {
  const now = Date.now();
  const start = new Date(match.startTime).getTime();
  const end = new Date(match.endTime).getTime();
  if (now < start) return 'upcoming';
  if (now <= end) return 'live';
  if (!match.winner) return 'overtime';
  return 'closed';
};

export const getVotePercent = (votes: number, total: number): number => {
  if (total === 0) return 50;
  return Math.round((votes / total) * 100);
};

export const getBandName = (band: LiveMatch['band1']): string => {
  if (!band) return '(TBD)';
  return typeof band === 'string' ? band : band.name;
};

export const getBandSeed = (band: LiveMatch['band1']): number | null => {
  if (!band || typeof band === 'string') return null;
  return band.seed;
};

export const isWinner = (match: LiveMatch, bandKey: 'band1' | 'band2'): boolean => {
  if (!match.winner) return false;
  const band = match[bandKey];
  if (!band || typeof band === 'string') return false;
  const winnerId = typeof match.winner === 'string' ? match.winner : match.winner.id;
  return band.id === winnerId;
};

export const getWinnerSlot = (match: LiveMatch): '1' | '2' | null => {
  if (isWinner(match, 'band1')) return '1';
  if (isWinner(match, 'band2')) return '2';
  return null;
};

export const getTournamentId = (match: LiveMatch): string | null => {
  const extended = match as LiveMatch & {
    tournament?: string | { id: string };
  };
  if (!extended.tournament) return null;
  return typeof extended.tournament === 'string' ? extended.tournament : extended.tournament.id;
};

export const getNextMatchId = (match: LiveMatch): string | null => {
  if (!match.nextMatch) return null;
  return typeof match.nextMatch === 'string' ? match.nextMatch : match.nextMatch.id;
};
