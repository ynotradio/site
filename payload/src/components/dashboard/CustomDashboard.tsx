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
    description: 'Add or edit front-page stories. Set date ranges to control when they appear.',
    tool: { href: '/admin/story-order', label: 'Sort Order' },
  },
  {
    slug: 'songs',
    label: 'New Music',
    icon: '🎵',
    description: 'Add songs and toggle "Feature on New Music" to update the New Music page.',
  },
  {
    slug: 'cdoftheweek',
    label: 'CD of the Week',
    icon: '💿',
    description: 'Pick an album, write a review, and set the date. Only one should be current.',
    tool: { href: '/admin/cd-of-the-week-wizard', label: 'Wizard' },
  },
  {
    slug: 'concerts',
    label: 'Concerts',
    icon: '🎸',
    description: 'Add concert listings. Toggle "Featured" to promote shows on the homepage.',
  },
  {
    slug: 'ondemand',
    label: 'On Demand',
    icon: '🎧',
    description: 'Post archived recordings. Link audio files and tag the DJs and artists.',
  },
  {
    slug: 'shows',
    label: 'Shows',
    icon: '📻',
    description: 'Build the weekly schedule. Use Show Cloner to copy a week to new dates.',
    tool: { href: '/admin/show-cloner', label: 'Clone' },
  },
  {
    slug: 'djs',
    label: 'DJs',
    icon: '🎙️',
    description: 'Manage DJ profiles. Toggle "On Air" to show or hide them on the website.',
    tool: { href: '/admin/dj-order', label: 'Sort Order' },
  },
] as const;

const SECONDARY_COLLECTIONS = [
  {
    slug: 'records',
    label: 'Records',
    group: 'Music',
    description: 'Albums referenced by Songs and CD of the Week',
  },
  {
    slug: 'artists',
    label: 'Artists',
    group: 'Music',
    description: 'Bands and artists linked to Songs, Concerts, and Records',
  },
  {
    slug: 'people',
    label: 'People',
    group: 'People',
    description: 'Real people behind DJs and reviewers',
  },
  {
    slug: 'venues',
    label: 'Venues',
    group: 'Events',
    description: 'Concert venues linked to Concerts',
  },
  {
    slug: 'ads',
    label: 'Advertisements',
    group: 'Marketing',
    description: 'Site ads with date-based visibility',
  },
  {
    slug: 'media',
    label: 'Media Files',
    group: 'Content',
    description: 'Shared image library used across all collections',
  },
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
                {'tool' in collection && collection.tool && (
                  <Link href={collection.tool.href} className="primary-card-action">
                    {collection.tool.label}
                  </Link>
                )}
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
                <div className="secondary-card-description">{collection.description}</div>
                <div className="secondary-card-group">{collection.group}</div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
