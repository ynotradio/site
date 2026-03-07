'use client';

import React, { useState } from 'react';
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

/**
 * Custom dashboard component that highlights top-level user pages
 * and organizes collections into primary and secondary groups.
 */
export const CustomDashboard: React.FC = () => {
  const { config } = useConfig();
  const baseURL = config?.routes?.admin || '/admin';
  const [secondaryOpen, setSecondaryOpen] = useState(false);

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
