import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, studioTheme } from '@sanity/ui';
import { MusicBrainzArtistInput } from './MusicBrainzArtistInput';

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

describe('MusicBrainzArtistInput', () => {
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
    const { useFormValue } = require('sanity');
    useFormValue.mockReturnValue('The Cure'); // Mock artist name
  });

  it('renders search button when no value is set', () => {
    render(<MusicBrainzArtistInput {...mockProps} />, { wrapper });
    expect(screen.getByText('Search MusicBrainz')).toBeInTheDocument();
  });

  it('shows artist name in search prompt', () => {
    render(<MusicBrainzArtistInput {...mockProps} />, { wrapper });
    expect(screen.getByText(/Search for "The Cure" on MusicBrainz/)).toBeInTheDocument();
  });

  it('disables search button when artist name is not available', () => {
    const { useFormValue } = require('sanity');
    useFormValue.mockReturnValue(undefined);

    render(<MusicBrainzArtistInput {...mockProps} />, { wrapper });
    const button = screen.getByText('Search MusicBrainz').closest('button');
    expect(button).toBeDisabled();
  });

  it('shows linked state when value is set', () => {
    const linkedProps = {
      ...mockProps,
      value: '5b11f4ce-a62d-471e-81fc-a69a8278c7da',
    };

    render(<MusicBrainzArtistInput {...linkedProps} />, { wrapper });
    expect(screen.getByText('Linked to MusicBrainz')).toBeInTheDocument();
    expect(screen.getByText('5b11f4ce-a62d-471e-81fc-a69a8278c7da')).toBeInTheDocument();
  });

  it('shows MusicBrainz link when value is set', () => {
    const linkedProps = {
      ...mockProps,
      value: '5b11f4ce-a62d-471e-81fc-a69a8278c7da',
    };

    render(<MusicBrainzArtistInput {...linkedProps} />, { wrapper });
    const link = screen.getByText('View on MusicBrainz').closest('a');
    expect(link).toHaveAttribute(
      'href',
      'https://musicbrainz.org/artist/5b11f4ce-a62d-471e-81fc-a69a8278c7da',
    );
  });

  it('searches MusicBrainz when search button is clicked', async () => {
    const user = userEvent.setup();
    const mockFetch = global.fetch as any;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        artists: [
          {
            id: '5b11f4ce-a62d-471e-81fc-a69a8278c7da',
            name: 'The Cure',
            type: 'Group',
            country: 'GB',
            score: 100,
          },
        ],
      }),
    });

    render(<MusicBrainzArtistInput {...mockProps} />, { wrapper });

    const searchButton = screen.getByText('Search MusicBrainz');
    await user.click(searchButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('musicbrainz.org/ws/2/artist'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'User-Agent': 'YNotRadio/1.0.0 (https://ynotradio.org)',
          }),
        }),
      );
    });
  });

  it('displays search results after successful search', async () => {
    const user = userEvent.setup();
    const mockFetch = global.fetch as any;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        artists: [
          {
            id: '5b11f4ce-a62d-471e-81fc-a69a8278c7da',
            name: 'The Cure',
            type: 'Group',
            country: 'GB',
            score: 100,
          },
        ],
      }),
    });

    render(<MusicBrainzArtistInput {...mockProps} />, { wrapper });

    await user.click(screen.getByText('Search MusicBrainz'));

    await waitFor(() => {
      expect(screen.getByText(/The Cure/)).toBeInTheDocument();
      expect(screen.getByText(/Select an Artist/)).toBeInTheDocument();
    });
  });

  it('calls onChange when a result is selected', async () => {
    const user = userEvent.setup();
    const mockFetch = global.fetch as any;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        artists: [
          {
            id: '5b11f4ce-a62d-471e-81fc-a69a8278c7da',
            name: 'The Cure',
            score: 100,
          },
        ],
      }),
    });

    render(<MusicBrainzArtistInput {...mockProps} />, { wrapper });

    await user.click(screen.getByText('Search MusicBrainz'));

    await waitFor(() => {
      expect(screen.getByText(/The Cure/)).toBeInTheDocument();
    });

    // Click on the result card
    const resultCard = screen.getByText(/The Cure/).closest('[data-ui="Card"]');
    if (resultCard) {
      await user.click(resultCard);
    }

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalled();
    });
  });

  it('shows error message when API request fails', async () => {
    const user = userEvent.setup();
    const mockFetch = global.fetch as any;
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    render(<MusicBrainzArtistInput {...mockProps} />, { wrapper });

    await user.click(screen.getByText('Search MusicBrainz'));

    await waitFor(() => {
      expect(screen.getByText(/MusicBrainz API error/)).toBeInTheDocument();
    });
  });

  it('shows no results message when no artists found', async () => {
    const user = userEvent.setup();
    const mockFetch = global.fetch as any;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        artists: [],
      }),
    });

    render(<MusicBrainzArtistInput {...mockProps} />, { wrapper });

    await user.click(screen.getByText('Search MusicBrainz'));

    await waitFor(() => {
      expect(screen.getByText('No results found')).toBeInTheDocument();
    });
  });

  it('clears value when clear button is clicked', async () => {
    const user = userEvent.setup();
    const linkedProps = {
      ...mockProps,
      value: '5b11f4ce-a62d-471e-81fc-a69a8278c7da',
    };

    render(<MusicBrainzArtistInput {...linkedProps} />, { wrapper });

    await user.click(screen.getByText('Clear'));

    expect(mockOnChange).toHaveBeenCalled();
  });

  it('allows manual entry of MBID', async () => {
    const user = userEvent.setup();
    render(<MusicBrainzArtistInput {...mockProps} />, { wrapper });

    const manualInput = screen.getByPlaceholderText(/e.g., 5b11f4ce/);
    await user.type(manualInput, '5b11f4ce-a62d-471e-81fc-a69a8278c7da');

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalled();
    });
  });
});
