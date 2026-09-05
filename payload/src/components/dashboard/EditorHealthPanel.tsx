'use client';

import React, { useEffect, useState } from 'react';
import { useConfig, useAuth } from '@payloadcms/ui';

/**
 * Admin-only dashboard panel summarizing editor-experience health from the
 * `editor-events` log: how many errors and empty searches editors hit in the
 * last 7 days, and where. Gives the team an at-a-glance signal to get ahead of
 * recurring pain points instead of waiting for someone to complain.
 *
 * Rendered as an `afterDashboard` component; it renders nothing for non-admins.
 */

const WINDOW_DAYS = 7;

interface EditorEvent {
  id: number | string;
  type: 'error' | 'empty-search';
  collectionSlug?: string | null;
  message?: string | null;
  userEmail?: string | null;
  createdAt: string;
}

function hasAdminRole(role: unknown): boolean {
  if (Array.isArray(role)) return role.includes('admin');
  return role === 'admin';
}

function countBy<T>(items: T[], key: (item: T) => string | undefined): Array<[string, number]> {
  const counts = new Map<string, number>();
  items.forEach((item) => {
    const k = key(item);
    if (!k) return;
    counts.set(k, (counts.get(k) ?? 0) + 1);
  });
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

export const EditorHealthPanel: React.FC = () => {
  const { config } = useConfig();
  const { user } = useAuth();
  const baseURL = config?.routes?.admin || '/admin';

  const [events, setEvents] = useState<EditorEvent[] | null>(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState(false);

  const isAdmin = hasAdminRole((user as { role?: unknown } | null)?.role);

  useEffect(() => {
    if (!isAdmin) return;
    const since = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const params = new URLSearchParams({
      'where[createdAt][greater_than]': since,
      sort: '-createdAt',
      limit: '100',
      depth: '0',
    });
    fetch(`/api/editor-events?${params.toString()}`)
      .then((res) => res.json())
      .then((data: { docs?: EditorEvent[]; totalDocs?: number }) => {
        setEvents(data.docs ?? []);
        setTotal(data.totalDocs ?? data.docs?.length ?? 0);
      })
      .catch(() => setError(true));
  }, [isAdmin]);

  if (!isAdmin) return null;

  const errors = (events ?? []).filter((e) => e.type === 'error');
  const emptySearches = (events ?? []).filter((e) => e.type === 'empty-search');
  const byCollection = countBy(events ?? [], (e) => e.collectionSlug ?? undefined).slice(0, 5);

  const cardStyle: React.CSSProperties = {
    border: '1px solid var(--theme-elevation-150)',
    borderRadius: 4,
    padding: '1rem 1.25rem',
    marginTop: '2rem',
    background: 'var(--theme-elevation-50)',
  };
  const statRow: React.CSSProperties = { display: 'flex', gap: '2rem', flexWrap: 'wrap' };
  const stat: React.CSSProperties = { display: 'flex', flexDirection: 'column' };
  const statNum: React.CSSProperties = { fontSize: '1.75rem', fontWeight: 600, lineHeight: 1.1 };
  const statLabel: React.CSSProperties = {
    fontSize: '0.8rem',
    color: 'var(--theme-elevation-600)',
  };

  return (
    <section style={cardStyle} aria-label="Editor experience health">
      <h2 style={{ margin: '0 0 0.75rem', fontSize: '1.1rem' }}>
        Editor Health · last {WINDOW_DAYS} days
      </h2>

      {error && (
        <p style={{ color: 'var(--theme-error-500)', margin: 0 }}>Could not load editor events.</p>
      )}

      {!error && events === null && (
        <p style={{ margin: 0, color: 'var(--theme-elevation-600)' }}>Loading…</p>
      )}

      {!error && events !== null && (
        <>
          <div style={statRow}>
            <div style={stat}>
              <span style={statNum}>{total}</span>
              <span style={statLabel}>total events</span>
            </div>
            <div style={stat}>
              <span style={statNum}>{errors.length}</span>
              <span style={statLabel}>errors on save</span>
            </div>
            <div style={stat}>
              <span style={statNum}>{emptySearches.length}</span>
              <span style={statLabel}>empty searches</span>
            </div>
          </div>

          {byCollection.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <span style={statLabel}>Most affected areas</span>
              <ul style={{ margin: '0.35rem 0 0', paddingLeft: '1.1rem' }}>
                {byCollection.map(([slug, count]) => (
                  <li key={slug} style={{ fontSize: '0.9rem' }}>
                    {slug} — {count}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {total === 0 && (
            <p style={{ margin: '0.5rem 0 0', color: 'var(--theme-elevation-600)' }}>
              No editor errors or empty searches recorded. 🎉
            </p>
          )}

          <p style={{ margin: '1rem 0 0' }}>
            <a href={`${baseURL}/collections/editor-events`}>View all editor events →</a>
          </p>
        </>
      )}
    </section>
  );
};
