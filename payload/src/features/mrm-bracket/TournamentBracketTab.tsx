'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Gutter, useDocumentInfo } from '@payloadcms/ui';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { EmptyState } from '../shared/EmptyState';
import type { BracketMatch, MatchesApiResponse } from './types';
import { ROUND_LABELS } from './types';
import './TournamentBracketTab.css';

const getBandLabel = (band: BracketMatch['band1']): string => {
  if (!band) return '(TBD)';
  if (typeof band === 'string') return band;
  return `#${band.seed} ${band.name}`;
};

const getWinnerId = (match: BracketMatch): string | null => {
  if (!match.winner) return null;
  return typeof match.winner === 'string' ? match.winner : match.winner.id;
};

const getBandId = (band: BracketMatch['band1']): string | null => {
  if (!band || typeof band === 'string') return null;
  return band.id;
};

const getMatchStatus = (match: BracketMatch): 'upcoming' | 'live' | 'closed' => {
  const now = Date.now();
  if (match.winner) return 'closed';
  if (new Date(match.startTime).getTime() > now) return 'upcoming';
  return 'live';
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

  if (loading) return <Gutter><LoadingSpinner /></Gutter>;

  if (!tournamentId) {
    return (
      <Gutter>
        <EmptyState message="Save this tournament first to view its bracket." />
      </Gutter>
    );
  }

  const rounds = groupByRound(matches);
  const roundKeys = Array.from(rounds.keys()).sort(
    (a, b) => parseInt(a, 10) - parseInt(b, 10),
  );

  return (
    <Gutter>
      <div className="bracket-tab">
        {error && (
          <div className="bracket-tab__alert bracket-tab__alert--error">{error}</div>
        )}

        {matches.length === 0 && !error && (
          <EmptyState message={`No matches found for ${tournamentName}. Add matches to see the bracket.`} />
        )}

        {roundKeys.map((round) => (
          <section key={round} className="bracket-tab__round">
            <h3 className="bracket-tab__round-label">
              {ROUND_LABELS[round] ?? `Round ${round}`}
            </h3>
            <div className="bracket-tab__grid">
              {(rounds.get(round) ?? []).map((match) => {
                const status = getMatchStatus(match);
                const winnerId = getWinnerId(match);
                const band1Id = getBandId(match.band1);
                const band2Id = getBandId(match.band2);
                return (
                  <a
                    key={match.id}
                    href={`/admin/collections/modern-rock-madness-matches/${match.id}`}
                    className={`bracket-tab__match bracket-tab__match--${status}`}
                    aria-label={`Match ${match.matchNumber}: ${getBandLabel(match.band1)} vs ${getBandLabel(match.band2)}`}
                  >
                    <span className="bracket-tab__match-num">#{match.matchNumber}</span>
                    <span className={`bracket-tab__status bracket-tab__status--${status}`}>
                      {status === 'live' && '🔴'}
                      {status === 'closed' && '✅'}
                      {status === 'upcoming' && '⏳'}
                    </span>
                    <span
                      className={`bracket-tab__band ${band1Id && winnerId === band1Id ? 'bracket-tab__band--winner' : ''}`}
                    >
                      {getBandLabel(match.band1)}
                      {band1Id && winnerId === band1Id && ' 🏆'}
                    </span>
                    <span className="bracket-tab__vs">vs</span>
                    <span
                      className={`bracket-tab__band ${band2Id && winnerId === band2Id ? 'bracket-tab__band--winner' : ''}`}
                    >
                      {getBandLabel(match.band2)}
                      {band2Id && winnerId === band2Id && ' 🏆'}
                    </span>
                    {status !== 'upcoming' && (
                      <span className="bracket-tab__votes">
                        {match.band1Votes.toLocaleString()} – {match.band2Votes.toLocaleString()}
                      </span>
                    )}
                  </a>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </Gutter>
  );
};

export default TournamentBracketTab;
