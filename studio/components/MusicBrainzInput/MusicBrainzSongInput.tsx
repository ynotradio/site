import React, { useState, useCallback } from 'react';
import {
  StringInputProps, set, unset, useFormValue,
} from 'sanity';
import {
  TextInput, Stack, Card, Button, Flex, Box, Text, Spinner, Label,
} from '@sanity/ui';
import { SearchIcon, LinkIcon, CheckmarkIcon } from '@sanity/icons';

interface MusicBrainzRecording {
  id: string;
  title: string;
  'artist-credit'?: Array<{
    name: string;
    artist: {
      name: string;
    };
  }>;
  length?: number;
  disambiguation?: string;
  score?: number;
}

interface MusicBrainzSearchResponse {
  recordings: MusicBrainzRecording[];
  count: number;
}

export function MusicBrainzSongInput(props: StringInputProps) {
  const {
    value, onChange, elementProps,
  } = props;
  const [searchResults, setSearchResults] = useState<MusicBrainzRecording[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const songTitle = useFormValue(['title']) as string | undefined;
  const artists = useFormValue(['artists']) as Array<{ name?: string }> | undefined;

  const artistName = artists?.[0]?.name;

  const searchMusicBrainz = useCallback(async () => {
    if (!songTitle?.trim()) {
      setError('Please enter a song title first');
      return;
    }

    setIsSearching(true);
    setError(null);
    setShowResults(true);

    try {
      const queryParts = [songTitle];
      if (artistName) {
        queryParts.push(`artist:${artistName}`);
      }
      const query = queryParts.join(' AND ');

      const response = await fetch(
        `https://musicbrainz.org/ws/2/recording/?query=${encodeURIComponent(query)}&fmt=json&limit=10`,
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
      setSearchResults(data.recordings || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search MusicBrainz');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [songTitle, artistName]);

  const handleSelectRecording = useCallback((recording: MusicBrainzRecording) => {
    onChange(set(recording.id));
    setShowResults(false);
  }, [onChange]);

  const handleClear = useCallback(() => {
    onChange(unset());
  }, [onChange]);

  const formatRecordingInfo = (recording: MusicBrainzRecording) => {
    const parts = [recording.title];
    if (recording['artist-credit']?.[0]) {
      parts.push(`by ${recording['artist-credit'][0].artist.name}`);
    }
    if (recording.disambiguation) {
      parts.push(`(${recording.disambiguation})`);
    }
    if (recording.length) {
      const minutes = Math.floor(recording.length / 60000);
      const seconds = Math.floor((recording.length % 60000) / 1000);
      parts.push(`[${minutes}:${seconds.toString().padStart(2, '0')}]`);
    }
    return parts.join(' ');
  };

  const getSearchText = () => {
    if (artistName && songTitle) {
      return `"${songTitle}" by ${artistName}`;
    }
    if (songTitle) {
      return `"${songTitle}"`;
    }
    return 'song title';
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
                href={`https://musicbrainz.org/recording/${value}`}
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
                  {songTitle ? `Search for ${getSearchText()} on MusicBrainz` : 'Enter song title first'}
                </Text>
              </Box>
              <Button
                onClick={searchMusicBrainz}
                icon={SearchIcon}
                text="Search MusicBrainz"
                tone="primary"
                disabled={!songTitle?.trim() || isSearching}
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
                    <Label size={1}>Select a Recording ({searchResults.length} results)</Label>
                    <Stack space={2}>
                      {searchResults.map((recording) => (
                        <Card
                          key={recording.id}
                          padding={3}
                          radius={2}
                          shadow={1}
                          style={{ cursor: 'pointer' }}
                          tone="default"
                          onClick={() => handleSelectRecording(recording)}
                        >
                          <Flex align="center" justify="space-between">
                            <Box flex={1}>
                              <Text size={2} weight="medium">
                                {formatRecordingInfo(recording)}
                              </Text>
                              {recording.score && (
                                <Text size={1} muted style={{ marginTop: 4 }}>
                                  Match: {recording.score}%
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
