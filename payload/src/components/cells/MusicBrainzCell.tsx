'use client';

import React from 'react';
import type { DefaultCellComponentProps } from 'payload';
import './MusicBrainzCell.css';

const MusicBrainzLogo: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    width="18"
    height="18"
    className="mb-cell-logo"
    aria-hidden="true"
  >
    <circle cx="10" cy="10" r="10" fill="#EB743B" />
    <text
      x="10"
      y="14"
      textAnchor="middle"
      fill="white"
      fontSize="8"
      fontWeight="bold"
      fontFamily="sans-serif"
    >
      MB
    </text>
  </svg>
);

type EntityType = 'artist' | 'release' | 'recording';

const makeMusicBrainzCell = (entityType: EntityType): React.FC<DefaultCellComponentProps> => {
  const Cell: React.FC<DefaultCellComponentProps> = ({ cellData }) => {
    if (!cellData || typeof cellData !== 'string' || cellData.trim() === '') {
      return <span className="mb-cell-empty" aria-hidden="true">—</span>;
    }

    const url = `https://musicbrainz.org/${entityType}/${cellData}`;

    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="mb-cell-link"
        aria-label="View on MusicBrainz"
        title={`View on MusicBrainz: ${cellData}`}
        onClick={(e) => e.stopPropagation()}
      >
        <MusicBrainzLogo />
      </a>
    );
  };

  return Cell;
};

export const MusicBrainzArtistCell = makeMusicBrainzCell('artist');
export const MusicBrainzReleaseCell = makeMusicBrainzCell('release');
export const MusicBrainzRecordingCell = makeMusicBrainzCell('recording');
