'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Gutter, useDocumentInfo } from '@payloadcms/ui';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { EmptyState } from '../shared/EmptyState';
import { AdminBracketMatch } from '../mrm-shared/AdminBracketMatch';
import type { BracketMatch, MatchesApiResponse } from './types';
import { ROUND_LABELS } from './types';
import './TournamentBracketTab.css';

const MATCH_EDIT_BASE = '/admin/collections/modern-rock-madness-matches';
const BRACKET_OVERVIEW_URL = '/admin/mrm-bracket';
const MATCHES_LIST_URL = '/admin/collections/modern-rock-madness-matches';

const getBandProp = (band: BracketMatch['band1']) => {
  if (!band || typeof band === 'string') return null;
  return { seed: band.seed, name: band.name };
};

const getWinnerId = (match: BracketMatch): string | null => {
  if (!match.winner) return null;
  return typeof match.winner === 'string' ? match.winner : match.winner.id;
};

const getBandId = (band: BracketMatch['band1']): string | null => {
  if (!band || typeof band === 'string') return null;
  return band.id;
};

const getWinnerSlot = (match: BracketMatch): '1' | '2' | null => {
  const wId = getWinnerId(match);
  if (!wId) return null;
  if (getBandId(match.band1) === wId) return '1';
  if (getBandId(match.band2) === wId) return '2';
  return null;
};

type MatchStatus = 'upcoming' | 'live' | 'closed';

const getMatchStatus = (match: BracketMatch): MatchStatus => {
  const now = Date.now();
  if (match.winner) return 'closed';
  if (new Date(match.startTime).getTime() > now) return 'upcoming';
  return 'live';
};

const STATUS_BADGES: Record<MatchStatus, string> = {
  live: '🔴 LIVE',
  upcoming: '⏳',
  closed: '✅',
};

const getVotePct = (match: BracketMatch): { b1: string; b2: string } | null => {
  const total = match.band1Votes + match.band2Votes;
  if (total === 0) return null;
  const p1 = Math.round((match.band1Votes / total) * 100);
  return { b1: `${p1}%`, b2: `${100 - p1}%` };
};

const groupByRound = (matches: BracketMatch[]): Map<string, BracketMatch[]> => {
  const map = new Map<string, BracketMatch[]>();
  matches.forEach((m) => {
    const list = map.get(m.round) ?? [];
    list.push(m);
    map.set(m.round, list);
  });
  return map;
};

export const TournamentBracketTab: React.FC = () => {
  const { data } = useDocumentInfo();
  const tournamentId = data?.id as string | undefined;
  const tournamentName = (data?.name as string) ?? 'Tournament';

  const [matches, setMatches] = useState<BracketMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMatches = useCallback(async () => {
    if (!tournamentId) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(
        `/api/modern-rock-madness-matches?where[tournament][equals]=${tournamentId}&limit=200&sort=matchNumber&depth=1`,
      );
      if (!res.ok) throw new Error('Failed to fetch matches');
      const mData: MatchesApiResponse = await res.json();
      setMatches(mData.docs);
      setError(null);
    } catch (err) {
      setError('Could not load bracket data.');
      // eslint-disable-next-line no-console
      console.error('TournamentBracketTab fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  if (loading) {
    return (
      <Gutter>
        <LoadingSpinner />
      </Gutter>
    );
  }

  if (!tournamentId) {
    return (
      <Gutter>
        <EmptyState message="Save this tournament first to view its bracket." />
      </Gutter>
    );
  }

  const rounds = groupByRound(matches);
  const roundKeys = Array.from(rounds.keys()).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));

  return (
    <Gutter>
      <div className="bracket-tab">
        <nav className="bracket-tab__nav">
          <a href={BRACKET_OVERVIEW_URL} className="bracket-tab__nav-link">
            📊 Bracket Overview
          </a>
          <a href={MATCHES_LIST_URL} className="bracket-tab__nav-link">
            📋 All Matches
          </a>
        </nav>

        {error && <div className="bracket-tab__alert bracket-tab__alert--error">{error}</div>}

        {matches.length === 0 && !error && (
          <EmptyState
            message={`No matches found for ${tournamentName}. Add matches to see the bracket.`}
          />
        )}

        {roundKeys.map((round) => {
          const roundMatches = rounds.get(round) ?? [];
          return (
            <section key={round} className="bracket-tab__round">
              <h3 className="bracket-tab__round-label">
                {ROUND_LABELS[round] ?? `Round ${round}`}
                <span className="bracket-tab__round-count">
                  {roundMatches.length} match{roundMatches.length !== 1 ? 'es' : ''}
                </span>
              </h3>
              <div className="bracket-tab__grid">
                {roundMatches.map((match) => {
                  const status = getMatchStatus(match);
                  const pcts = status !== 'upcoming' ? getVotePct(match) : null;
                  const b1 = getBandProp(match.band1);
                  const b2 = getBandProp(match.band2);

                  return (
                    <AdminBracketMatch
                      key={match.id}
                      band1={b1 ? { ...b1, pct: pcts?.b1 } : null}
                      band2={b2 ? { ...b2, pct: pcts?.b2 } : null}
                      winner={getWinnerSlot(match)}
                      live={status === 'live'}
                      href={`${MATCH_EDIT_BASE}/${match.id}`}
                      matchLabel={`#${match.matchNumber}`}
                      statusBadge={STATUS_BADGES[status]}
                    />
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </Gutter>
  );
};

export default TournamentBracketTab;
