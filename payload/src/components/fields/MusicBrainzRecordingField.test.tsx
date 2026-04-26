// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MusicBrainzRecordingField } from './MusicBrainzRecordingField';
import * as musicbrainzApi from '../../utils/musicbrainz-api';

// Mock the Payload UI hooks
vi.mock('@payloadcms/ui', () => ({
  useField: vi.fn(),
  useFormFields: vi.fn(),
}));

// Mock the MusicBrainz API
vi.mock('../../utils/musicbrainz-api', () => ({
  searchRecordings: vi.fn(),
  formatDuration: vi.fn((ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }),
  getArtistCreditName: vi.fn((credits: Array<{ name: string }> | undefined) => {
    if (!credits?.length) return 'Unknown Artist';
    return credits.map((ac) => ac.name).join(', ');
  }),
}));

const { useField, useFormFields } = await import('@payloadcms/ui');

describe('MusicBrainzRecordingField', () => {
  const mockSetValue = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    vi.mocked(useField).mockReturnValue({
      value: '',
      setValue: mockSetValue,
    } as any);

    vi.mocked(useFormFields).mockImplementation((selector: any) => {
      const fields = { title: { value: 'Test Song' }, artist: { value: { name: 'Test Artist' } } };
      return selector([fields, null]);
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the search button', () => {
    render(<MusicBrainzRecordingField path="musicbrainzId" />);

    expect(screen.getByText('Search MusicBrainz')).toBeInTheDocument();
    expect(
      screen.getByText(
        (content, element) => element?.textContent === 'Search for "Test Song" on MusicBrainz',
      ),
    ).toBeInTheDocument();
  });

  it('displays selected recording when value exists', () => {
    vi.mocked(useField).mockReturnValue({
      value: 'recording-mbid-123',
      setValue: mockSetValue,
    } as any);

    let callCount = 0;
    vi.mocked(useFormFields).mockImplementation(() => {
      const call = callCount;
      callCount += 1;
      if (call % 2 === 0) return { value: 'Bohemian Rhapsody' } as any;
      return { value: { name: 'Queen' } } as any;
    });

    render(<MusicBrainzRecordingField path="musicbrainzId" />);

    expect(screen.getByText('Bohemian Rhapsody')).toBeInTheDocument();
    expect(screen.getByText('View on MusicBrainz')).toBeInTheDocument();
  });

  it('shows "Unknown Song" when MBID exists but no title', () => {
    vi.mocked(useField).mockReturnValue({
      value: 'recording-mbid-123',
      setValue: mockSetValue,
    } as any);

    let callCount = 0;
    vi.mocked(useFormFields).mockImplementation(() => {
      const call = callCount;
      callCount += 1;
      if (call % 2 === 0) return { value: '' } as any;
      return { value: { name: 'Test Artist' } } as any;
    });

    render(<MusicBrainzRecordingField path="musicbrainzId" />);

    expect(screen.getByText('Unknown Song')).toBeInTheDocument();
  });

  it('disables the search button when song title is empty', () => {
    vi.mocked(useFormFields).mockImplementation((selector: any) => {
      const fields = { title: { value: '' }, artist: { value: { name: 'Test Artist' } } };
      return selector([fields, null]);
    });

    render(<MusicBrainzRecordingField path="musicbrainzId" />);
    expect(screen.getByText('Search MusicBrainz').closest('button')).toBeDisabled();
  });

  it('disables the search button when song title is whitespace-only', () => {
    vi.mocked(useFormFields).mockImplementation((selector: any) => {
      const fields = { title: { value: '   ' }, artist: { value: { name: 'Test Artist' } } };
      return selector([fields, null]);
    });

    render(<MusicBrainzRecordingField path="musicbrainzId" />);
    expect(screen.getByText('Search MusicBrainz').closest('button')).toBeDisabled();
  });

  it('performs search when button is clicked', async () => {
    const mockResults = [
      { id: '1', title: 'Song One', score: 100 },
      { id: '2', title: 'Song Two', score: 95 },
    ];

    vi.mocked(musicbrainzApi.searchRecordings).mockResolvedValue(mockResults);

    render(<MusicBrainzRecordingField path="musicbrainzId" />);

    const searchButton = screen.getByText('Search MusicBrainz');
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(musicbrainzApi.searchRecordings).toHaveBeenCalledWith('Test Song', 'Test Artist');
    });
  });

  it('resolves artist name when relationship value is an ID', async () => {
    let callCount = 0;
    vi.mocked(useFormFields).mockImplementation(() => {
      const call = callCount;
      callCount += 1;
      if (call % 2 === 0) return { value: 'Test Song' } as any;
      return { value: 'artist-123' } as any;
    });

    const artistLookupMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ name: 'Resolved Artist' }),
    });
    vi.stubGlobal('fetch', artistLookupMock);

    vi.mocked(musicbrainzApi.searchRecordings).mockResolvedValue([]);

    render(<MusicBrainzRecordingField path="musicbrainzId" />);

    const searchButton = screen.getByText('Search MusicBrainz');
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(artistLookupMock).toHaveBeenCalledWith('/api/artists/artist-123?depth=0');
      expect(musicbrainzApi.searchRecordings).toHaveBeenCalledWith('Test Song', 'Resolved Artist');
    });
  });

  it('displays search results', async () => {
    const mockResults = [
      { id: '1', title: 'Bohemian Rhapsody', score: 100 },
      { id: '2', title: 'Bohemian Like You', score: 85 },
    ];

    vi.mocked(musicbrainzApi.searchRecordings).mockResolvedValue(mockResults);

    render(<MusicBrainzRecordingField path="musicbrainzId" />);

    const searchButton = screen.getByText('Search MusicBrainz');
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText('Bohemian Rhapsody')).toBeInTheDocument();
      expect(screen.getByText('Bohemian Like You')).toBeInTheDocument();
    });
  });

  it('selects recording and updates value', async () => {
    const mockResults = [{ id: 'recording-mbid', title: 'Bohemian Rhapsody', score: 100 }];

    vi.mocked(musicbrainzApi.searchRecordings).mockResolvedValue(mockResults);

    render(<MusicBrainzRecordingField path="musicbrainzId" />);

    const searchButton = screen.getByText('Search MusicBrainz');
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText('Bohemian Rhapsody')).toBeInTheDocument();
    });

    const resultItem = screen.getByText('Bohemian Rhapsody');
    fireEvent.click(resultItem);

    expect(mockSetValue).toHaveBeenCalledWith('recording-mbid');
  });

  it('clears selection', async () => {
    vi.mocked(useField).mockReturnValue({
      value: 'recording-mbid-123',
      setValue: mockSetValue,
    } as any);

    vi.mocked(useFormFields)
      .mockReturnValueOnce({ value: 'Bohemian Rhapsody' } as any)
      .mockReturnValueOnce({ value: { name: 'Queen' } } as any);

    render(<MusicBrainzRecordingField path="musicbrainzId" />);

    const clearButton = screen.getByText('Clear');
    fireEvent.click(clearButton);

    expect(mockSetValue).toHaveBeenCalledWith('');
  });

  it('handles search errors', async () => {
    vi.mocked(musicbrainzApi.searchRecordings).mockRejectedValue(new Error('API Error'));

    render(<MusicBrainzRecordingField path="musicbrainzId" />);

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

    vi.mocked(musicbrainzApi.searchRecordings).mockReturnValue(searchPromise as any);

    render(<MusicBrainzRecordingField path="musicbrainzId" />);

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
      { id: '1', title: 'Bohemian Rhapsody', score: 100 },
      { id: '2', title: 'Bohemian Cover', score: 75 },
    ];

    vi.mocked(musicbrainzApi.searchRecordings).mockResolvedValue(mockResults);

    render(<MusicBrainzRecordingField path="musicbrainzId" />);

    const searchButton = screen.getByText('Search MusicBrainz');
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText('Match: 100%')).toBeInTheDocument();
      expect(screen.getByText('Match: 75%')).toBeInTheDocument();
    });
  });

  it('hides results when recording is selected', async () => {
    const mockResults = [{ id: '1', title: 'Bohemian Rhapsody', score: 100 }];

    vi.mocked(musicbrainzApi.searchRecordings).mockResolvedValue(mockResults);

    render(<MusicBrainzRecordingField path="musicbrainzId" />);

    const searchButton = screen.getByText('Search MusicBrainz');
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText('Bohemian Rhapsody')).toBeInTheDocument();
    });

    // Select the recording
    fireEvent.click(screen.getByText('Bohemian Rhapsody'));

    await waitFor(() => {
      expect(screen.queryByText('Select a Recording')).not.toBeInTheDocument();
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

    render(<MusicBrainzRecordingField path="musicbrainzId" />);

    const searchButton = screen.getByText('Search MusicBrainz');

    expect(searchButton).toBeDisabled();
    expect(screen.getByText('Enter song title first')).toBeInTheDocument();
  });

  it('displays recording duration if available', async () => {
    const mockResults = [{ id: '1', title: 'Bohemian Rhapsody', score: 100, length: 354000 }];

    vi.mocked(musicbrainzApi.searchRecordings).mockResolvedValue(mockResults);

    render(<MusicBrainzRecordingField path="musicbrainzId" />);

    const searchButton = screen.getByText('Search MusicBrainz');
    fireEvent.click(searchButton);

    await waitFor(() => {
      // Duration is shown in square brackets in search results
      expect(screen.getByText(/\[5:54\]/)).toBeInTheDocument();
    });
  });

  describe('resolveArtistName edge cases', () => {
    it('resolves artist name when rawArtist has an id property', async () => {
      let callCount = 0;
      vi.mocked(useFormFields).mockImplementation(() => {
        const call = callCount;
        callCount += 1;
        if (call % 2 === 0) return { value: 'Test Song' } as any;
        return { value: { id: 'artist-doc-id' } } as any;
      });

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ name: 'Artist From ID' }),
      });
      vi.stubGlobal('fetch', fetchMock);
      vi.mocked(musicbrainzApi.searchRecordings).mockResolvedValue([]);

      render(<MusicBrainzRecordingField path="musicbrainzId" />);
      fireEvent.click(screen.getByText('Search MusicBrainz'));

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith('/api/artists/artist-doc-id?depth=0');
        expect(musicbrainzApi.searchRecordings).toHaveBeenCalledWith('Test Song', 'Artist From ID');
      });
    });

    it('resolves artist name when rawArtist.value is an object with id', async () => {
      let callCount = 0;
      vi.mocked(useFormFields).mockImplementation(() => {
        const call = callCount;
        callCount += 1;
        if (call % 2 === 0) return { value: 'Test Song' } as any;
        return { value: { value: { id: 'nested-artist-id' } } } as any;
      });

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ name: 'Nested Artist' }),
      });
      vi.stubGlobal('fetch', fetchMock);
      vi.mocked(musicbrainzApi.searchRecordings).mockResolvedValue([]);

      render(<MusicBrainzRecordingField path="musicbrainzId" />);
      fireEvent.click(screen.getByText('Search MusicBrainz'));

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith('/api/artists/nested-artist-id?depth=0');
        expect(musicbrainzApi.searchRecordings).toHaveBeenCalledWith('Test Song', 'Nested Artist');
      });
    });

    it('resolves artist name directly when rawArtist.value has a name', async () => {
      let callCount = 0;
      vi.mocked(useFormFields).mockImplementation(() => {
        const call = callCount;
        callCount += 1;
        if (call % 2 === 0) return { value: 'Test Song' } as any;
        return { value: { value: { name: 'Direct Name Artist' } } } as any;
      });

      const fetchMock = vi.fn();
      vi.stubGlobal('fetch', fetchMock);
      vi.mocked(musicbrainzApi.searchRecordings).mockResolvedValue([]);

      render(<MusicBrainzRecordingField path="musicbrainzId" />);
      fireEvent.click(screen.getByText('Search MusicBrainz'));

      await waitFor(() => {
        expect(musicbrainzApi.searchRecordings).toHaveBeenCalledWith(
          'Test Song',
          'Direct Name Artist',
        );
      });
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('searches without artist when artist field is empty', async () => {
      let callCount = 0;
      vi.mocked(useFormFields).mockImplementation(() => {
        const call = callCount;
        callCount += 1;
        if (call % 2 === 0) return { value: 'Test Song' } as any;
        return { value: null } as any;
      });

      vi.mocked(musicbrainzApi.searchRecordings).mockResolvedValue([]);

      render(<MusicBrainzRecordingField path="musicbrainzId" />);
      fireEvent.click(screen.getByText('Search MusicBrainz'));

      await waitFor(() => {
        expect(musicbrainzApi.searchRecordings).toHaveBeenCalledWith('Test Song', undefined);
      });
    });

    it('searches without artist when fetch returns non-ok response', async () => {
      let callCount = 0;
      vi.mocked(useFormFields).mockImplementation(() => {
        const call = callCount;
        callCount += 1;
        if (call % 2 === 0) return { value: 'Test Song' } as any;
        return { value: 'artist-fetch-fail-id' } as any;
      });

      const fetchMock = vi.fn().mockResolvedValue({ ok: false });
      vi.stubGlobal('fetch', fetchMock);
      vi.mocked(musicbrainzApi.searchRecordings).mockResolvedValue([]);

      render(<MusicBrainzRecordingField path="musicbrainzId" />);
      fireEvent.click(screen.getByText('Search MusicBrainz'));

      await waitFor(() => {
        expect(musicbrainzApi.searchRecordings).toHaveBeenCalledWith('Test Song', undefined);
      });
    });
  });

  describe('formatRecordingInfo in search results', () => {
    it('displays artist credit and disambiguation in result items', async () => {
      const mockResults = [
        {
          id: '1',
          title: 'Test Song',
          score: 100,
          'artist-credit': [{ name: 'Test Artist', artist: { id: 'a1' } }],
          disambiguation: 'live version',
        },
      ];

      vi.mocked(musicbrainzApi.searchRecordings).mockResolvedValue(mockResults);

      render(<MusicBrainzRecordingField path="musicbrainzId" />);
      fireEvent.click(screen.getByText('Search MusicBrainz'));

      await waitFor(() => {
        expect(screen.getByText(/by Test Artist/)).toBeInTheDocument();
        expect(screen.getByText(/\(live version\)/)).toBeInTheDocument();
      });
    });

    it('shows "Unknown Artist" when artist-credit is an empty array', async () => {
      const mockResults = [
        {
          id: '1',
          title: 'Test Song',
          score: 100,
          'artist-credit': [],
        },
      ];

      vi.mocked(musicbrainzApi.searchRecordings).mockResolvedValue(mockResults);

      render(<MusicBrainzRecordingField path="musicbrainzId" />);
      fireEvent.click(screen.getByText('Search MusicBrainz'));

      await waitFor(() => {
        // artist-credit is truthy (non-null array) but empty, so getArtistName returns 'Unknown Artist'
        expect(screen.getByText(/by Unknown Artist/)).toBeInTheDocument();
      });
    });
  });
});
