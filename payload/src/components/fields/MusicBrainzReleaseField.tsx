'use client';

/**
 * MusicBrainz Release Picker Field Component
 * 
 * Custom field component for selecting a MusicBrainz release (album)
 * and populating the musicbrainzId field
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useField, useFormFields } from '@payloadcms/ui';
import { searchReleases, type MusicBrainzRelease } from '../../utils/musicbrainz-api';

import './MusicBrainzField.css';

// Constants for default display when MBID exists but no metadata
const UNKNOWN_ALBUM_TITLE = 'Unknown Album';
const DEFAULT_SCORE = 100;

interface MusicBrainzReleaseFieldProps {
  path: string;
}

export const MusicBrainzReleaseField: React.FC<MusicBrainzReleaseFieldProps> = ({ path }) => {
  const { value, setValue } = useField<string>({ path });
  
  // Try to get the album title from the form context to help with search
  const titleField = useFormFields(([fields]) => fields?.title);
  const albumTitle = (titleField?.value as string | undefined) || '';
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MusicBrainzRelease[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedRelease, setSelectedRelease] = useState<MusicBrainzRelease | null>(null);
  
  // Track if we've initialized from the value to prevent unnecessary updates
  const initializedRef = useRef(false);

  // Load selected release data if value exists (only once on initial load)
  useEffect(() => {
    if (value && !initializedRef.current) {
      setSelectedRelease({
        id: value,
        title: albumTitle || UNKNOWN_ALBUM_TITLE,
        score: DEFAULT_SCORE,
      });
      initializedRef.current = true;
    }
  }, [value, albumTitle]);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      const results = await searchReleases(searchQuery);
      setSearchResults(results);
      setShowResults(true);
      setIsSearching(false);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleSelectRelease = useCallback((release: MusicBrainzRelease) => {
    setSelectedRelease(release);
    setValue(release.id);
    setShowResults(false);
    setSearchQuery('');
  }, [setValue]);

  const handleClear = useCallback(() => {
    setSelectedRelease(null);
    setValue('');
    setSearchQuery('');
    setSearchResults([]);
    initializedRef.current = false; // Reset initialization flag
  }, [setValue]);

  const handleUseAlbumTitle = useCallback(() => {
    if (albumTitle) {
      setSearchQuery(albumTitle);
    }
  }, [albumTitle]);

  const getArtistName = (release: MusicBrainzRelease): string => {
    if (release['artist-credit'] && release['artist-credit'].length > 0) {
      return release['artist-credit'].map((ac) => ac.name).join(', ');
    }
    return 'Unknown Artist';
  };

  return (
    <div className="musicbrainz-field">
      {selectedRelease && value ? (
        <div className="musicbrainz-selected">
          <div className="musicbrainz-selected-info">
            <div className="musicbrainz-selected-name">
              <strong>{selectedRelease.title}</strong>
              {selectedRelease['release-group']?.['primary-type'] && (
                <span className="musicbrainz-type">
                  {selectedRelease['release-group']['primary-type']}
                </span>
              )}
            </div>
            {selectedRelease['artist-credit'] && (
              <div className="musicbrainz-artist">
                by {getArtistName(selectedRelease)}
              </div>
            )}
            {selectedRelease.disambiguation && (
              <div className="musicbrainz-disambiguation">{selectedRelease.disambiguation}</div>
            )}
            <div className="musicbrainz-id">
              MBID: <code>{value}</code>
            </div>
            {selectedRelease.date && (
              <div className="musicbrainz-dates">
                Released: {selectedRelease.date}
              </div>
            )}
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
              placeholder="Search MusicBrainz for a release..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchResults.length > 0) {
                  setShowResults(true);
                }
              }}
            />
            {albumTitle && (
              <button
                type="button"
                className="musicbrainz-use-title-btn"
                onClick={handleUseAlbumTitle}
              >
                Use Album Title
              </button>
            )}
          </div>
          {isSearching && <div className="musicbrainz-loading">Searching...</div>}
          {showResults && searchResults.length > 0 && (
            <div className="musicbrainz-results">
              {searchResults.map((release) => (
                <button
                  key={release.id}
                  type="button"
                  className="musicbrainz-result-item"
                  onClick={() => handleSelectRelease(release)}
                >
                  <div className="musicbrainz-result-name">
                    <strong>{release.title}</strong>
                    {release['release-group']?.['primary-type'] && (
                      <span className="musicbrainz-result-type">
                        {release['release-group']['primary-type']}
                      </span>
                    )}
                  </div>
                  {release['artist-credit'] && (
                    <div className="musicbrainz-result-artist">
                      by {getArtistName(release)}
                    </div>
                  )}
                  {release.disambiguation && (
                    <div className="musicbrainz-result-disambiguation">
                      {release.disambiguation}
                    </div>
                  )}
                  {release.date && (
                    <div className="musicbrainz-result-dates">
                      {release.date}
                    </div>
                  )}
                  <div className="musicbrainz-result-score">
                    Score: {release.score}
                  </div>
                </button>
              ))}
            </div>
          )}
          {showResults && searchResults.length === 0 && !isSearching && searchQuery && (
            <div className="musicbrainz-no-results">No releases found</div>
          )}
        </div>
      )}
    </div>
  );
};
