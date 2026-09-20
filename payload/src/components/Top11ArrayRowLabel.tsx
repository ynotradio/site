'use client';

import React, { useEffect, useState } from 'react';
import { useRowLabel } from '@payloadcms/ui';

type SongRelation =
  | {
    artist?: { name?: string } | number | null;
    id?: number | string;
    label?: string;
    name?: string;
    title?: string;
    value?: number | string;
  }
  | number
  | string
  | null
  | undefined;

const songCache = new Map<string, SongRelation>();

const getSongId = (song: SongRelation): string | null => {
  if (typeof song === 'number' || typeof song === 'string') {
    return song.toString();
  }

  if (song && typeof song === 'object') {
    const id = song.id ?? song.value;
    return id === undefined ? null : id.toString();
  }

  return null;
};

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

  if (song.label) {
    return song.label;
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
  const [loadedSong, setLoadedSong] = useState<SongRelation>(data?.song);
  const songId = getSongId(data?.song);

  useEffect(() => {
    if (!songId || formatSongLabel(loadedSong)) {
      return undefined;
    }

    const cachedSong = songCache.get(songId);
    if (cachedSong) {
      setLoadedSong(cachedSong);
      return undefined;
    }

    let cancelled = false;
    fetch(`/api/songs/${songId}?depth=1`)
      .then((response) => (response.ok ? response.json() : null))
      .then((song: SongRelation | null) => {
        if (!cancelled && song) {
          songCache.set(songId, song);
          setLoadedSong(song);
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [loadedSong, songId]);

  const songLabel = formatSongLabel(loadedSong);
  const fallback = `${kind === 'entry' ? 'Entry' : 'Nominee'} ${String(rowNumber + 1).padStart(2, '0')}`;

  return <>{songLabel || fallback}</>;
};

export const Top11EntryRowLabel: React.FC = () => <Top11ArrayRowLabel kind="entry" />;
export const Top11NomineeRowLabel: React.FC = () => <Top11ArrayRowLabel kind="nominee" />;
