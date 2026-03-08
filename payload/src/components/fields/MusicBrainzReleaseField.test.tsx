// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MusicBrainzReleaseField } from './MusicBrainzReleaseField';
import * as musicbrainzApi from '../../utils/musicbrainz-api';

// Mock the Payload UI hooks
vi.mock('@payloadcms/ui', () => ({
  useField: vi.fn(),
  useFormFields: vi.fn(),
}));

// Mock the MusicBrainz API
vi.mock('../../utils/musicbrainz-api', () => ({
  searchReleases: vi.fn(),
}));

const { useField, useFormFields } = await import('@payloadcms/ui');

describe('MusicBrainzReleaseField', () => {
  const mockSetValue = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    vi.mocked(useField).mockReturnValue({
      value: '',
      setValue: mockSetValue,
    } as any);

    // Default: return title="Test Album" and artist={name: "Test Artist"}
    let callCount = 0;
    vi.mocked(useFormFields).mockImplementation(() => {
      const call = callCount;
      callCount += 1;
      if (call % 2 === 0) return { value: 'Test Album' } as any;
      return { value: { name: 'Test Artist' } } as any;
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the search button', () => {
    render(<MusicBrainzReleaseField path="musicbrainzId" />);

    expect(screen.getByText('Search MusicBrainz')).toBeInTheDocument();
    expect(
      screen.getByText(
        (content, element) => element?.textContent === 'Search for "Test Album" on MusicBrainz',
      ),
    ).toBeInTheDocument();
  });

  it('displays selected release when value exists', () => {
    vi.mocked(useField).mockReturnValue({
      value: 'release-mbid-123',
      setValue: mockSetValue,
    } as any);

    let callCount = 0;
    vi.mocked(useFormFields).mockImplementation(() => {
      const call = callCount;
      callCount += 1;
      if (call % 2 === 0) return { value: 'A Night at the Opera' } as any;
      return { value: { name: 'Queen' } } as any;
    });

    render(<MusicBrainzReleaseField path="musicbrainzId" />);

    expect(screen.getByText('A Night at the Opera')).toBeInTheDocument();
    expect(screen.getByText('View on MusicBrainz')).toBeInTheDocument();
  });

  it('shows "Unknown Album" when MBID exists but no title', () => {
    vi.mocked(useField).mockReturnValue({
      value: 'release-mbid-123',
      setValue: mockSetValue,
    } as any);

    let callCount = 0;
    vi.mocked(useFormFields).mockImplementation(() => {
      const call = callCount;
      callCount += 1;
      if (call % 2 === 0) return { value: '' } as any;
      return { value: { name: 'Test Artist' } } as any;
    });

    render(<MusicBrainzReleaseField path="musicbrainzId" />);

    expect(screen.getByText('Unknown Album')).toBeInTheDocument();
  });

  it('performs search when button is clicked', async () => {
    const mockResults = [
      { id: '1', title: 'Album One', score: 100 },
      { id: '2', title: 'Album Two', score: 95 },
    ];

    vi.mocked(musicbrainzApi.searchReleases).mockResolvedValue(mockResults);

    render(<MusicBrainzReleaseField path="musicbrainzId" />);

    const searchButton = screen.getByText('Search MusicBrainz');
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(musicbrainzApi.searchReleases).toHaveBeenCalledWith('Test Album', 'Test Artist');
    });
  });

  it('resolves artist name when relationship value is an ID', async () => {
    let callCount = 0;
    vi.mocked(useFormFields).mockImplementation(() => {
      const call = callCount;
      callCount += 1;
      if (call % 2 === 0) return { value: 'Test Album' } as any;
      return { value: 'artist-123' } as any;
    });

    const artistLookupMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ name: 'Resolved Artist' }),
    });
    vi.stubGlobal('fetch', artistLookupMock);

    vi.mocked(musicbrainzApi.searchReleases).mockResolvedValue([]);

    render(<MusicBrainzReleaseField path="musicbrainzId" />);

    const searchButton = screen.getByText('Search MusicBrainz');
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(artistLookupMock).toHaveBeenCalledWith('/api/artists/artist-123?depth=0');
      expect(musicbrainzApi.searchReleases).toHaveBeenCalledWith('Test Album', 'Resolved Artist');
    });
  });

  it('displays search results', async () => {
    const mockResults = [
      { id: '1', title: 'A Night at the Opera', score: 100 },
      { id: '2', title: 'A Day at the Races', score: 85 },
    ];

    vi.mocked(musicbrainzApi.searchReleases).mockResolvedValue(mockResults);

    render(<MusicBrainzReleaseField path="musicbrainzId" />);

    const searchButton = screen.getByText('Search MusicBrainz');
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText('A Night at the Opera')).toBeInTheDocument();
      expect(screen.getByText('A Day at the Races')).toBeInTheDocument();
    });
  });

  it('selects release and updates value', async () => {
    const mockResults = [{ id: 'release-mbid', title: 'A Night at the Opera', score: 100 }];

    vi.mocked(musicbrainzApi.searchReleases).mockResolvedValue(mockResults);

    render(<MusicBrainzReleaseField path="musicbrainzId" />);

    const searchButton = screen.getByText('Search MusicBrainz');
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText('A Night at the Opera')).toBeInTheDocument();
    });

    const resultItem = screen.getByText('A Night at the Opera');
    fireEvent.click(resultItem);

    expect(mockSetValue).toHaveBeenCalledWith('release-mbid');
  });

  it('clears selection', async () => {
    vi.mocked(useField).mockReturnValue({
      value: 'release-mbid-123',
      setValue: mockSetValue,
    } as any);

    let callCount = 0;
    vi.mocked(useFormFields).mockImplementation(() => {
      const call = callCount;
      callCount += 1;
      if (call % 2 === 0) return { value: 'A Night at the Opera' } as any;
      return { value: { name: 'Queen' } } as any;
    });

    render(<MusicBrainzReleaseField path="musicbrainzId" />);

    const clearButton = screen.getByText('Clear');
    fireEvent.click(clearButton);

    expect(mockSetValue).toHaveBeenCalledWith('');
  });

  it('handles search errors', async () => {
    vi.mocked(musicbrainzApi.searchReleases).mockRejectedValue(new Error('API Error'));

    render(<MusicBrainzReleaseField path="musicbrainzId" />);

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

    vi.mocked(musicbrainzApi.searchReleases).mockReturnValue(searchPromise as any);

    render(<MusicBrainzReleaseField path="musicbrainzId" />);

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
      { id: '1', title: 'A Night at the Opera', score: 100 },
      { id: '2', title: 'Opera Cover Album', score: 75 },
    ];

    vi.mocked(musicbrainzApi.searchReleases).mockResolvedValue(mockResults);

    render(<MusicBrainzReleaseField path="musicbrainzId" />);

    const searchButton = screen.getByText('Search MusicBrainz');
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText('Match: 100%')).toBeInTheDocument();
      expect(screen.getByText('Match: 75%')).toBeInTheDocument();
    });
  });

  it('hides results when release is selected', async () => {
    const mockResults = [{ id: '1', title: 'A Night at the Opera', score: 100 }];

    vi.mocked(musicbrainzApi.searchReleases).mockResolvedValue(mockResults);

    render(<MusicBrainzReleaseField path="musicbrainzId" />);

    const searchButton = screen.getByText('Search MusicBrainz');
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText('A Night at the Opera')).toBeInTheDocument();
    });

    // Select the release
    fireEvent.click(screen.getByText('A Night at the Opera'));

    await waitFor(() => {
      expect(screen.queryByText('Select a Release')).not.toBeInTheDocument();
    });
  });

  it('disables search button when no title', () => {
    let callCount = 0;
    vi.mocked(useFormFields).mockImplementation(() => {
      const call = callCount;
      callCount += 1;
      if (call % 2 === 0) return { value: '' } as any;
      return { value: { name: 'Test Artist' } } as any;
    });

    render(<MusicBrainzReleaseField path="musicbrainzId" />);

    const searchButton = screen.getByText('Search MusicBrainz');

    expect(searchButton).toBeDisabled();
    expect(screen.getByText('Enter album title first')).toBeInTheDocument();
  });

  it('displays release date if available', async () => {
    const mockResults = [
      { id: '1', title: 'A Night at the Opera', score: 100, date: '1975-11-21' },
    ];

    vi.mocked(musicbrainzApi.searchReleases).mockResolvedValue(mockResults);

    render(<MusicBrainzReleaseField path="musicbrainzId" />);

    const searchButton = screen.getByText('Search MusicBrainz');
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText(/1975/)).toBeInTheDocument();
    });
  });
});
