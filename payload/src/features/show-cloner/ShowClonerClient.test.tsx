// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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

vi.mock('./components/SourceDateRangeSelector', () => ({
  SourceDateRangeSelector: () => <div data-testid="source-date-range-selector" />,
}));

vi.mock('./components/TargetDateSelector', () => ({
  TargetDateSelector: () => <div data-testid="target-date-selector" />,
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
    <button type="button" onClick={onClick} disabled={disabled} data-testid="clone-button">
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
});
