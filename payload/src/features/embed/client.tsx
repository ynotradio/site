'use client';

import React from 'react';
import { detectEmbedType } from './utils';

export interface EmbedComponentProps {
  url: string;
  caption?: string;
  hideCoverImage?: boolean;
}

export const EmbedComponent: React.FC<EmbedComponentProps> = ({ url, caption, hideCoverImage }) => {
  // Convert to proper embed URL if needed
  const { embedUrl, type } = detectEmbedType(url, { hideCoverImage });

  return (
    <div className={`embed-container embed-container--${type}`}>
      <div className="embed-wrapper">
        <iframe
          src={embedUrl}
          className="embed-wrapper__iframe"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={caption || 'Embedded content'}
        />
      </div>
      {caption && <p className="embed-caption">{caption}</p>}
    </div>
  );
};
