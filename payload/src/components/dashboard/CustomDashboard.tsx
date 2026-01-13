'use client';

import React from 'react';
import { useConfig } from '@payloadcms/ui';
import Link from 'next/link';

/**
 * Custom dashboard component that highlights top-level user pages
 * and organizes collections into primary and secondary groups.
 */
export const CustomDashboard: React.FC = () => {
  const { config } = useConfig();
  const baseURL = config?.routes?.admin || '/admin';

  // Primary collections that correspond to top-level user pages
  const primaryCollections = [
    { slug: 'posts', label: 'Stories (Home Page)', icon: '📰', description: 'Stories appearing on the front page' },
    { slug: 'songs', label: 'New Music', icon: '🎵', description: 'Songs featured on the New Music page' },
    { slug: 'cdoftheweek', label: 'CD of the Week', icon: '💿', description: 'Weekly album reviews' },
    { slug: 'concerts', label: 'Concerts', icon: '🎸', description: 'Upcoming concert listings' },
    { slug: 'ondemand', label: 'On Demand', icon: '🎧', description: 'On-demand recordings and archives' },
    { slug: 'djs', label: 'DJs', icon: '🎙️', description: 'DJ profiles and information' },
  ];

  // Secondary collections (supporting content)
  const secondaryCollections = [
    { slug: 'records', label: 'Records', group: 'Music' },
    { slug: 'artists', label: 'Artists', group: 'Music' },
    { slug: 'people', label: 'People', group: 'People' },
    { slug: 'venues', label: 'Venues', group: 'Events' },
    { slug: 'shows', label: 'Shows', group: 'Radio' },
    { slug: 'ads', label: 'Advertisements', group: 'Marketing' },
    { slug: 'year-end-poll-results', label: 'Year End Polls', group: 'Polls & Contests' },
    { slug: 'media', label: 'Media Files', group: 'Content' },
  ];

  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>
        Y-Not Radio CMS
      </h1>
      <p style={{ color: '#666', marginBottom: '2rem' }}>
        Welcome to the Y-Not Radio content management system
      </p>

      {/* Primary Collections - Large Cards */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: '600' }}>
          Main Content Areas
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {primaryCollections.map((collection) => (
            <Link
              key={collection.slug}
              href={`${baseURL}/collections/${collection.slug}`}
              style={{
                display: 'block',
                padding: '1.5rem',
                backgroundColor: 'white',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                textDecoration: 'none',
                color: 'inherit',
                transition: 'all 0.2s',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#3b82f6';
                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e0e0e0';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>
                {collection.icon}
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                {collection.label}
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#666' }}>
                {collection.description}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Secondary Collections - Compact List */}
      <section>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: '600' }}>
          Supporting Content
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '1rem',
          }}
        >
          {secondaryCollections.map((collection) => (
            <Link
              key={collection.slug}
              href={`${baseURL}/collections/${collection.slug}`}
              style={{
                display: 'block',
                padding: '1rem',
                backgroundColor: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                textDecoration: 'none',
                color: 'inherit',
                transition: 'all 0.2s',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
                e.currentTarget.style.borderColor = '#9ca3af';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f9fafb';
                e.currentTarget.style.borderColor = '#e5e7eb';
              }}
            >
              <div style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                {collection.label}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                {collection.group}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};
