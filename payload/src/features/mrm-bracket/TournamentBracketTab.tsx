'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Gutter, useDocumentInfo } from '@payloadcms/ui';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { EmptyState } from '../shared/EmptyState';
import { BracketTree } from './BracketTree';
import type { BracketMatch, MatchesApiResponse } from './types';
import './TournamentBracketTab.css';

const MATCHES_LIST_URL = '/admin/collections/modern-rock-madness-matches';
const LIVE_DASHBOARD_URL = '/admin/mrm-live';

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

  return (
    <Gutter>
      <div className="bracket-tab">
        <nav className="bracket-tab__nav">
          <a href={MATCHES_LIST_URL} className="bracket-tab__nav-link">
            📋 All Matches
          </a>
          <a href={LIVE_DASHBOARD_URL} className="bracket-tab__nav-link">
            📡 Live Dashboard
          </a>
        </nav>

        {error && <div className="bracket-tab__alert bracket-tab__alert--error">{error}</div>}

        {matches.length === 0 && !error ? (
          <EmptyState
            message={`No matches found for ${tournamentName}. Add matches to see the bracket.`}
          />
        ) : (
          <BracketTree matches={matches} />
        )}
      </div>
    </Gutter>
  );
};

export default TournamentBracketTab;
