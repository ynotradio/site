'use client';

/**
 * MusicBrainz Artist Picker Field Component - Refactored
 * Follows Single Responsibility Principle with extracted hook
 */

import React, { useEffect } from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import { useField, useFormFields } from '@payloadcms/ui';
import { searchArtists, type MusicBrainzArtist } from '../../utils/musicbrainz-api';
import { useMusicBrainzSearch } from './hooks/useMusicBrainzSearch';

import './MusicBrainzField.css';

interface MusicBrainzArtistFieldProps {
  path: string;
}

const formatArtistInfo = (artist: MusicBrainzArtist): string => {
  const parts: string[] = [];
  if (artist.disambiguation) parts.push(`(${artist.disambiguation})`);
  if (artist.type) parts.push(`[${artist.type}]`);
  if (artist['life-span']?.begin) {
    const years = artist['life-span'].end
      ? `${artist['life-span'].begin}–${artist['life-span'].end}`
      : `${artist['life-span'].begin}–`;
    parts.push(years);
  }
  return parts.length > 0 ? ` ${parts.join(' ')}` : '';
};

export const MusicBrainzArtistField: React.FC<MusicBrainzArtistFieldProps> = ({ path }) => {
  const { value, setValue } = useField<string>({ path });

  // Try to get the artist name from the form context
  const nameField = useFormFields(([fields]) => fields?.name);
  const artistName = (nameField?.value as string | undefined) || '';

  const {
    searchResults,
    isSearching,
    showResults,
    selectedItem: selectedArtist,
    error,
    search,
    selectItem,
    clear,
    initializeFromValue,
  } = useMusicBrainzSearch<MusicBrainzArtist>({
    searchFunction: searchArtists,
  });

  // Initialize from existing value
  useEffect(() => {
    if (value) {
      initializeFromValue(value, artistName || 'Unknown Artist');
    }
  }, [value, artistName, initializeFromValue]);

  const handleSearch = () => {
    search(artistName);
  };

  const handleSelect = (artist: MusicBrainzArtist) => {
    selectItem(artist);
    setValue(artist.id);
  };

  const handleClear = () => {
    clear();
    setValue('');
  };

  return (
    <div className="musicbrainz-field">
      {selectedArtist && value ? (
        <div className="musicbrainz-selected">
          <div className="musicbrainz-selected-info">
            <div className="musicbrainz-selected-name">
              <strong>{selectedArtist.name}</strong>
              {selectedArtist.type && (
                <span className="musicbrainz-type">{selectedArtist.type}</span>
              )}
            </div>
            {selectedArtist.disambiguation && (
              <div className="musicbrainz-disambiguation">{selectedArtist.disambiguation}</div>
            )}
            <div className="musicbrainz-id">
              MBID: <code>{value}</code>
            </div>
            {selectedArtist['life-span']?.begin && (
              <div className="musicbrainz-dates">
                Active: {selectedArtist['life-span'].begin}
                {selectedArtist['life-span'].end && ` - ${selectedArtist['life-span'].end}`}
              </div>
            )}
          </div>
          <div className="musicbrainz-selected-actions">
            <a
              href={`https://musicbrainz.org/artist/${value}`}
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
              {artistName ? (
                <>
                  Search for <strong>"{artistName}"</strong> on MusicBrainz
                </>
              ) : (
                'Enter artist name first'
              )}
            </div>
            <button
              type="button"
              className="musicbrainz-search-btn"
              onClick={handleSearch}
              disabled={!artistName?.trim() || isSearching}
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
                    Select an Artist ({searchResults.length} results)
                  </div>
                  <div className="musicbrainz-results">
                    {searchResults.map((artist) => (
                      <button
                        key={artist.id}
                        type="button"
                        className="musicbrainz-result-item"
                        onClick={() => handleSelect(artist)}
                      >
                        <div className="musicbrainz-result-name">
                          <strong>{artist.name}</strong>
                          {formatArtistInfo(artist)}
                        </div>
                        {artist.score && (
                          <div className="musicbrainz-result-score">Match: {artist.score}%</div>
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
