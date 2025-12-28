import React, { useState, useCallback, useEffect } from 'react';
import {
  StringInputProps, set, unset, useFormValue, useClient,
} from 'sanity';
import {
  TextInput, Stack, Card, Button, Flex, Box, Text, Spinner, Label,
} from '@sanity/ui';
import { SearchIcon, LinkIcon, CheckmarkIcon } from '@sanity/icons';

interface MusicBrainzRelease {
  id: string;
  title: string;
  'artist-credit'?: Array<{
    name: string;
    artist: {
      name: string;
    };
  }>;
  date?: string;
  country?: string;
  'release-group'?: {
    'primary-type'?: string;
  };
  disambiguation?: string;
  score?: number;
}

interface MusicBrainzSearchResponse {
  releases: MusicBrainzRelease[];
  count: number;
}

export function MusicBrainzRecordInput(props: StringInputProps) {
  const {
    value, onChange, elementProps,
  } = props;
  const [searchResults, setSearchResults] = useState<MusicBrainzRelease[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [artistName, setArtistName] = useState<string | undefined>(undefined);

  const client = useClient({ apiVersion: '2024-01-01' });
  const albumTitle = useFormValue(['title']) as string | undefined;
  const artists = useFormValue(['artists']) as Array<{
    _ref?: string;
    _type?: string;
  }> | undefined;

  // Fetch the first artist's name when artist reference changes
  useEffect(() => {
    const fetchArtistName = async () => {
      const artistRef = artists?.[0]?._ref;
      if (artistRef) {
        try {
          const artist = await client.fetch<{ name: string }>(
            '*[_id == $id][0]{name}',
            { id: artistRef },
          );
          setArtistName(artist?.name);
        } catch (err) {
          setArtistName(undefined);
        }
      } else {
        setArtistName(undefined);
      }
    };

    fetchArtistName();
  }, [artists, client]);

  const searchMusicBrainz = useCallback(async () => {
    if (!albumTitle?.trim()) {
      setError('Please enter an album title first');
      return;
    }

    setIsSearching(true);
    setError(null);
    setShowResults(true);

    try {
      const queryParts = [albumTitle];
      if (artistName?.trim()) {
        queryParts.push(`artist:${artistName}`);
      }
      const query = queryParts.join(' AND ');

      const response = await fetch(
        `https://musicbrainz.org/ws/2/release/?query=${encodeURIComponent(query)}&fmt=json&limit=10`,
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
      setSearchResults(data.releases || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search MusicBrainz');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [albumTitle, artistName]);

  const handleSelectRelease = useCallback((release: MusicBrainzRelease) => {
    onChange(set(release.id));
    setShowResults(false);
  }, [onChange]);

  const handleClear = useCallback(() => {
    onChange(unset());
  }, [onChange]);

  const formatReleaseInfo = (release: MusicBrainzRelease) => {
    const parts = [release.title];
    if (release['artist-credit']?.[0]) {
      parts.push(`by ${release['artist-credit'][0].artist.name}`);
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
    if (release.country) {
      parts.push(release.country);
    }
    return parts.join(' ');
  };

  const getSearchText = () => {
    if (artistName && albumTitle) {
      return `"${albumTitle}" by ${artistName}`;
    }
    if (albumTitle) {
      return `"${albumTitle}"`;
    }
    return 'album title';
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
                href={`https://musicbrainz.org/release/${value}`}
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
            <Flex gap={2} align="center">
              <Box flex={1}>
                <Text size={1} muted>
                  {albumTitle ? (
                    <>
                      Search for {getSearchText()} on MusicBrainz
                      {!artistName && ' (artist name not available - searching by title only)'}
                    </>
                  ) : (
                    'Enter album title first'
                  )}
                </Text>
              </Box>
              <Button
                onClick={searchMusicBrainz}
                icon={SearchIcon}
                text="Search MusicBrainz"
                tone="primary"
                disabled={!albumTitle?.trim() || isSearching}
              />
            </Flex>
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
                    <Label size={1}>Select a Release ({searchResults.length} results)</Label>
                    <Stack space={2}>
                      {searchResults.map((release) => (
                        <Card
                          key={release.id}
                          padding={3}
                          radius={2}
                          shadow={1}
                          style={{ cursor: 'pointer' }}
                          tone="default"
                          onClick={() => handleSelectRelease(release)}
                        >
                          <Flex align="center" justify="space-between">
                            <Box flex={1}>
                              <Text size={2} weight="medium">
                                {formatReleaseInfo(release)}
                              </Text>
                              {release.score && (
                                <Text size={1} muted style={{ marginTop: 4 }}>
                                  Match: {release.score}%
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
