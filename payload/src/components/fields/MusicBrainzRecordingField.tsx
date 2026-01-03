'use client';

/**
 * MusicBrainz Recording Picker Field Component
 * 
 * Custom field component for selecting a MusicBrainz recording (song)
 * and populating the musicbrainzId field
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useField, useFormFields } from '@payloadcms/ui';
import { searchRecordings, formatDuration, type MusicBrainzRecording } from '../../utils/musicbrainz-api';

import './MusicBrainzField.css';

interface MusicBrainzRecordingFieldProps {
  path: string;
}

export const MusicBrainzRecordingField: React.FC<MusicBrainzRecordingFieldProps> = ({ path }) => {
  const { value, setValue } = useField<string>({ path });
  
  // Try to get the song title from the form context to help with search
  const titleField = useFormFields(([fields]) => fields?.title);
  const songTitle = (titleField?.value as string | undefined) || '';
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MusicBrainzRecording[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedRecording, setSelectedRecording] = useState<MusicBrainzRecording | null>(null);
  
  // Track if we've initialized from the value to prevent unnecessary updates
  const initializedRef = useRef(false);

  // Load selected recording data if value exists (only once on initial load)
  useEffect(() => {
    if (value && !initializedRef.current) {
      setSelectedRecording({
        id: value,
        title: songTitle || 'Unknown Song',
        score: 100,
      });
      initializedRef.current = true;
    }
  }, [value, songTitle]);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      const results = await searchRecordings(searchQuery);
      setSearchResults(results);
      setShowResults(true);
      setIsSearching(false);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleSelectRecording = useCallback((recording: MusicBrainzRecording) => {
    setSelectedRecording(recording);
    setValue(recording.id);
    setShowResults(false);
    setSearchQuery('');
  }, [setValue]);

  const handleClear = useCallback(() => {
    setSelectedRecording(null);
    setValue('');
    setSearchQuery('');
    setSearchResults([]);
    initializedRef.current = false; // Reset initialization flag
  }, [setValue]);

  const handleUseSongTitle = useCallback(() => {
    if (songTitle) {
      setSearchQuery(songTitle);
    }
  }, [songTitle]);

  const getArtistName = (recording: MusicBrainzRecording): string => {
    if (recording['artist-credit'] && recording['artist-credit'].length > 0) {
      return recording['artist-credit'].map((ac) => ac.name).join(', ');
    }
    return 'Unknown Artist';
  };

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
              <div className="musicbrainz-artist">
                by {getArtistName(selectedRecording)}
              </div>
            )}
            {selectedRecording.disambiguation && (
              <div className="musicbrainz-disambiguation">{selectedRecording.disambiguation}</div>
            )}
            <div className="musicbrainz-id">
              MBID: <code>{value}</code>
            </div>
          </div>
          <button
            type="button"
            className="musicbrainz-clear-btn"
            onClick={handleClear}
          >
            Clear
          </button>
        </div>
      ) : (
        <div className="musicbrainz-search">
          <div className="musicbrainz-search-controls">
            <input
              type="text"
              className="musicbrainz-search-input"
              placeholder="Search MusicBrainz for a recording..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchResults.length > 0) {
                  setShowResults(true);
                }
              }}
            />
            {songTitle && (
              <button
                type="button"
                className="musicbrainz-use-title-btn"
                onClick={handleUseSongTitle}
              >
                Use Song Title
              </button>
            )}
          </div>
          {isSearching && <div className="musicbrainz-loading">Searching...</div>}
          {showResults && searchResults.length > 0 && (
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
                    {recording.length && (
                      <span className="musicbrainz-result-duration">
                        {formatDuration(recording.length)}
                      </span>
                    )}
                  </div>
                  {recording['artist-credit'] && (
                    <div className="musicbrainz-result-artist">
                      by {getArtistName(recording)}
                    </div>
                  )}
                  {recording.disambiguation && (
                    <div className="musicbrainz-result-disambiguation">
                      {recording.disambiguation}
                    </div>
                  )}
                  <div className="musicbrainz-result-score">
                    Score: {recording.score}
                  </div>
                </button>
              ))}
            </div>
          )}
          {showResults && searchResults.length === 0 && !isSearching && searchQuery && (
            <div className="musicbrainz-no-results">No recordings found</div>
          )}
        </div>
      )}
    </div>
  );
};
