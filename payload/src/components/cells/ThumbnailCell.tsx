'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { DefaultCellComponentProps } from 'payload';
import { useListRelationships } from '@payloadcms/ui';
import './ThumbnailCell.css';

interface MediaData {
  id: string | number;
  url?: string;
  filename?: string;
  alt?: string;
  thumbnailURL?: string;
}

/**
 * Custom cell component to display thumbnail images in list views.
 * Used for upload fields (media relationships) to show image previews.
 *
 * Uses Payload's relationship provider to fetch media data since list views
 * don't populate relationships by default (depth=0).
 */
export const ThumbnailCell: React.FC<DefaultCellComponentProps> = ({ cellData, field }) => {
  const [imageError, setImageError] = useState(false);
  const { documents, getRelationships } = useListRelationships();
  const hasRequestedRef = useRef(false);

  // Get the relationTo collection from the upload field
  const relationTo = 'relationTo' in field ? field.relationTo : null;

  // cellData contains the media ID (string or number)
  const mediaId = cellData;

  // Request the relationship data when component mounts
  useEffect(() => {
    if (mediaId && relationTo && !hasRequestedRef.current) {
      getRelationships([
        {
          relationTo: relationTo as string,
          value: mediaId as string | number,
        },
      ]);
      hasRequestedRef.current = true;
    }
  }, [mediaId, relationTo, getRelationships]);

  // Look up the media document from the provider's cache
  const mediaData =
    relationTo && mediaId ? documents[relationTo as string]?.[String(mediaId)] : null;

  if (!mediaData || typeof mediaData !== 'object') {
    return <span className="thumbnail-cell-placeholder">—</span>;
  }

  const media = mediaData as MediaData;

  // Get the URL - prefer thumbnailURL for smaller file size, fallback to url
  const url = media.thumbnailURL || media.url;

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
