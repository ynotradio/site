'use client';

import React from 'react';
import Link from 'next/link';

// Custom navigation links for Radio Tools
export const RadioToolsNavLinks: React.FC = () => (
  <div
    style={{
      padding: '16px 16px 8px 16px',
      borderTop: '1px solid #ddd',
      marginTop: '8px',
    }}
  >
    <div
      style={{
        fontSize: '11px',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        color: '#666',
        marginBottom: '8px',
      }}
    >
      Radio Tools
    </div>
    <Link
      href="/admin/dj-order"
      style={{
        display: 'block',
        padding: '8px 12px',
        fontSize: '14px',
        color: '#333',
        textDecoration: 'none',
        borderRadius: '4px',
        marginBottom: '4px',
      }}
    >
      🎧 DJ Order
    </Link>
    <Link
      href="/admin/show-cloner"
      style={{
        display: 'block',
        padding: '8px 12px',
        fontSize: '14px',
        color: '#333',
        textDecoration: 'none',
        borderRadius: '4px',
        marginBottom: '4px',
      }}
    >
      📋 Show Cloner
    </Link>
    <Link
      href="/admin/editor-guide"
      style={{
        display: 'block',
        padding: '8px 12px',
        fontSize: '14px',
        color: '#333',
        textDecoration: 'none',
        borderRadius: '4px',
      }}
    >
      📖 Editor Guide
    </Link>
  </div>
);

export default RadioToolsNavLinks;
