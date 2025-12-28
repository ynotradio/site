import React, { useState, useCallback } from 'react';
import { StringInputProps, set, unset } from 'sanity';
import {
  TextInput, Stack, Card, Button, Flex, Box, Text, Spinner, Label,
} from '@sanity/ui';
import { SearchIcon, LinkIcon, CheckmarkIcon } from '@sanity/icons';

interface MusicBrainzArtist {
  id: string;
  name: string;
  type?: string;
  disambiguation?: string;
  country?: string;
  'life-span'?: {
    begin?: string;
    end?: string;
  };
  score?: number;
}

interface MusicBrainzSearchResponse {
  artists: MusicBrainzArtist[];
  count: number;
}

export function MusicBrainzArtistInput(props: StringInputProps) {
  const { value, onChange, elementProps } = props;
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MusicBrainzArtist[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchMusicBrainz = useCallback(async (query: string) => {
    if (!query.trim()) return;

    setIsSearching(true);
    setError(null);
    setShowResults(true);

    try {
      const response = await fetch(
        `https://musicbrainz.org/ws/2/artist/?query=${encodeURIComponent(query)}&fmt=json&limit=10`,
        {
          headers: {
            'User-Agent': 'YNotRadio/1.0.0 (https://ynotradio.org)',
          },
        },
      );

      if (!response.ok) {
        throw new Error(`MusicBrainz API error: ${response.status}`);
      }

      const data: MusicBrainzSearchResponse = await response.json();
      setSearchResults(data.artists || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search MusicBrainz');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearch = useCallback(() => {
    searchMusicBrainz(searchQuery);
  }, [searchQuery, searchMusicBrainz]);

  const handleSelectArtist = useCallback((artist: MusicBrainzArtist) => {
    onChange(set(artist.id));
    setShowResults(false);
    setSearchQuery('');
  }, [onChange]);

  const handleClear = useCallback(() => {
    onChange(unset());
  }, [onChange]);

  const formatArtistInfo = (artist: MusicBrainzArtist) => {
    const parts = [artist.name];
    if (artist.disambiguation) parts.push(`(${artist.disambiguation})`);
    if (artist.type) parts.push(`[${artist.type}]`);
    if (artist.country) parts.push(artist.country);
    if (artist['life-span']?.begin) {
      const years = artist['life-span'].end
        ? `${artist['life-span'].begin}–${artist['life-span'].end}`
        : `${artist['life-span'].begin}–`;
      parts.push(years);
    }
    return parts.join(' ');
  };

  return (
    <Stack space={3}>
      {value ? (
        <Card padding={3} radius={2} shadow={1} tone="positive">
          <Flex align="center" gap={3}>
            <Box flex={1}>
              <Flex align="center" gap={2}>
                <Text size={1}>
                  <CheckmarkIcon />
                </Text>
                <Label size={1}>Linked to MusicBrainz</Label>
              </Flex>
              <Text size={1} muted style={{ fontFamily: 'monospace', marginTop: 4 }}>
                {value}
              </Text>
            </Box>
            <Flex gap={2}>
              <Button
                as="a"
                href={`https://musicbrainz.org/artist/${value}`}
                target="_blank"
                rel="noopener noreferrer"
                icon={LinkIcon}
                mode="ghost"
                text="View on MusicBrainz"
                fontSize={1}
              />
              <Button
                onClick={handleClear}
                tone="critical"
                mode="ghost"
                text="Clear"
                fontSize={1}
              />
            </Flex>
          </Flex>
        </Card>
      ) : (
        <>
          <Card padding={3} radius={2} border>
            <Stack space={3}>
              <Label size={1}>Search MusicBrainz for Artist</Label>
              <Flex gap={2}>
                <Box flex={1}>
                  <TextInput
                    placeholder="Enter artist name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.currentTarget.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSearch();
                      }
                    }}
                  />
                </Box>
                <Button
                  onClick={handleSearch}
                  icon={SearchIcon}
                  text="Search"
                  tone="primary"
                  disabled={!searchQuery.trim() || isSearching}
                />
              </Flex>
            </Stack>
          </Card>

          {showResults && (
            <Card padding={3} radius={2} border>
              <Stack space={3}>
                {isSearching && (
                  <Flex justify="center" padding={4}>
                    <Spinner />
                  </Flex>
                )}
                {!isSearching && error && (
                  <Card padding={3} tone="critical" radius={2}>
                    <Text size={1}>{error}</Text>
                  </Card>
                )}
                {!isSearching && !error && searchResults.length > 0 && (
                  <>
                    <Label size={1}>Select an Artist ({searchResults.length} results)</Label>
                    <Stack space={2}>
                      {searchResults.map((artist) => (
                        <Card
                          key={artist.id}
                          padding={3}
                          radius={2}
                          shadow={1}
                          style={{ cursor: 'pointer' }}
                          tone="default"
                          onClick={() => handleSelectArtist(artist)}
                        >
                          <Flex align="center" justify="space-between">
                            <Box flex={1}>
                              <Text size={2} weight="medium">
                                {formatArtistInfo(artist)}
                              </Text>
                              {artist.score && (
                                <Text size={1} muted style={{ marginTop: 4 }}>
                                  Match: {artist.score}%
                                </Text>
                              )}
                            </Box>
                            <Button
                              icon={LinkIcon}
                              mode="ghost"
                              fontSize={1}
                              text="Select"
                            />
                          </Flex>
                        </Card>
                      ))}
                    </Stack>
                  </>
                )}
                {!isSearching && !error && searchResults.length === 0 && (
                  <Card padding={3} tone="caution" radius={2}>
                    <Text size={1}>No results found</Text>
                  </Card>
                )}
              </Stack>
            </Card>
          )}

          <Card padding={3} radius={2} border>
            <Stack space={2}>
              <Label size={1}>Or enter MusicBrainz ID manually</Label>
              <TextInput
                {...elementProps}
                value={value || ''}
                placeholder="e.g., 5b11f4ce-a62d-471e-81fc-a69a8278c7da"
                onChange={(e) => (
                  onChange(e.currentTarget.value ? set(e.currentTarget.value) : unset())
                )}
              />
            </Stack>
          </Card>
        </>
      )}
    </Stack>
  );
}
