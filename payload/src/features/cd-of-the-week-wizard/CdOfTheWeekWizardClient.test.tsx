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
    description,
    submitLabel,
    children,
  }: {
    onSuccess?: (doc: any) => void;
    title?: string;
    description?: string;
    submitLabel?: string;
    children?: React.ReactNode;
  }) => (
    <div data-testid="inline-form">
      {title && <h2>{title}</h2>}
      {description && <p data-testid="form-description">{description}</p>}
      <p data-testid="submit-label">{submitLabel}</p>
      {children}
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
    expect(
      screen.getByText(/Creates the album record and CD of the Week entry at once/),
    ).toBeInTheDocument();
  });

  it('renders album form and CDOTW fields on one page', () => {
    render(<CdOfTheWeekWizardClient />);

    expect(screen.getByTestId('inline-form')).toBeInTheDocument();
    expect(screen.getByText('Album Details')).toBeInTheDocument();
    expect(screen.getByText('CD of the Week Details')).toBeInTheDocument();
  });

  it('renders review date and review fields visibly', () => {
    render(<CdOfTheWeekWizardClient />);

    expect(screen.getByLabelText(/Review Date/)).toBeInTheDocument();
    expect(screen.getByLabelText('Review')).toBeInTheDocument();
  });

  it('shows validation error when review text is missing', async () => {
    render(<CdOfTheWeekWizardClient />);

    fireEvent.change(screen.getByLabelText(/Review Date/), {
      target: { value: '2025-06-01' },
    });
    fireEvent.click(screen.getByTestId('simulate-record-create'));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Review text is required');
    });
  });

  it('shows validation error when review date is missing', async () => {
    render(<CdOfTheWeekWizardClient />);

    fireEvent.change(screen.getByLabelText('Review'), {
      target: { value: 'Great album' },
    });
    fireEvent.click(screen.getByTestId('simulate-record-create'));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Review date is required');
    });
  });

  it('shows submitting state while creating', async () => {
    const { createCdOfTheWeek } = await import('./utils');
    (createCdOfTheWeek as any).mockReturnValue(new Promise(() => {}));

    render(<CdOfTheWeekWizardClient />);

    fireEvent.change(screen.getByLabelText(/Review Date/), {
      target: { value: '2025-06-01' },
    });
    fireEvent.change(screen.getByLabelText('Review'), {
      target: { value: 'Great album' },
    });
    fireEvent.click(screen.getByTestId('simulate-record-create'));

    await waitFor(() => {
      expect(screen.getByTestId('submit-label')).toHaveTextContent('Creating…');
    });
  });

  it('renders link to standard create page in description', () => {
    render(<CdOfTheWeekWizardClient />);

    const link = screen.getByRole('link', { name: 'Create CD of the Week' });
    expect(link).toHaveAttribute('href', '/admin/collections/cdoftheweek/create');
  });
});
