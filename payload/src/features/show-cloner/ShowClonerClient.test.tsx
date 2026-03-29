// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ShowClonerClient } from './ShowClonerClient';

vi.mock('@payloadcms/ui', () => ({
  Gutter: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="gutter">{children}</div>
  ),
  useStepNav: () => ({
    setStepNav: vi.fn(),
  }),
}));

vi.mock('./components/MessageBanner', () => ({
  MessageBanner: ({ message, type }: { message: string; type: string }) => (
    <div data-testid={`message-banner-${type}`}>{message}</div>
  ),
}));

// Capture date-change callbacks so tests can invoke handleDateChange
const mockDateCallbacks: {
  onStartDateChange?: (date: string) => void;
  onEndDateChange?: (date: string) => void;
  onTargetStartDateChange?: (date: string) => void;
} = {};

vi.mock('./components/SourceDateRangeSelector', () => ({
  SourceDateRangeSelector: (props: {
    onStartDateChange: (date: string) => void;
    onEndDateChange: (date: string) => void;
  }) => {
    mockDateCallbacks.onStartDateChange = props.onStartDateChange;
    mockDateCallbacks.onEndDateChange = props.onEndDateChange;
    return <div data-testid="source-date-range-selector" />;
  },
}));

vi.mock('./components/TargetDateSelector', () => ({
  TargetDateSelector: (props: { onTargetStartDateChange: (date: string) => void }) => {
    mockDateCallbacks.onTargetStartDateChange = props.onTargetStartDateChange;
    return <div data-testid="target-date-selector" />;
  },
}));

vi.mock('./components/CloneButton', () => ({
  CloneButton: ({
    onClick,
    disabled,
    showCount,
  }: {
    onClick: () => void;
    disabled: boolean;
    showCount: number;
  }) => (
    // Note: onClick is always callable in the mock regardless of disabled,
    // allowing tests to call handleClone directly via fireEvent.click.
    // The disabled state is tracked via aria-disabled for assertability.
    <button
      type="button"
      onClick={onClick}
      aria-disabled={disabled}
      data-testid="clone-button"
    >
      {`Clone ${showCount} Shows`}
    </button>
  ),
}));

vi.mock('../shared/LoadingSpinner', () => ({
  LoadingSpinner: () => <div data-testid="loading-spinner">Loading...</div>,
}));

vi.mock('../shared/EmptyState', () => ({
  EmptyState: ({ message }: { message: string }) => (
    <div data-testid="empty-state">{message}</div>
  ),
}));

const mockShowsResponse = {
  docs: [
    {
      id: '1',
      date: '2024-01-15T05:00:00.000Z',
      startTime: '10:00',
      endTime: '12:00',
      name: 'Morning Show',
      host: { id: '10', displayName: 'DJ Alpha' },
    },
    {
      id: '2',
      date: '2024-01-16T05:00:00.000Z',
      startTime: '14:00',
      endTime: '16:00',
      name: 'Afternoon Show',
      host: { id: '11', displayName: 'DJ Beta' },
    },
  ],
  totalDocs: 2,
  limit: 0,
  totalPages: 1,
  page: 1,
};

describe('ShowClonerClient', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  describe('Loading State', () => {
    it('shows loading spinner while fetching shows', () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
        () => new Promise(() => {}),
      );
      render(<ShowClonerClient />);
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });
  });

  describe('Data Fetching', () => {
    it('fetches shows from API on mount', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockShowsResponse,
      });

      render(<ShowClonerClient />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/shows?limit=0&sort=-date,startTime');
      });
    });

    it('renders main UI after shows are loaded', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockShowsResponse,
      });

      render(<ShowClonerClient />);

      await waitFor(() => {
        expect(screen.getByTestId('source-date-range-selector')).toBeInTheDocument();
        expect(screen.getByTestId('target-date-selector')).toBeInTheDocument();
      });
    });

    it('shows empty state when no shows are returned', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockShowsResponse, docs: [], totalDocs: 0 }),
      });

      render(<ShowClonerClient />);

      await waitFor(() => {
        expect(screen.getByTestId('empty-state')).toBeInTheDocument();
        expect(
          screen.getByText('No shows found. Create some shows first.'),
        ).toBeInTheDocument();
      });
    });

    it('shows error banner when fetch fails', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('Network error'),
      );

      render(<ShowClonerClient />);

      await waitFor(() => {
        expect(screen.getByTestId('message-banner-error')).toBeInTheDocument();
      });
    });
  });

  describe('Cloning', () => {
    it('shows clone button when shows are loaded', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockShowsResponse,
      });

      render(<ShowClonerClient />);

      await waitFor(() => {
        expect(screen.getByTestId('clone-button')).toBeInTheDocument();
      });
    });
  });

  describe('Page Header', () => {
    it('renders page title and description', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockShowsResponse,
      });

      render(<ShowClonerClient />);

      await waitFor(() => {
        expect(screen.getByText('Show Cloner')).toBeInTheDocument();
      });
      expect(
        screen.getByText(/Clone shows from a date range to another/),
      ).toBeInTheDocument();
    });
  });

  describe('handleClone and handleDateChange', () => {
    it('invokes cloneShows when clone button is clicked (shows validation error)', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockShowsResponse,
      });

      render(<ShowClonerClient />);

      await waitFor(() => {
        expect(screen.getByTestId('clone-button')).toBeInTheDocument();
      });

      // fireEvent.click fires on non-disabled buttons, executing handleClone.
      // Dates are pre-filled by useDateRanges (last/next week), shows are from 2024
      // so no shows fall in range → cloneShows sets an error message.
      fireEvent.click(screen.getByTestId('clone-button'));

      await waitFor(() => {
        expect(screen.getByTestId('message-banner-error')).toBeInTheDocument();
      });
    });

    it('invokes the date setter and clears messages when source start date changes', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockShowsResponse,
      });

      render(<ShowClonerClient />);

      await waitFor(() => {
        expect(screen.getByTestId('source-date-range-selector')).toBeInTheDocument();
      });

      // Trigger clone first to produce an error message
      fireEvent.click(screen.getByTestId('clone-button'));
      await waitFor(() => {
        expect(screen.getByTestId('message-banner-error')).toBeInTheDocument();
      });

      // Changing a source date invokes handleDateChange which calls the setter
      // and calls clearMessages(), removing the error banner
      mockDateCallbacks.onStartDateChange?.('2024-01-15');

      await waitFor(() => {
        expect(screen.queryByTestId('message-banner-error')).not.toBeInTheDocument();
      });
    });
  });
});
