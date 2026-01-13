'use client';

import React, { useState } from 'react';
import type { CellComponentProps } from 'payload';

interface MediaData {
  url?: string;
  filename?: string;
  alt?: string;
}

/**
 * Custom cell component to display thumbnail images in list views.
 * Used for upload fields (media relationships) to show image previews.
 */
export const ThumbnailCell: React.FC<CellComponentProps> = ({ cellData }) => {
  const [imageError, setImageError] = useState(false);

  // cellData is the media object with url, filename, etc.
  if (!cellData || typeof cellData !== 'object') {
    return <span>—</span>;
  }

  const media = cellData as MediaData;
  
  // Get the URL - try different possible properties
  const url = media.url || media.filename;
  
  if (!url || imageError) {
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
        onError={() => setImageError(true)}
      />
      {media.filename && (
        <span style={{ fontSize: '12px', color: '#666' }}>
          {media.filename}
        </span>
      )}
    </div>
  );
};
