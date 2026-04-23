'use client';

import React, {
  useState, useCallback, useEffect, useRef,
} from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import { useField, useFormFields } from '@payloadcms/ui';
import {
  searchRecordings,
  formatDuration,
  getArtistCreditName,
  type MusicBrainzRecording,
} from '../../utils/musicbrainz-api';
import { useResolveArtistName } from './useResolveArtistName';

import './MusicBrainzField.css';

// Constants for default display when MBID exists but no metadata
const UNKNOWN_SONG_TITLE = 'Unknown Song';
const DEFAULT_SCORE = 100;

interface MusicBrainzRecordingFieldProps {
  path: string;
}

function formatRecordingInfo(recording: MusicBrainzRecording): string {
  const parts = [];
  if (recording['artist-credit']) {
    parts.push(`by ${getArtistCreditName(recording['artist-credit'])}`);
  }
  if (recording.disambiguation) {
    parts.push(`(${recording.disambiguation})`);
  }
  if (recording.length) {
    parts.push(`[${formatDuration(recording.length)}]`);
  }
  return parts.length > 0 ? ` ${parts.join(' ')}` : '';
}

export const MusicBrainzRecordingField: React.FC<MusicBrainzRecordingFieldProps> = ({ path }) => {
  const { value, setValue } = useField<string>({ path });

  const titleField = useFormFields(([fields]) => fields?.title);
  const artistField = useFormFields(([fields]) => fields?.artist);
  const songTitle = (titleField?.value as string | undefined) || '';

  const [searchResults, setSearchResults] = useState<MusicBrainzRecording[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedRecording, setSelectedRecording] = useState<MusicBrainzRecording | null>(null);
  const [error, setError] = useState<string | null>(null);

  const initializedRef = useRef(false);

  useEffect(() => {
    if (value && !initializedRef.current) {
      setSelectedRecording({
        id: value,
        title: songTitle || UNKNOWN_SONG_TITLE,
        score: DEFAULT_SCORE,
      });
      initializedRef.current = true;
    }
  }, [value, songTitle]);

  const resolveArtistName = useResolveArtistName(artistField?.value);

  const searchMusicBrainz = useCallback(async () => {
    if (!songTitle?.trim()) {
      setError('Please enter a song title first');
      return;
    }

    setIsSearching(true);
    setError(null);
    setShowResults(true);

    try {
      const artistName = await resolveArtistName();
      const results = await searchRecordings(songTitle, artistName || undefined);
      setSearchResults(results);
      if (results.length === 0) {
        setError('No results found');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search MusicBrainz');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [songTitle, resolveArtistName]);

  const handleSelectRecording = useCallback(
    (recording: MusicBrainzRecording) => {
      setSelectedRecording(recording);
      setValue(recording.id);
      setShowResults(false);
      setSearchResults([]);
    },
    [setValue],
  );

  const handleClear = useCallback(() => {
    setSelectedRecording(null);
    setValue('');
    setSearchResults([]);
    setShowResults(false);
    setError(null);
    initializedRef.current = false;
  }, [setValue]);

  return (
    <div className="musicbrainz-field">
      {selectedRecording && value ? (
        <div className="musicbrainz-selected">
          <div className="musicbrainz-selected-info">
            <div className="musicbrainz-selected-name">
              <strong>{selectedRecording.title}</strong>
              {selectedRecording.length && (
                <span className="musicbrainz-duration">
                  {formatDuration(selectedRecording.length)}
                </span>
              )}
            </div>
            {selectedRecording['artist-credit'] && (
              <div className="musicbrainz-artist">by {getArtistCreditName(selectedRecording['artist-credit'])}</div>
            )}
            {selectedRecording.disambiguation && (
              <div className="musicbrainz-disambiguation">{selectedRecording.disambiguation}</div>
            )}
            <div className="musicbrainz-id">
              MBID: <code>{value}</code>
            </div>
          </div>
          <div className="musicbrainz-selected-actions">
            <a
              href={`https://musicbrainz.org/recording/${value}`}
              target="_blank"
              rel="noopener noreferrer"
              className="musicbrainz-view-btn"
            >
              View on MusicBrainz
            </a>
            <button type="button" className="musicbrainz-clear-btn" onClick={handleClear}>
              Clear
            </button>
          </div>
        </div>
      ) : (
        <div className="musicbrainz-search-wrapper">
          <div className="musicbrainz-search-prompt">
            <div className="musicbrainz-search-text">
              {songTitle ? (
                <>
                  Search for <strong>"{songTitle}"</strong> on MusicBrainz
                </>
              ) : (
                'Enter song title first'
              )}
            </div>
            <button
              type="button"
              className="musicbrainz-search-btn"
              onClick={searchMusicBrainz}
              disabled={!songTitle?.trim() || isSearching}
            >
              {isSearching ? 'Searching...' : 'Search MusicBrainz'}
            </button>
          </div>

          {showResults && (
            <div className="musicbrainz-results-wrapper">
              {isSearching && <div className="musicbrainz-loading">Searching...</div>}

              {!isSearching && error && <div className="musicbrainz-error">{error}</div>}

              {!isSearching && !error && searchResults.length > 0 && (
                <>
                  <div className="musicbrainz-results-label">
                    Select a Recording ({searchResults.length} results)
                  </div>
                  <div className="musicbrainz-results">
                    {searchResults.map((recording) => (
                      <button
                        key={recording.id}
                        type="button"
                        className="musicbrainz-result-item"
                        onClick={() => handleSelectRecording(recording)}
                      >
                        <div className="musicbrainz-result-name">
                          <strong>{recording.title}</strong>
                          {formatRecordingInfo(recording)}
                        </div>
                        {recording.score && (
                          <div className="musicbrainz-result-score">Match: {recording.score}%</div>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
