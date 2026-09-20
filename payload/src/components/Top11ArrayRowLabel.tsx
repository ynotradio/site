'use client';

import React from 'react';
import { useRowLabel } from '@payloadcms/ui';

type SongRelation =
  | {
    artist?: { name?: string } | number | null;
    name?: string;
    title?: string;
  }
  | number
  | null
  | undefined;

type RowData = {
  song?: SongRelation;
};

type RowLabelProps = {
  kind: 'entry' | 'nominee';
};

const formatSongLabel = (song: SongRelation): string | null => {
  if (!song || typeof song !== 'object') {
    return null;
  }

  const artist = typeof song.artist === 'object' && song.artist ? song.artist.name : undefined;
  const title = song.title || song.name;

  if (artist && title) {
    return `${artist} — ${title}`;
  }

  return title || artist || null;
};

const Top11ArrayRowLabel: React.FC<RowLabelProps> = ({ kind }) => {
  const { data, rowNumber } = useRowLabel<RowData>();
  const songLabel = formatSongLabel(data?.song);
  const fallback = `${kind === 'entry' ? 'Entry' : 'Nominee'} ${String(rowNumber + 1).padStart(2, '0')}`;

  return <>{songLabel || fallback}</>;
};

export const Top11EntryRowLabel: React.FC = () => <Top11ArrayRowLabel kind="entry" />;
export const Top11NomineeRowLabel: React.FC = () => <Top11ArrayRowLabel kind="nominee" />;
