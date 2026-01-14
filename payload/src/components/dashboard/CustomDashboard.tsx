'use client';

import React from 'react';
import { useConfig } from '@payloadcms/ui';
import Link from 'next/link';
import './CustomDashboard.css';

/**
 * Custom dashboard component that highlights top-level user pages
 * and organizes collections into primary and secondary groups.
 */
export const CustomDashboard: React.FC = () => {
  const { config } = useConfig();
  const baseURL = config?.routes?.admin || '/admin';

  // Primary collections that correspond to top-level user pages
  const primaryCollections = [
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
  ];

  // Secondary collections (supporting content)
  const secondaryCollections = [
    { slug: 'records', label: 'Records', group: 'Music' },
    { slug: 'artists', label: 'Artists', group: 'Music' },
    { slug: 'people', label: 'People', group: 'People' },
    { slug: 'venues', label: 'Venues', group: 'Events' },
    { slug: 'ads', label: 'Advertisements', group: 'Marketing' },
    // { slug: 'year-end-poll-results', label: 'Year End Polls', group: 'Polls & Contests' },
    { slug: 'media', label: 'Media Files', group: 'Content' },
  ];

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">Y-Not Radio CMS</h1>
      <p className="dashboard-subtitle">Welcome to the Y-Not Radio content management system</p>

      {/* Primary Collections - Large Cards */}
      <section className="section">
        <h2 className="section-title">Main Content Areas</h2>
        <div className="primary-grid">
          {primaryCollections.map((collection) => (
            <Link
              key={collection.slug}
              href={`${baseURL}/collections/${collection.slug}`}
              className="primary-card"
            >
              <div className="primary-card-icon">{collection.icon}</div>
              <h3 className="primary-card-label">{collection.label}</h3>
              <p className="primary-card-description">{collection.description}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Secondary Collections - Compact List */}
      <section>
        <h2 className="section-title">Supporting Content</h2>
        <div className="secondary-grid">
          {secondaryCollections.map((collection) => (
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
      </section>
    </div>
  );
};
