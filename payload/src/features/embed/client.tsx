'use client';

import React from 'react';
import { detectEmbedType } from './utils';

export interface EmbedComponentProps {
  url: string;
  caption?: string;
}

export const EmbedComponent: React.FC<EmbedComponentProps> = ({ url, caption }) => {
  // Convert to proper embed URL if needed
  const { embedUrl } = detectEmbedType(url);

  return (
    <div className="embed-container" style={{ margin: '1rem 0' }}>
      <div
        className="embed-wrapper"
        style={{
          position: 'relative',
          paddingBottom: '56.25%',
          height: 0,
          overflow: 'hidden',
          borderRadius: '8px',
        }}
      >
        <iframe
          src={embedUrl}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            border: 0,
          }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={caption || 'Embedded content'}
        />
      </div>
      {caption && (
        <p style={{
          fontSize: '0.875rem',
          color: '#666',
          marginTop: '0.5rem',
          fontStyle: 'italic',
        }}>
          {caption}
        </p>
      )}
    </div>
  );
};
