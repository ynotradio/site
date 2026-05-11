import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CdOfTheWeekWizardClient } from './CdOfTheWeekWizardClient';

vi.mock('@payloadcms/ui', () => ({
  Gutter: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="gutter">{children}</div>
  ),
  useStepNav: () => ({ setStepNav: vi.fn() }),
}));

vi.mock('./useAsyncSearch', () => {
  let artistSearch = {
    query: '',
    setQuery: vi.fn(),
    results: [] as { id: number; name: string }[],
    isSearching: false,
    selected: null as { id: number; name: string } | null,
    select: vi.fn(),
    clear: vi.fn(),
  };
  let reviewerSearch = { ...artistSearch };

  return {
    useAsyncSearch: (slug: string) => {
      if (slug === 'artists') return artistSearch;
      reviewerSearch = { ...artistSearch, selected: null };
      return reviewerSearch;
    },
    __esModule: true,
    _setArtistSearch: (val: typeof artistSearch) => { artistSearch = val; },
  };
});

describe('CdOfTheWeekWizardClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('renders the page title and description', () => {
    render(<CdOfTheWeekWizardClient />);

    expect(screen.getByText('New CD of the Week + Album')).toBeInTheDocument();
    expect(screen.getByText(/Creates the album record/)).toBeInTheDocument();
  });

  it('renders album section fields', () => {
    render(<CdOfTheWeekWizardClient />);

    expect(screen.getByLabelText(/Title/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Label/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Release Date/)).toBeInTheDocument();
  });

  it('renders CD of the Week section fields', () => {
    render(<CdOfTheWeekWizardClient />);

    expect(screen.getByLabelText(/Review Date/)).toBeInTheDocument();
    expect(screen.getByLabelText('Review')).toBeInTheDocument();
  });

  it('shows validation error when title is missing', async () => {
    render(<CdOfTheWeekWizardClient />);

    const submitBtn = screen.getByRole('button', { name: /Create CD of the Week/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Album title is required');
    });
  });

  it('shows validation error when artist is missing', async () => {
    render(<CdOfTheWeekWizardClient />);

    fireEvent.change(screen.getByLabelText(/Title/), { target: { value: 'OK Computer' } });
    fireEvent.click(screen.getByRole('button', { name: /Create CD of the Week/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Artist is required');
    });
  });

  it('shows cancel link pointing to the collection', () => {
    render(<CdOfTheWeekWizardClient />);

    const cancelLink = screen.getByRole('link', { name: 'Cancel' });
    expect(cancelLink).toHaveAttribute('href', '/admin/collections/cdoftheweek');
  });

  it('renders submit button', () => {
    render(<CdOfTheWeekWizardClient />);

    expect(
      screen.getByRole('button', { name: /Create CD of the Week \+ Album/i }),
    ).toBeInTheDocument();
  });

  it('submit button is enabled initially', () => {
    render(<CdOfTheWeekWizardClient />);

    const btn = screen.getByRole('button', { name: /Create CD of the Week \+ Album/i });
    expect(btn).not.toBeDisabled();
  });

  it('renders link to standard create page in description', () => {
    render(<CdOfTheWeekWizardClient />);

    const link = screen.getByRole('link', { name: 'Create CD of the Week' });
    expect(link).toHaveAttribute('href', '/admin/collections/cdoftheweek/create');
  });
});
