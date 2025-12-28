import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, studioTheme } from '@sanity/ui';
import { MusicBrainzRecordInput } from './MusicBrainzRecordInput';

// Mock Sanity hooks
vi.mock('sanity', async () => {
  const actual = await vi.importActual('sanity');
  return {
    ...actual,
    useFormValue: vi.fn(),
    useClient: vi.fn(() => ({
      fetch: vi.fn(),
    })),
  };
});

// Mock fetch
global.fetch = vi.fn();

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={studioTheme}>{children}</ThemeProvider>
);

describe('MusicBrainzRecordInput', () => {
  const mockOnChange = vi.fn();
  const mockProps = {
    value: undefined,
    onChange: mockOnChange,
    elementProps: {
      id: 'test-input',
      onFocus: vi.fn(),
      onBlur: vi.fn(),
    },
    schemaType: {} as any,
    renderDefault: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    const { useFormValue, useClient } = require('sanity');

    // Mock form values
    useFormValue.mockImplementation((path: string[]) => {
      if (path[0] === 'title') return 'Disintegration';
      if (path[0] === 'artists') return [{ _ref: 'artist-123' }];
      return undefined;
    });

    // Mock client fetch for artist name
    useClient.mockReturnValue({
      fetch: vi.fn().mockResolvedValue({ name: 'The Cure' }),
    });
  });

  it('renders search button when no value is set', () => {
    render(<MusicBrainzRecordInput {...mockProps} />, { wrapper });
    expect(screen.getByText('Search MusicBrainz')).toBeInTheDocument();
  });

  it('shows album title and artist name in search prompt', async () => {
    render(<MusicBrainzRecordInput {...mockProps} />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText(/Search for "Disintegration" by The Cure/)).toBeInTheDocument();
    });
  });

  it('disables search when album title is not available', () => {
    const { useFormValue } = require('sanity');
    useFormValue.mockImplementation((path: string[]) => {
      if (path[0] === 'title') return undefined;
      return undefined;
    });

    render(<MusicBrainzRecordInput {...mockProps} />, { wrapper });
    const button = screen.getByText('Search MusicBrainz').closest('button');
    expect(button).toBeDisabled();
  });

  it('shows linked state with release MBID', () => {
    const linkedProps = {
      ...mockProps,
      value: 'release-123-mbid',
    };

    render(<MusicBrainzRecordInput {...linkedProps} />, { wrapper });
    expect(screen.getByText('Linked to MusicBrainz')).toBeInTheDocument();
    expect(screen.getByText('release-123-mbid')).toBeInTheDocument();
  });

  it('links to correct MusicBrainz release page', () => {
    const linkedProps = {
      ...mockProps,
      value: 'release-123-mbid',
    };

    render(<MusicBrainzRecordInput {...linkedProps} />, { wrapper });
    const link = screen.getByText('View on MusicBrainz').closest('a');
    expect(link).toHaveAttribute(
      'href',
      'https://musicbrainz.org/release/release-123-mbid',
    );
  });

  it('searches for releases with title and artist', async () => {
    const user = userEvent.setup();
    const mockFetch = global.fetch as any;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        releases: [
          {
            id: 'release-123',
            title: 'Disintegration',
            'artist-credit': [{ artist: { name: 'The Cure' } }],
            date: '1989-05-02',
            country: 'GB',
            'release-group': { 'primary-type': 'Album' },
            score: 100,
          },
        ],
      }),
    });

    render(<MusicBrainzRecordInput {...mockProps} />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText(/Search for "Disintegration" by The Cure/)).toBeInTheDocument();
    });

    await user.click(screen.getByText('Search MusicBrainz'));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('musicbrainz.org/ws/2/release'),
        expect.any(Object),
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('Disintegration'),
        expect.any(Object),
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('artist:The Cure'),
        expect.any(Object),
      );
    });
  });

  it('displays release results with metadata', async () => {
    const user = userEvent.setup();
    const mockFetch = global.fetch as any;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        releases: [
          {
            id: 'release-123',
            title: 'Disintegration',
            'artist-credit': [{ artist: { name: 'The Cure' } }],
            date: '1989-05-02',
            country: 'GB',
            'release-group': { 'primary-type': 'Album' },
            score: 100,
          },
        ],
      }),
    });

    render(<MusicBrainzRecordInput {...mockProps} />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText(/Search for "Disintegration" by The Cure/)).toBeInTheDocument();
    });

    await user.click(screen.getByText('Search MusicBrainz'));

    await waitFor(() => {
      expect(screen.getByText(/Disintegration/)).toBeInTheDocument();
      expect(screen.getByText(/1989/)).toBeInTheDocument();
      expect(screen.getByText(/Album/)).toBeInTheDocument();
      expect(screen.getByText(/GB/)).toBeInTheDocument();
    });
  });

  it('searches by title only when artist name unavailable', async () => {
    const user = userEvent.setup();
    const { useClient } = require('sanity');
    useClient.mockReturnValue({
      fetch: vi.fn().mockResolvedValue(null), // No artist name
    });

    const mockFetch = global.fetch as any;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ releases: [] }),
    });

    render(<MusicBrainzRecordInput {...mockProps} />, { wrapper });

    await waitFor(() => {
      expect(
        screen.getByText(/artist name not available - searching by title only/),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByText('Search MusicBrainz'));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  it('calls onChange when release is selected', async () => {
    const user = userEvent.setup();
    const mockFetch = global.fetch as any;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        releases: [
          {
            id: 'release-123',
            title: 'Disintegration',
            score: 100,
          },
        ],
      }),
    });

    render(<MusicBrainzRecordInput {...mockProps} />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText(/Search for "Disintegration"/)).toBeInTheDocument();
    });

    await user.click(screen.getByText('Search MusicBrainz'));

    await waitFor(() => {
      expect(screen.getByText(/Disintegration/)).toBeInTheDocument();
    });

    const resultCard = screen.getByText(/Disintegration/).closest('[data-ui="Card"]');
    if (resultCard) {
      await user.click(resultCard);
    }

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalled();
    });
  });

  it('handles disambiguation in results', async () => {
    const user = userEvent.setup();
    const mockFetch = global.fetch as any;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        releases: [
          {
            id: 'release-123',
            title: 'Disintegration',
            disambiguation: 'remastered',
            score: 100,
          },
        ],
      }),
    });

    render(<MusicBrainzRecordInput {...mockProps} />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText(/Search for "Disintegration"/)).toBeInTheDocument();
    });

    await user.click(screen.getByText('Search MusicBrainz'));

    await waitFor(() => {
      expect(screen.getByText(/remastered/)).toBeInTheDocument();
    });
  });

  it('shows match score for results', async () => {
    const user = userEvent.setup();
    const mockFetch = global.fetch as any;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        releases: [
          {
            id: 'release-123',
            title: 'Disintegration',
            score: 98,
          },
        ],
      }),
    });

    render(<MusicBrainzRecordInput {...mockProps} />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText(/Search for "Disintegration"/)).toBeInTheDocument();
    });

    await user.click(screen.getByText('Search MusicBrainz'));

    await waitFor(() => {
      expect(screen.getByText(/Match: 98%/)).toBeInTheDocument();
    });
  });
});
