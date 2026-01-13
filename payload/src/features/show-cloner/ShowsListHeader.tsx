'use client';

import React from 'react';

/**
 * Component displayed above the Shows collection list view.
 * Provides a link to the Show Cloner tool.
 */
export const ShowsListHeader: React.FC = () => (
  <div
    style={{
      padding: '16px 24px',
      marginBottom: '16px',
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
      border: '1px solid #e9ecef',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}
  >
    <div>
      <h3 style={{
        margin: 0, fontSize: '14px', fontWeight: 600, color: '#333',
      }}>
        📋 Show Management Tools
      </h3>
      <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#666' }}>
        Use the Show Cloner to copy an entire week of programming to a new date range.
      </p>
    </div>
    <a
      href="/admin/show-cloner"
      style={{
        padding: '8px 16px',
        fontSize: '14px',
        fontWeight: 500,
        color: '#fff',
        backgroundColor: '#3182ce',
        border: 'none',
        borderRadius: '4px',
        textDecoration: 'none',
        display: 'inline-block',
      }}
    >
      Open Show Cloner →
    </a>
  </div>
);

export default ShowsListHeader;
