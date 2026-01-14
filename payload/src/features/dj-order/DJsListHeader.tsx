'use client';

import React from 'react';

/**
 * Component displayed above the DJs collection list view.
 * Provides a link to the DJ Order tool styled as a Pill.
 */
export const DJsListHeader: React.FC = () => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      marginBottom: '8px',
      paddingRight: '16px',
    }}
  >
    <a
      href="/admin/dj-order"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 12px',
        fontSize: '14px',
        fontWeight: 500,
        color: '#fff',
        backgroundColor: '#0969da',
        borderRadius: '4px',
        textDecoration: 'none',
        lineHeight: '1.4',
      }}
    >
      DJ Sort Order
    </a>
  </div>
);

export default DJsListHeader;
