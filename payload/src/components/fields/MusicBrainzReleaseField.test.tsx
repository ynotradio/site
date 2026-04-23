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
  getArtistCreditName: vi.fn((credits: Array<{ name: string }> | undefined) => {
    if (!credits?.length) return 'Unknown Artist';
    return credits.map((ac) => ac.name).join(', ');
  }),
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

    vi.mocked(useFormFields).mockImplementation((selector: any) => {
      const fields = { title: { value: 'Test Album' }, artist: { value: { name: 'Test Artist' } } };
      return selector([fields, null]);
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

  describe('resolveArtistName edge cases', () => {
    it('passes undefined artist when artist field is null', async () => {
      vi.mocked(useFormFields).mockReturnValue(null as any);
      vi.mocked(musicbrainzApi.searchReleases).mockResolvedValue([]);

      // Re-setup title mock since we override useFormFields for all calls
      let callCount = 0;
      vi.mocked(useFormFields).mockImplementation(() => {
        const call = callCount;
        callCount += 1;
        if (call % 2 === 0) return { value: 'Test Album' } as any;
        return null as any;
      });

      render(<MusicBrainzReleaseField path="musicbrainzId" />);
      fireEvent.click(screen.getByText('Search MusicBrainz'));

      await waitFor(() => {
        expect(musicbrainzApi.searchReleases).toHaveBeenCalledWith('Test Album', undefined);
      });
    });

    it('resolves artist name from object with id field', async () => {
      let callCount = 0;
      vi.mocked(useFormFields).mockImplementation(() => {
        const call = callCount;
        callCount += 1;
        if (call % 2 === 0) return { value: 'Test Album' } as any;
        return { value: { id: 'artist-object-id' } } as any;
      });

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ name: 'Artist From Object ID' }),
      });
      vi.stubGlobal('fetch', fetchMock);
      vi.mocked(musicbrainzApi.searchReleases).mockResolvedValue([]);

      render(<MusicBrainzReleaseField path="musicbrainzId" />);
      fireEvent.click(screen.getByText('Search MusicBrainz'));

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith('/api/artists/artist-object-id?depth=0');
        expect(musicbrainzApi.searchReleases).toHaveBeenCalledWith(
          'Test Album',
          'Artist From Object ID',
        );
      });
    });

    it('resolves artist name from nested value.name without fetching', async () => {
      let callCount = 0;
      vi.mocked(useFormFields).mockImplementation(() => {
        const call = callCount;
        callCount += 1;
        if (call % 2 === 0) return { value: 'Test Album' } as any;
        return { value: { value: { name: 'Nested Artist Name' } } } as any;
      });

      vi.mocked(musicbrainzApi.searchReleases).mockResolvedValue([]);

      render(<MusicBrainzReleaseField path="musicbrainzId" />);
      fireEvent.click(screen.getByText('Search MusicBrainz'));

      await waitFor(() => {
        expect(musicbrainzApi.searchReleases).toHaveBeenCalledWith(
          'Test Album',
          'Nested Artist Name',
        );
      });
    });

    it('resolves artist by fetching from nested value.id', async () => {
      let callCount = 0;
      vi.mocked(useFormFields).mockImplementation(() => {
        const call = callCount;
        callCount += 1;
        if (call % 2 === 0) return { value: 'Test Album' } as any;
        return { value: { value: { id: 'nested-artist-id' } } } as any;
      });

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ name: 'Nested ID Artist' }),
      });
      vi.stubGlobal('fetch', fetchMock);
      vi.mocked(musicbrainzApi.searchReleases).mockResolvedValue([]);

      render(<MusicBrainzReleaseField path="musicbrainzId" />);
      fireEvent.click(screen.getByText('Search MusicBrainz'));

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith('/api/artists/nested-artist-id?depth=0');
        expect(musicbrainzApi.searchReleases).toHaveBeenCalledWith('Test Album', 'Nested ID Artist');
      });
    });

    it('resolves artist by fetching from nested value as string', async () => {
      let callCount = 0;
      vi.mocked(useFormFields).mockImplementation(() => {
        const call = callCount;
        callCount += 1;
        if (call % 2 === 0) return { value: 'Test Album' } as any;
        return { value: { value: 'nested-string-artist-id' } } as any;
      });

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ name: 'Nested String Artist' }),
      });
      vi.stubGlobal('fetch', fetchMock);
      vi.mocked(musicbrainzApi.searchReleases).mockResolvedValue([]);

      render(<MusicBrainzReleaseField path="musicbrainzId" />);
      fireEvent.click(screen.getByText('Search MusicBrainz'));

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith('/api/artists/nested-string-artist-id?depth=0');
        expect(musicbrainzApi.searchReleases).toHaveBeenCalledWith(
          'Test Album',
          'Nested String Artist',
        );
      });
    });

    it('returns empty artist when nested value has no id or name', async () => {
      let callCount = 0;
      vi.mocked(useFormFields).mockImplementation(() => {
        const call = callCount;
        callCount += 1;
        if (call % 2 === 0) return { value: 'Test Album' } as any;
        return { value: { value: {} } } as any;
      });

      vi.mocked(musicbrainzApi.searchReleases).mockResolvedValue([]);

      render(<MusicBrainzReleaseField path="musicbrainzId" />);
      fireEvent.click(screen.getByText('Search MusicBrainz'));

      await waitFor(() => {
        expect(musicbrainzApi.searchReleases).toHaveBeenCalledWith('Test Album', undefined);
      });
    });

    it('returns empty artist when fetch returns not-ok', async () => {
      let callCount = 0;
      vi.mocked(useFormFields).mockImplementation(() => {
        const call = callCount;
        callCount += 1;
        if (call % 2 === 0) return { value: 'Test Album' } as any;
        return { value: { id: 'bad-artist-id' } } as any;
      });

      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
      vi.mocked(musicbrainzApi.searchReleases).mockResolvedValue([]);

      render(<MusicBrainzReleaseField path="musicbrainzId" />);
      fireEvent.click(screen.getByText('Search MusicBrainz'));

      await waitFor(() => {
        expect(musicbrainzApi.searchReleases).toHaveBeenCalledWith('Test Album', undefined);
      });
    });

    it('returns empty artist when fetch throws', async () => {
      let callCount = 0;
      vi.mocked(useFormFields).mockImplementation(() => {
        const call = callCount;
        callCount += 1;
        if (call % 2 === 0) return { value: 'Test Album' } as any;
        return { value: { id: 'error-artist-id' } } as any;
      });

      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
      vi.mocked(musicbrainzApi.searchReleases).mockResolvedValue([]);

      render(<MusicBrainzReleaseField path="musicbrainzId" />);
      fireEvent.click(screen.getByText('Search MusicBrainz'));

      await waitFor(() => {
        expect(musicbrainzApi.searchReleases).toHaveBeenCalledWith('Test Album', undefined);
      });
    });
  });

  describe('formatReleaseInfo and getArtistName', () => {
    it('displays artist credit names in search results', async () => {
      const mockResults = [
        {
          id: '1',
          title: 'A Night at the Opera',
          score: 100,
          'artist-credit': [{ name: 'Queen' }, { name: 'Mercury' }],
        },
      ];

      vi.mocked(musicbrainzApi.searchReleases).mockResolvedValue(mockResults as any);

      render(<MusicBrainzReleaseField path="musicbrainzId" />);
      fireEvent.click(screen.getByText('Search MusicBrainz'));

      await waitFor(() => {
        expect(screen.getByText(/by Queen, Mercury/)).toBeInTheDocument();
      });
    });

    it('shows Unknown Artist for results with empty artist-credit array', async () => {
      const mockResults = [
        {
          id: '1',
          title: 'Mystery Album',
          score: 100,
          'artist-credit': [],
        },
      ];

      vi.mocked(musicbrainzApi.searchReleases).mockResolvedValue(mockResults as any);

      render(<MusicBrainzReleaseField path="musicbrainzId" />);
      fireEvent.click(screen.getByText('Search MusicBrainz'));

      await waitFor(() => {
        expect(screen.getByText(/by Unknown Artist/)).toBeInTheDocument();
      });
    });

    it('displays disambiguation in search results', async () => {
      const mockResults = [
        {
          id: '1',
          title: 'In Utero',
          score: 100,
          disambiguation: 'deluxe edition',
        },
      ];

      vi.mocked(musicbrainzApi.searchReleases).mockResolvedValue(mockResults as any);

      render(<MusicBrainzReleaseField path="musicbrainzId" />);
      fireEvent.click(screen.getByText('Search MusicBrainz'));

      await waitFor(() => {
        expect(screen.getByText(/\(deluxe edition\)/)).toBeInTheDocument();
      });
    });

    it('displays release group type in search results', async () => {
      const mockResults = [
        {
          id: '1',
          title: 'Thriller',
          score: 100,
          'release-group': { 'primary-type': 'Album' },
        },
      ];

      vi.mocked(musicbrainzApi.searchReleases).mockResolvedValue(mockResults as any);

      render(<MusicBrainzReleaseField path="musicbrainzId" />);
      fireEvent.click(screen.getByText('Search MusicBrainz'));

      await waitFor(() => {
        expect(screen.getByText(/\[Album\]/)).toBeInTheDocument();
      });
    });
  });
});
