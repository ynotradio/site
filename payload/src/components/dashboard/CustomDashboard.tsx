'use client';

import React, { useEffect, useState } from 'react';
import { useConfig } from '@payloadcms/ui';
import Link from 'next/link';
import './CustomDashboard.css';

const PRIMARY_COLLECTIONS = [
  {
    slug: 'posts',
    label: 'Posts',
    icon: '📰',
    description: 'Front page features and custom pages',
  },
  {
    slug: 'songs',
    label: 'New Music',
    icon: '🎵',
    description: 'Songs featured on the New Music page',
  },
  {
    slug: 'cdoftheweek',
    label: 'CD of the Week',
    icon: '💿',
    description: 'Weekly album reviews',
  },
  {
    slug: 'concerts',
    label: 'Concerts',
    icon: '🎸',
    description: 'Upcoming concert listings',
  },
  {
    slug: 'ondemand',
    label: 'On Demand',
    icon: '🎧',
    description: 'On-demand recordings and archives',
  },
  {
    slug: 'shows',
    label: 'Shows',
    icon: '📻',
    description: 'Radio show schedule and information',
  },
  {
    slug: 'djs',
    label: 'DJs',
    icon: '🎙️',
    description: 'DJ profiles and information',
  },
] as const;

const SECONDARY_COLLECTIONS = [
  { slug: 'records', label: 'Records', group: 'Music' },
  { slug: 'artists', label: 'Artists', group: 'Music' },
  { slug: 'people', label: 'People', group: 'People' },
  { slug: 'venues', label: 'Venues', group: 'Events' },
  { slug: 'ads', label: 'Advertisements', group: 'Marketing' },
  { slug: 'media', label: 'Media Files', group: 'Content' },
] as const;

export interface MrmTournament {
  status: string;
  startDate: string;
  updatedAt: string;
}

/**
 * Returns true when the Modern Rock Madness tile should be shown:
 * - any tournament is currently active (status === 'active')
 * - any tournament is upcoming (startDate is in the future)
 * - any tournament completed within the last 30 days
 */
export const isMrmTileActive = (tournaments: MrmTournament[]): boolean => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  return tournaments.some((tournament) => {
    if (tournament.status === 'active') return true;
    if (new Date(tournament.startDate) > now) return true;
    return tournament.status === 'complete' && new Date(tournament.updatedAt) > thirtyDaysAgo;
  });
};

/**
 * Custom dashboard component that highlights top-level user pages
 * and organizes collections into primary and secondary groups.
 */
export const CustomDashboard: React.FC = () => {
  const { config } = useConfig();
  const baseURL = config?.routes?.admin || '/admin';
  const [secondaryOpen, setSecondaryOpen] = useState(false);
  const [mrmActive, setMrmActive] = useState(false);

  useEffect(() => {
    fetch('/api/modern-rock-madness-tournaments?limit=10&sort=-startDate')
      .then((res) => res.json())
      .then((data: { docs: MrmTournament[] }) => {
        setMrmActive(isMrmTileActive(data.docs ?? []));
      })
      .catch((err) => {
        // On fetch error, keep the tile hidden
        // eslint-disable-next-line no-console
        console.error('Failed to load tournament data for dashboard:', err);
      });
  }, []);

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">YNotRadio.net Admin</h1>

      <section className="section">
        <h2 className="section-title">Daily Content</h2>
        <div className="primary-grid">
          {PRIMARY_COLLECTIONS.map((collection) => (
            <div key={collection.slug} className="primary-card">
              <div className="primary-card-icon">{collection.icon}</div>
              <h3 className="primary-card-label">{collection.label}</h3>
              <p className="primary-card-description">{collection.description}</p>
              <div className="primary-card-actions">
                <Link
                  href={`${baseURL}/collections/${collection.slug}`}
                  className="primary-card-action"
                >
                  View All
                </Link>
                <Link
                  href={`${baseURL}/collections/${collection.slug}/create`}
                  className="primary-card-action primary-card-action--add"
                >
                  + Add New
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Special Events - only shown when at least one tile is active */}
      {mrmActive && (
        <section className="section">
          <h2 className="section-title">Special Events</h2>
          <div className="primary-grid">
            <div className="primary-card">
              <div className="primary-card-icon">🏆</div>
              <h3 className="primary-card-label">Modern Rock Madness</h3>
              <p className="primary-card-description">
                Annual tournament - manage brackets, matches, and results
              </p>
              <div className="primary-card-actions">
                <Link
                  href={`${baseURL}/collections/modern-rock-madness-tournaments`}
                  className="primary-card-action"
                >
                  View All
                </Link>
                <Link
                  href={`${baseURL}/collections/modern-rock-madness-matches`}
                  className="primary-card-action"
                >
                  Matches
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Secondary Collections - Collapsible accordion */}
      <section>
        <button
          type="button"
          className="section-toggle"
          onClick={() => setSecondaryOpen(!secondaryOpen)}
          aria-expanded={secondaryOpen}
        >
          <span
            className={`section-toggle-chevron ${secondaryOpen ? 'section-toggle-chevron--open' : ''}`}
          >
            ▸
          </span>
          <h2 className="section-title">Supporting Content</h2>
        </button>
        {secondaryOpen && (
          <div className="secondary-grid">
            {SECONDARY_COLLECTIONS.map((collection) => (
              <Link
                key={collection.slug}
                href={`${baseURL}/collections/${collection.slug}`}
                className="secondary-card"
              >
                <div className="secondary-card-label">{collection.label}</div>
                <div className="secondary-card-group">{collection.group}</div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
