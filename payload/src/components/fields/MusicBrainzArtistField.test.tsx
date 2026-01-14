// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MusicBrainzArtistField } from './MusicBrainzArtistField';
import * as musicbrainzApi from '../../utils/musicbrainz-api';

// Mock the Payload UI hooks
vi.mock('@payloadcms/ui', () => ({
  useField: vi.fn(),
  useFormFields: vi.fn(),
}));

// Mock the MusicBrainz API
vi.mock('../../utils/musicbrainz-api', () => ({
  searchArtists: vi.fn(),
}));

const { useField, useFormFields } = await import('@payloadcms/ui');

describe('MusicBrainzArtistField', () => {
  const mockSetValue = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    vi.mocked(useField).mockReturnValue({
      value: '',
      setValue: mockSetValue,
    } as any);

    vi.mocked(useFormFields).mockReturnValue({
      value: 'Test Artist',
    } as any);
  });

  it('renders the search button', () => {
    render(<MusicBrainzArtistField path="musicbrainzId" />);

    expect(screen.getByText('Search MusicBrainz')).toBeInTheDocument();
    expect(
      screen.getByText(
        (content, element) => element?.textContent === 'Search for "Test Artist" on MusicBrainz',
      ),
    ).toBeInTheDocument();
  });

  it('displays selected artist when value exists', () => {
    vi.mocked(useField).mockReturnValue({
      value: 'artist-mbid-123',
      setValue: mockSetValue,
    } as any);

    vi.mocked(useFormFields).mockReturnValue({
      value: 'The Beatles',
    } as any);

    render(<MusicBrainzArtistField path="musicbrainzId" />);

    expect(screen.getByText('The Beatles')).toBeInTheDocument();
  });

  it('shows "Unknown Artist" when MBID exists but no name', () => {
    vi.mocked(useField).mockReturnValue({
      value: 'artist-mbid-123',
      setValue: mockSetValue,
    } as any);

    vi.mocked(useFormFields).mockReturnValue({
      value: undefined,
    } as any);

    render(<MusicBrainzArtistField path="musicbrainzId" />);

    expect(screen.getByText('Unknown Artist')).toBeInTheDocument();
  });

  it('performs search when button is clicked', async () => {
    const mockResults = [
      { id: '1', name: 'Artist One', score: 100 },
      { id: '2', name: 'Artist Two', score: 95 },
    ];

    vi.mocked(musicbrainzApi.searchArtists).mockResolvedValue(mockResults);

    render(<MusicBrainzArtistField path="musicbrainzId" />);

    const searchButton = screen.getByText('Search MusicBrainz');
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(musicbrainzApi.searchArtists).toHaveBeenCalledWith('Test Artist');
    });
  });

  it('displays search results', async () => {
    const mockResults = [
      { id: '1', name: 'The Beatles', score: 100 },
      { id: '2', name: 'The Beatnuts', score: 85 },
    ];

    vi.mocked(musicbrainzApi.searchArtists).mockResolvedValue(mockResults);

    render(<MusicBrainzArtistField path="musicbrainzId" />);

    const searchButton = screen.getByText('Search MusicBrainz');
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText('The Beatles')).toBeInTheDocument();
      expect(screen.getByText('The Beatnuts')).toBeInTheDocument();
    });
  });

  it('selects artist and updates value', async () => {
    const mockResults = [{ id: 'beatles-mbid', name: 'The Beatles', score: 100 }];

    vi.mocked(musicbrainzApi.searchArtists).mockResolvedValue(mockResults);

    render(<MusicBrainzArtistField path="musicbrainzId" />);

    const searchButton = screen.getByText('Search MusicBrainz');
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText('The Beatles')).toBeInTheDocument();
    });

    const resultItem = screen.getByText('The Beatles');
    fireEvent.click(resultItem);

    expect(mockSetValue).toHaveBeenCalledWith('beatles-mbid');
  });

  it('clears selection', async () => {
    vi.mocked(useField).mockReturnValue({
      value: 'artist-mbid-123',
      setValue: mockSetValue,
    } as any);

    vi.mocked(useFormFields).mockReturnValue({
      value: 'The Beatles',
    } as any);

    render(<MusicBrainzArtistField path="musicbrainzId" />);

    const clearButton = screen.getByText('Clear');
    fireEvent.click(clearButton);

    expect(mockSetValue).toHaveBeenCalledWith('');
  });

  it('handles search errors', async () => {
    vi.mocked(musicbrainzApi.searchArtists).mockRejectedValue(new Error('API Error'));

    render(<MusicBrainzArtistField path="musicbrainzId" />);

    const searchButton = screen.getByText('Search MusicBrainz');
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText('API Error')).toBeInTheDocument();
    });
  });

  it('shows loading state during search', async () => {
    let resolveSearch: (value: any) => void;
    const searchPromise = new Promise((resolve) => {
      resolveSearch = resolve;
    });

    vi.mocked(musicbrainzApi.searchArtists).mockReturnValue(searchPromise as any);

    render(<MusicBrainzArtistField path="musicbrainzId" />);

    const searchButton = screen.getByText('Search MusicBrainz');
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Searching...' })).toBeDisabled();
      expect(
        screen.getByText('Searching...', { selector: '.musicbrainz-loading' }),
      ).toBeInTheDocument();
    });

    resolveSearch!([]);
  });

  it('displays match score for search results', async () => {
    const mockResults = [
      { id: '1', name: 'The Beatles', score: 100 },
      { id: '2', name: 'Beatles Cover Band', score: 75 },
    ];

    vi.mocked(musicbrainzApi.searchArtists).mockResolvedValue(mockResults);

    render(<MusicBrainzArtistField path="musicbrainzId" />);

    const searchButton = screen.getByText('Search MusicBrainz');
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText('Match: 100%')).toBeInTheDocument();
      expect(screen.getByText('Match: 75%')).toBeInTheDocument();
    });
  });

  it('hides results when artist is selected', async () => {
    const mockResults = [{ id: '1', name: 'The Beatles', score: 100 }];

    vi.mocked(musicbrainzApi.searchArtists).mockResolvedValue(mockResults);

    render(<MusicBrainzArtistField path="musicbrainzId" />);

    const searchButton = screen.getByText('Search MusicBrainz');
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText('The Beatles')).toBeInTheDocument();
    });

    // Select the artist
    fireEvent.click(screen.getByText('The Beatles'));

    await waitFor(() => {
      expect(screen.queryByText('Select an Artist')).not.toBeInTheDocument();
    });
  });

  it('disables search button when no artist name', () => {
    vi.mocked(useFormFields).mockReturnValue({
      value: '',
    } as any);

    render(<MusicBrainzArtistField path="musicbrainzId" />);

    const searchButton = screen.getByText('Search MusicBrainz');

    expect(searchButton).toBeDisabled();
    expect(screen.getByText('Enter artist name first')).toBeInTheDocument();
  });
});
