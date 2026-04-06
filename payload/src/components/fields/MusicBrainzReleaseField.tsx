'use client';

/**
 * MusicBrainz Release Picker Field Component
 *
 * Custom field component for selecting a MusicBrainz release (album)
 * and populating the musicbrainzId field
 */

import React, {
  useState, useCallback, useEffect, useRef,
} from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import { useField, useFormFields } from '@payloadcms/ui';
import { searchReleases, type MusicBrainzRelease } from '../../utils/musicbrainz-api';
import { useResolveArtistName } from './useResolveArtistName';

import './MusicBrainzField.css';

// Constants for default display when MBID exists but no metadata
const UNKNOWN_ALBUM_TITLE = 'Unknown Album';
const DEFAULT_SCORE = 100;

interface MusicBrainzReleaseFieldProps {
  path: string;
}

export const MusicBrainzReleaseField: React.FC<MusicBrainzReleaseFieldProps> = ({ path }) => {
  const { value, setValue } = useField<string>({ path });

  // Try to get the album title and artist from the form context
  const titleField = useFormFields(([fields]) => fields?.title);
  const artistField = useFormFields(([fields]) => fields?.artist);
  const albumTitle = (titleField?.value as string | undefined) || '';

  const [searchResults, setSearchResults] = useState<MusicBrainzRelease[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedRelease, setSelectedRelease] = useState<MusicBrainzRelease | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const resolveArtistName = useResolveArtistName(artistField?.value);

  const searchMusicBrainz = useCallback(async () => {
    if (!albumTitle?.trim()) {
      setError('Please enter an album title first');
      return;
    }

    setIsSearching(true);
    setError(null);
    setShowResults(true);

    try {
      // Include artist name if available for better results.
      // Relationship fields are commonly stored as IDs, so resolve when needed.
      const artistName = await resolveArtistName();
      const results = await searchReleases(albumTitle, artistName || undefined);
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
  }, [albumTitle, resolveArtistName]);

  const handleSelectRelease = useCallback(
    (release: MusicBrainzRelease) => {
      setSelectedRelease(release);
      setValue(release.id);
      setShowResults(false);
      setSearchResults([]);
    },
    [setValue],
  );

  const handleClear = useCallback(() => {
    setSelectedRelease(null);
    setValue('');
    setSearchResults([]);
    setShowResults(false);
    setError(null);
    initializedRef.current = false;
  }, [setValue]);

  const getArtistName = (release: MusicBrainzRelease): string => {
    if (release['artist-credit'] && release['artist-credit'].length > 0) {
      return release['artist-credit'].map((ac) => ac.name).join(', ');
    }
    return 'Unknown Artist';
  };

  const formatReleaseInfo = (release: MusicBrainzRelease) => {
    const parts = [];
    if (release['artist-credit']) {
      parts.push(`by ${getArtistName(release)}`);
    }
    if (release.disambiguation) {
      parts.push(`(${release.disambiguation})`);
    }
    if (release['release-group']?.['primary-type']) {
      parts.push(`[${release['release-group']['primary-type']}]`);
    }
    if (release.date) {
      const year = release.date.split('-')[0];
      parts.push(year);
    }
    return parts.length > 0 ? ` ${parts.join(' ')}` : '';
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
              <div className="musicbrainz-artist">by {getArtistName(selectedRelease)}</div>
            )}
            {selectedRelease.disambiguation && (
              <div className="musicbrainz-disambiguation">{selectedRelease.disambiguation}</div>
            )}
            <div className="musicbrainz-id">
              MBID: <code>{value}</code>
            </div>
            {selectedRelease.date && (
              <div className="musicbrainz-dates">Released: {selectedRelease.date}</div>
            )}
          </div>
          <div className="musicbrainz-selected-actions">
            <a
              href={`https://musicbrainz.org/release/${value}`}
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
              {albumTitle ? (
                <>
                  Search for <strong>"{albumTitle}"</strong> on MusicBrainz
                </>
              ) : (
                'Enter album title first'
              )}
            </div>
            <button
              type="button"
              className="musicbrainz-search-btn"
              onClick={searchMusicBrainz}
              disabled={!albumTitle?.trim() || isSearching}
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
                    Select a Release ({searchResults.length} results)
                  </div>
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
                          {formatReleaseInfo(release)}
                        </div>
                        {release.score && (
                          <div className="musicbrainz-result-score">Match: {release.score}%</div>
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
