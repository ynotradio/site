'use client';

import React, { useState } from 'react';
import type { CellComponentProps } from 'payload';
import './ThumbnailCell.css';

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
    return <span className="thumbnail-cell-placeholder">—</span>;
  }

  const media = cellData as MediaData;

  // Get the URL - try different possible properties
  const url = media.url || media.filename;

  if (!url || imageError) {
    return <span className="thumbnail-cell-placeholder">—</span>;
  }

  return (
    <div className="thumbnail-cell-container">
      <img
        src={url}
        alt={media.alt || media.filename || 'Thumbnail'}
        className="thumbnail-cell-image"
        onError={() => setImageError(true)}
      />
      {media.filename && <span className="thumbnail-cell-filename">{media.filename}</span>}
    </div>
  );
};
