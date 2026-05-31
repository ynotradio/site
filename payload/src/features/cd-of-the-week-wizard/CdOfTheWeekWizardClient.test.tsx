import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CdOfTheWeekWizardClient } from './CdOfTheWeekWizardClient';

vi.mock('@payloadcms/ui', () => ({
  Gutter: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="gutter">{children}</div>
  ),
  useStepNav: () => ({ setStepNav: vi.fn() }),
  Form: ({ children }: { children: React.ReactNode }) => <form>{children}</form>,
  FormSubmit: ({ children }: { children: React.ReactNode }) => (
    <button type="submit">{children}</button>
  ),
  RenderFields: () => <div data-testid="render-fields" />,
  useConfig: () => ({
    getEntityConfig: ({ collectionSlug }: { collectionSlug: string }) => {
      if (collectionSlug === 'records') {
        return {
          slug: 'records',
          labels: { singular: 'Record', plural: 'Records' },
          fields: [
            { name: 'title', type: 'text', label: 'Title', required: true },
            {
              name: 'artist',
              type: 'relationship',
              label: 'Artist',
              relationTo: 'artists',
              required: true,
            },
            { name: 'label', type: 'text', label: 'Label' },
            { name: 'releaseDate', type: 'date', label: 'Release Date' },
          ],
        };
      }
      return null;
    },
  }),
  useServerFunctions: () => ({
    getFormState: vi.fn().mockResolvedValue({
      state: {
        title: { value: '', valid: true, initialValue: '', path: 'title' },
        artist: { value: null, valid: true, initialValue: null, path: 'artist' },
        label: { value: '', valid: true, initialValue: '', path: 'label' },
        releaseDate: { value: '', valid: true, initialValue: '', path: 'releaseDate' },
      },
    }),
  }),
  toast: { success: vi.fn() },
}));

vi.mock('./useAsyncSearch', () => {
  let reviewerSearch = {
    query: '',
    setQuery: vi.fn(),
    results: [] as { id: number; name: string }[],
    isSearching: false,
    selected: null as { id: number; name: string } | null,
    select: vi.fn(),
    clear: vi.fn(),
  };

  return {
    useAsyncSearch: () => reviewerSearch,
    __esModule: true,
    _setReviewerSearch: (val: typeof reviewerSearch) => {
      reviewerSearch = val;
    },
  };
});

vi.mock('../../utils/InlineCollectionFormClient', () => ({
  InlineCollectionFormClient: ({
    onSuccess,
    title,
    submitLabel,
  }: {
    onSuccess?: (doc: any) => void;
    title?: string;
    submitLabel?: string;
  }) => (
    <div data-testid="inline-form">
      {title && <h2>{title}</h2>}
      <p data-testid="submit-label">{submitLabel}</p>
      <button
        data-testid="simulate-record-create"
        onClick={() => onSuccess?.({ id: 42, title: 'OK Computer' })}
      >
        Simulate Create
      </button>
    </div>
  ),
}));

vi.mock('./utils', () => ({
  createCdOfTheWeek: vi.fn().mockResolvedValue(99),
}));

describe('CdOfTheWeekWizardClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page title and description', () => {
    render(<CdOfTheWeekWizardClient />);

    expect(screen.getByText('New CD of the Week + Album')).toBeInTheDocument();
    expect(screen.getByText(/Creates the album record/)).toBeInTheDocument();
  });

  it('renders Step 1 (create album) initially', () => {
    render(<CdOfTheWeekWizardClient />);

    expect(screen.getByTestId('inline-form')).toBeInTheDocument();
    expect(screen.getByText('Step 1: Create Album')).toBeInTheDocument();
  });

  it('shows Step 2 after record is created', async () => {
    render(<CdOfTheWeekWizardClient />);

    fireEvent.click(screen.getByTestId('simulate-record-create'));

    await waitFor(() => {
      expect(screen.getByText('Step 2: Create CD of the Week')).toBeInTheDocument();
      expect(screen.getByText(/OK Computer/)).toBeInTheDocument();
    });
  });

  it('renders review date and review fields in Step 2', async () => {
    render(<CdOfTheWeekWizardClient />);

    fireEvent.click(screen.getByTestId('simulate-record-create'));

    await waitFor(() => {
      expect(screen.getByLabelText(/Review Date/)).toBeInTheDocument();
      expect(screen.getByLabelText('Review')).toBeInTheDocument();
    });
  });

  it('shows validation error when review text is missing in Step 2', async () => {
    render(<CdOfTheWeekWizardClient />);

    fireEvent.click(screen.getByTestId('simulate-record-create'));

    await waitFor(() => {
      fireEvent.change(screen.getByLabelText(/Review Date/), {
        target: { value: '2025-06-01' },
      });
      fireEvent.click(screen.getByRole('button', { name: /Create CD of the Week/i }));
    });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Review text is required');
    });
  });

  it('shows validation error when review date is missing in Step 2', async () => {
    render(<CdOfTheWeekWizardClient />);

    fireEvent.click(screen.getByTestId('simulate-record-create'));

    await waitFor(() => {
      fireEvent.change(screen.getByLabelText('Review'), {
        target: { value: 'Great album' },
      });
      fireEvent.click(screen.getByRole('button', { name: /Create CD of the Week/i }));
    });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Review date is required');
    });
  });

  it('back button returns to Step 1', async () => {
    render(<CdOfTheWeekWizardClient />);

    fireEvent.click(screen.getByTestId('simulate-record-create'));

    await waitFor(() => {
      expect(screen.getByText('Step 2: Create CD of the Week')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Back' }));

    await waitFor(() => {
      expect(screen.getByTestId('inline-form')).toBeInTheDocument();
    });
  });

  it('renders link to standard create page in description', () => {
    render(<CdOfTheWeekWizardClient />);

    const link = screen.getByRole('link', { name: 'Create CD of the Week' });
    expect(link).toHaveAttribute('href', '/admin/collections/cdoftheweek/create');
  });
});
