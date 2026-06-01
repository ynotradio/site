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
    children,
    ...rest
  }: {
    onSuccess?: (doc: any) => void;
    children?: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <div data-testid="inline-form">
      <button
        data-testid="simulate-record-create"
        onClick={() => (rest as any).onSuccess?.({ id: 42, title: 'OK Computer' })}
      >
        Simulate Submit
      </button>
      {children}
    </div>
  ),
}));

vi.mock('./CdotwReviewField', () => ({
  CdotwReviewField: ({ valueRef }: { valueRef: React.MutableRefObject<unknown> }) => {
    // Populate the ref synchronously so validation in onSuccess passes
    // eslint-disable-next-line no-param-reassign
    valueRef.current = { root: { children: [] } };
    return <div data-testid="review-field">Rich Text Editor</div>;
  },
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

  it('renders form with CDOTW fields and no section headings', () => {
    render(<CdOfTheWeekWizardClient />);

    expect(screen.getByTestId('inline-form')).toBeInTheDocument();
    expect(screen.queryByText('Album Details')).not.toBeInTheDocument();
    expect(screen.queryByText('CD of the Week Details')).not.toBeInTheDocument();
  });

  it('renders review date, reviewer search, and rich text review field', () => {
    render(<CdOfTheWeekWizardClient />);

    expect(screen.getByLabelText(/Review Date/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Reviewer/)).toBeInTheDocument();
    expect(screen.getByTestId('review-field')).toBeInTheDocument();
  });

  it('shows validation error when review date is missing', async () => {
    render(<CdOfTheWeekWizardClient />);

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
    fireEvent.click(screen.getByTestId('simulate-record-create'));

    await waitFor(() => {
      const btns = screen.getAllByText('Creating…');
      expect(btns.length).toBeGreaterThan(0);
    });
  });

  it('renders link to standard create page in description', () => {
    render(<CdOfTheWeekWizardClient />);

    const link = screen.getByRole('link', { name: 'Create CD of the Week' });
    expect(link).toHaveAttribute('href', '/admin/collections/cdoftheweek/create');
  });
});
