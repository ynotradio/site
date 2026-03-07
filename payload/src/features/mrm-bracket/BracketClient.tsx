'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Gutter, useStepNav } from '@payloadcms/ui';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { EmptyState } from '../shared/EmptyState';
import type {
  BracketMatch,
  MrmTournamentSummary,
  MatchesApiResponse,
  TournamentApiResponse,
} from './types';
import { ROUND_LABELS } from './types';
import './BracketClient.css';

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

export const BracketClient: React.FC = () => {
  const [tournament, setTournament] = useState<MrmTournamentSummary | null>(null);
  const [matches, setMatches] = useState<BracketMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setStepNav } = useStepNav();

  useEffect(() => {
    setStepNav([
      { label: 'Modern Rock Madness', url: '/admin/collections/modern-rock-madness-tournaments' },
      { label: 'Bracket Overview' },
    ]);
  }, [setStepNav]);

  const fetchBracket = useCallback(async () => {
    try {
      const tRes = await fetch(
        '/api/modern-rock-madness-tournaments?where[status][equals]=active&limit=1',
      );
      if (!tRes.ok) throw new Error('Failed to fetch tournament');
      const tData: TournamentApiResponse = await tRes.json();
      const activeTournament = tData.docs[0] ?? null;
      setTournament(activeTournament);

      if (activeTournament) {
        const mRes = await fetch(
          `/api/modern-rock-madness-matches?where[tournament][equals]=${activeTournament.id}&limit=200&sort=matchNumber&depth=1`,
        );
        if (!mRes.ok) throw new Error('Failed to fetch matches');
        const mData: MatchesApiResponse = await mRes.json();
        setMatches(mData.docs);
      }
      setError(null);
    } catch (err) {
      setError('Could not load bracket data.');
      // eslint-disable-next-line no-console
      console.error('BracketClient fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBracket();
  }, [fetchBracket]);

  if (loading) return <Gutter><LoadingSpinner /></Gutter>;

  const rounds = groupByRound(matches);
  const roundKeys = Array.from(rounds.keys()).sort(
    (a, b) => parseInt(a, 10) - parseInt(b, 10),
  );

  return (
    <Gutter>
      <div className="bracket-client">
        <div className="bracket-client__header">
          <h1 className="bracket-client__title">
            {tournament ? `${tournament.name} — Bracket` : 'Bracket Overview'}
          </h1>
          <p className="bracket-client__description">
            All {matches.length} matches across {roundKeys.length} rounds.
            Click any match to edit it.
          </p>
        </div>

        {error && (
          <div className="bracket-client__alert bracket-client__alert--error">{error}</div>
        )}

        {!tournament && !error && (
          <EmptyState message="No active tournament found. Set a tournament status to 'active' to view its bracket." />
        )}

        {tournament && matches.length === 0 && !error && (
          <EmptyState message="No matches found for this tournament yet. Add matches to see the bracket." />
        )}

        {roundKeys.map((round) => (
          <section key={round} className="bracket-client__round">
            <h2 className="bracket-client__round-label">
              {ROUND_LABELS[round] ?? `Round ${round}`}
            </h2>
            <div className="bracket-client__match-grid">
              {(rounds.get(round) ?? []).map((match) => {
                const status = getMatchStatus(match);
                const winnerId = getWinnerId(match);
                const band1Id = getBandId(match.band1);
                const band2Id = getBandId(match.band2);
                return (
                  <a
                    key={match.id}
                    href={`/admin/collections/modern-rock-madness-matches/${match.id}`}
                    className={`bracket-client__match bracket-client__match--${status}`}
                    aria-label={`Match ${match.matchNumber}: ${getBandLabel(match.band1)} vs ${getBandLabel(match.band2)}`}
                  >
                    <div className="bracket-client__match-number">#{match.matchNumber}</div>
                    <div
                      className={`bracket-client__band ${band1Id && winnerId === band1Id ? 'bracket-client__band--winner' : ''}`}
                    >
                      {getBandLabel(match.band1)}
                      {band1Id && winnerId === band1Id && (
                        <span className="bracket-client__trophy" aria-hidden="true"> 🏆</span>
                      )}
                    </div>
                    <div className="bracket-client__vs">vs</div>
                    <div
                      className={`bracket-client__band ${band2Id && winnerId === band2Id ? 'bracket-client__band--winner' : ''}`}
                    >
                      {getBandLabel(match.band2)}
                      {band2Id && winnerId === band2Id && (
                        <span className="bracket-client__trophy" aria-hidden="true"> 🏆</span>
                      )}
                    </div>
                    {status !== 'upcoming' && (
                      <div className="bracket-client__votes">
                        {match.band1Votes.toLocaleString()} — {match.band2Votes.toLocaleString()}
                      </div>
                    )}
                    <div className={`bracket-client__status bracket-client__status--${status}`}>
                      {status === 'live' && '🔴'}
                      {status === 'closed' && '✅'}
                      {status === 'upcoming' && '⏳'}
                    </div>
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

export default BracketClient;
