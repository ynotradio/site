import type { LiveMatch, MatchStatus } from './types';

const COL = '/admin/collections';
export const TOURNAMENT_EDIT_BASE = `${COL}/modern-rock-madness-tournaments`;
export const MATCH_EDIT_BASE = `${COL}/modern-rock-madness-matches`;
const VOTES_BASE = `${COL}/modern-rock-madness-votes`;
const EVENTS_BASE = `${COL}/modern-rock-madness-match-events`;
const GROUPS_BASE = `${COL}/modern-rock-madness-groups`;

export const ROUND_LABELS: Record<string, string> = {
  1: 'Round 1',
  2: 'Round 2',
  3: 'Swell 16',
  4: 'Elusive 8',
  5: 'Fantastic 4',
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

// --- Band image helpers (depth=2 populated data) ---
interface MediaRef {
  url: string;
}
interface ArtistWithImage {
  name: string;
  image?: MediaRef | null;
}
interface BandWithMedia {
  image?: MediaRef | null;
  artists?: ArtistWithImage[];
}

export const getBandImageUrl = (band: LiveMatch['band1']): string | null => {
  if (!band || typeof band === 'string') return null;
  const ext = band as typeof band & BandWithMedia;
  if (ext.image?.url) return ext.image.url;
  const first = ext.artists?.[0];
  return first?.image?.url ?? null;
};

export const getBandId = (band: LiveMatch['band1']): string | null => {
  if (!band || typeof band === 'string') return null;
  return String(band.id);
};

// --- Countdown display ---
const pad2 = (n: number): string => String(n).padStart(2, '0');

export const formatCountdown = (ms: number): string => {
  if (ms <= 0) return '00:00:00';
  const s = Math.floor(ms / 1000);
  const h = pad2(Math.floor(s / 3600));
  const m = pad2(Math.floor((s % 3600) / 60));
  return `${h}:${m}:${pad2(s % 60)}`;
};

export interface CenterDisplay {
  text: string;
  type: 'countdown' | 'vs' | 'final';
}

export const getCenterDisplay = (match: LiveMatch): CenterDisplay => {
  const status = getMatchStatus(match);
  if (status === 'closed') {
    return { text: 'Final', type: 'final' };
  }
  if (status === 'upcoming') {
    return { text: 'VS', type: 'vs' };
  }
  const end = new Date(match.endTime).getTime();
  const remaining = end - Date.now();
  if (remaining <= 0) {
    return { text: 'OT', type: 'countdown' };
  }
  return {
    text: formatCountdown(remaining),
    type: 'countdown',
  };
};

// --- Collection URLs ---
export const getVotesUrl = (matchId: string): string => {
  const q = `?where[match][equals]=${matchId}`;
  return `${VOTES_BASE}${q}`;
};

export const getEventsUrl = (matchId: string): string => {
  const q = `?where[match][equals]=${matchId}`;
  return `${EVENTS_BASE}${q}`;
};

export const getGroupUrl = (groupId: string): string => `${GROUPS_BASE}/${groupId}`;
