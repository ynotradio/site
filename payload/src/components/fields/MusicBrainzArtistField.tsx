'use client';

/**
 * MusicBrainz Artist Picker Field Component
 * 
 * Custom field component for selecting a MusicBrainz artist
 * and populating the musicbrainzId field
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useField } from '@payloadcms/ui';
import { searchArtists, type MusicBrainzArtist } from '../../utils/musicbrainz-api';

import './MusicBrainzField.css';

interface MusicBrainzArtistFieldProps {
  path: string;
}

export const MusicBrainzArtistField: React.FC<MusicBrainzArtistFieldProps> = ({ path }) => {
  const { value, setValue } = useField<string>({ path });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MusicBrainzArtist[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState<MusicBrainzArtist | null>(null);

  // Load selected artist data if value exists
  useEffect(() => {
    if (value && !selectedArtist) {
      // We have an MBID but no artist data - this means it was set externally or on load
      // We can't fetch the full artist details without making an API call
      // So we'll just show the MBID
      setSelectedArtist({
        id: value,
        name: 'Unknown Artist',
        score: 100,
      });
    }
  }, [value, selectedArtist]);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      const results = await searchArtists(searchQuery);
      setSearchResults(results);
      setShowResults(true);
      setIsSearching(false);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleSelectArtist = useCallback((artist: MusicBrainzArtist) => {
    setSelectedArtist(artist);
    setValue(artist.id);
    setShowResults(false);
    setSearchQuery('');
  }, [setValue]);

  const handleClear = useCallback(() => {
    setSelectedArtist(null);
    setValue('');
    setSearchQuery('');
    setSearchResults([]);
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
          <input
            type="text"
            className="musicbrainz-search-input"
            placeholder="Search MusicBrainz for an artist..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => {
              if (searchResults.length > 0) {
                setShowResults(true);
              }
            }}
          />
          {isSearching && <div className="musicbrainz-loading">Searching...</div>}
          {showResults && searchResults.length > 0 && (
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
                    {artist.type && (
                      <span className="musicbrainz-result-type">{artist.type}</span>
                    )}
                  </div>
                  {artist.disambiguation && (
                    <div className="musicbrainz-result-disambiguation">
                      {artist.disambiguation}
                    </div>
                  )}
                  {artist['life-span']?.begin && (
                    <div className="musicbrainz-result-dates">
                      {artist['life-span'].begin}
                      {artist['life-span'].end && ` - ${artist['life-span'].end}`}
                    </div>
                  )}
                  <div className="musicbrainz-result-score">
                    Score: {artist.score}
                  </div>
                </button>
              ))}
            </div>
          )}
          {showResults && searchResults.length === 0 && !isSearching && searchQuery && (
            <div className="musicbrainz-no-results">No artists found</div>
          )}
        </div>
      )}
    </div>
  );
};
