'use client';

import React from 'react';
import type { CellComponentProps } from 'payload';

/**
 * Custom cell component to display thumbnail images in list views.
 * Used for upload fields (media relationships) to show image previews.
 */
export const ThumbnailCell: React.FC<CellComponentProps> = ({ cellData }) => {
  // cellData is the media object with url, filename, etc.
  if (!cellData || typeof cellData !== 'object') {
    return <span>—</span>;
  }

  const media = cellData as any;
  
  // Get the URL - try different possible properties
  const url = media.url || media.filename;
  
  if (!url) {
    return <span>—</span>;
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <img
        src={url}
        alt={media.alt || media.filename || 'Thumbnail'}
        style={{
          width: '50px',
          height: '50px',
          objectFit: 'cover',
          borderRadius: '4px',
          border: '1px solid #e0e0e0',
        }}
        onError={(e) => {
          // Hide broken images
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
      {media.filename && (
        <span style={{ fontSize: '12px', color: '#666' }}>
          {media.filename}
        </span>
      )}
    </div>
  );
};
