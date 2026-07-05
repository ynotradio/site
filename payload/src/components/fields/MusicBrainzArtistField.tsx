'use client';

import React, {
  useState, useCallback, useEffect, useRef,
} from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import { useField, useFormFields } from '@payloadcms/ui';
import { searchArtists, type MusicBrainzArtist } from '../../utils/musicbrainz-api';

import './MusicBrainzField.css';

// Constants for default display when MBID exists but no metadata
const UNKNOWN_ARTIST_NAME = 'Unknown Artist';
const DEFAULT_SCORE = 100;

interface MusicBrainzArtistFieldProps {
  path: string;
}

function formatArtistInfo(artist: MusicBrainzArtist): string {
  const parts = [];
  if (artist.disambiguation) parts.push(`(${artist.disambiguation})`);
  if (artist.type) parts.push(`[${artist.type}]`);
  if (artist['life-span']?.begin) {
    const years = artist['life-span'].end
      ? `${artist['life-span'].begin}–${artist['life-span'].end}`
      : `${artist['life-span'].begin}–`;
    parts.push(years);
  }
  return parts.length > 0 ? ` ${parts.join(' ')}` : '';
}

export const MusicBrainzArtistField: React.FC<MusicBrainzArtistFieldProps> = ({ path }) => {
  const { value, setValue } = useField<string>({ path });

  const nameField = useFormFields(([fields]) => fields?.name);
  const artistName = (nameField?.value as string | undefined) || '';

  const [searchResults, setSearchResults] = useState<MusicBrainzArtist[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState<MusicBrainzArtist | null>(null);
  const [error, setError] = useState<string | null>(null);

  const initializedRef = useRef(false);

  useEffect(() => {
    if (value && !initializedRef.current) {
      setSelectedArtist({
        id: value,
        name: artistName || UNKNOWN_ARTIST_NAME,
        score: DEFAULT_SCORE,
      });
      initializedRef.current = true;
    }
  }, [value, artistName]);

  const searchMusicBrainz = useCallback(async () => {
    if (!artistName?.trim()) {
      setError('Please enter an artist name first');
      return;
    }

    setIsSearching(true);
    setError(null);
    setShowResults(true);

    try {
      const results = await searchArtists(artistName);
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
  }, [artistName]);

  const handleSelectArtist = useCallback((artist: MusicBrainzArtist) => {
    setSelectedArtist(artist);
    setValue(artist.id);
    setShowResults(false);
    setSearchResults([]);
  }, [setValue]);

  const handleClear = useCallback(() => {
    setSelectedArtist(null);
    setValue('');
    setSearchResults([]);
    setShowResults(false);
    setError(null);
    initializedRef.current = false;
  }, [setValue]);

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
            <button
              type="button"
              className="musicbrainz-clear-btn"
              onClick={handleClear}
            >
              Clear
            </button>
          </div>
        </div>
      ) : (
        <div className="musicbrainz-search-wrapper">
          <div className="musicbrainz-search-prompt">
            <div className="musicbrainz-search-text">
              {artistName ? (
                <>Search for <strong>"{artistName}"</strong> on MusicBrainz</>
              ) : (
                'Enter artist name first'
              )}
            </div>
            <button
              type="button"
              className="musicbrainz-search-btn"
              onClick={searchMusicBrainz}
              disabled={!artistName?.trim() || isSearching}
            >
              {isSearching ? 'Searching...' : 'Search MusicBrainz'}
            </button>
          </div>

          {showResults && (
            <div className="musicbrainz-results-wrapper">
              {isSearching && <div className="musicbrainz-loading">Searching...</div>}

              {!isSearching && error && (
                <div className="musicbrainz-error">{error}</div>
              )}

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
                        onClick={() => handleSelectArtist(artist)}
                      >
                        <div className="musicbrainz-result-name">
                          <strong>{artist.name}</strong>
                          {formatArtistInfo(artist)}
                        </div>
                        {artist.score && (
                          <div className="musicbrainz-result-score">
                            Match: {artist.score}%
                          </div>
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
