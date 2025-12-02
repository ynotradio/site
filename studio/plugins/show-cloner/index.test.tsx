import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider, studioTheme } from '@sanity/ui';
import {
  formatDate, getDayName, groupShowsByDate, ShowClonerTool,
} from './index';
import { Show } from './types';
import { useClient } from 'sanity';

// Mock sanity useClient
vi.mock('sanity', () => ({
  useClient: vi.fn(),
}));

// Wrapper for Sanity UI components
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={studioTheme}>{children}</ThemeProvider>
);

describe('show-cloner helper functions', () => {
  describe('formatDate', () => {
    it('formats date correctly with full weekday and month', () => {
      // Note: date format is locale-dependent, but this should work for en-US
      const result = formatDate('2024-01-15');
      expect(result).toContain('Mon');
      expect(result).toContain('Jan');
      expect(result).toContain('15');
      expect(result).toContain('2024');
    });

    it('handles different dates', () => {
      const result = formatDate('2024-12-25');
      expect(result).toContain('Dec');
      expect(result).toContain('25');
      expect(result).toContain('2024');
    });
  });

  describe('getDayName', () => {
    it('returns full weekday name', () => {
      const result = getDayName('2024-01-15'); // Monday
      expect(result).toBe('Monday');
    });

    it('returns correct day for Sunday', () => {
      const result = getDayName('2024-01-14'); // Sunday
      expect(result).toBe('Sunday');
    });

    it('returns correct day for Saturday', () => {
      const result = getDayName('2024-01-13'); // Saturday
      expect(result).toBe('Saturday');
    });
  });

  describe('groupShowsByDate', () => {
    it('groups shows by date', () => {
      const shows: Show[] = [
        {
          _id: 'show-1',
          date: '2024-01-15',
          startTime: '09:00',
          endTime: '12:00',
          name: 'Morning Show',
        },
        {
          _id: 'show-2',
          date: '2024-01-15',
          startTime: '12:00',
          endTime: '15:00',
          djName: 'DJ Test',
        },
        {
          _id: 'show-3',
          date: '2024-01-16',
          startTime: '09:00',
          endTime: '12:00',
          name: 'Another Show',
        },
      ];

      const result = groupShowsByDate(shows);

      expect(result).toHaveLength(2);
      expect(result[0].date).toBe('2024-01-15');
      expect(result[0].shows).toHaveLength(2);
      expect(result[1].date).toBe('2024-01-16');
      expect(result[1].shows).toHaveLength(1);
    });

    it('sorts dates in ascending order', () => {
      const shows: Show[] = [
        {
          _id: 'show-1',
          date: '2024-01-20',
          startTime: '09:00',
          endTime: '12:00',
          name: 'Show 1',
        },
        {
          _id: 'show-2',
          date: '2024-01-15',
          startTime: '12:00',
          endTime: '15:00',
          name: 'Show 2',
        },
        {
          _id: 'show-3',
          date: '2024-01-18',
          startTime: '09:00',
          endTime: '12:00',
          name: 'Show 3',
        },
      ];

      const result = groupShowsByDate(shows);

      expect(result[0].date).toBe('2024-01-15');
      expect(result[1].date).toBe('2024-01-18');
      expect(result[2].date).toBe('2024-01-20');
    });

    it('includes formatted date and day name', () => {
      const shows: Show[] = [
        {
          _id: 'show-1',
          date: '2024-01-15',
          startTime: '09:00',
          endTime: '12:00',
          name: 'Show 1',
        },
      ];

      const result = groupShowsByDate(shows);

      expect(result[0].formattedDate).toContain('Mon');
      expect(result[0].dayName).toBe('Monday');
    });

    it('returns empty array for empty input', () => {
      const result = groupShowsByDate([]);
      expect(result).toEqual([]);
    });
  });
});

describe('ShowClonerTool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading spinner initially', () => {
    // Setup mock to return a pending promise
    const mockFetch = vi.fn(() => new Promise(() => {}));
    (useClient as ReturnType<typeof vi.fn>).mockReturnValue({
      fetch: mockFetch,
      transaction: vi.fn(),
    });

    render(<ShowClonerTool />, { wrapper });

    // Should show loading spinner - find by data-ui attribute
    const spinner = document.querySelector('[data-ui="Spinner"]');
    expect(spinner).toBeInTheDocument();
  });

  it('renders empty state when no shows', async () => {
    const mockFetch = vi.fn().mockResolvedValue([]);
    (useClient as ReturnType<typeof vi.fn>).mockReturnValue({
      fetch: mockFetch,
      transaction: vi.fn(),
    });

    render(<ShowClonerTool />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText(/No shows found/i)).toBeInTheDocument();
    });
  });

  it('handles fetch error gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const mockFetch = vi.fn().mockRejectedValue(new Error('Fetch failed'));

    (useClient as ReturnType<typeof vi.fn>).mockReturnValue({
      fetch: mockFetch,
      transaction: vi.fn(),
    });

    render(<ShowClonerTool />, { wrapper });

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching shows:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });

  it('calls fetch on mount', () => {
    const mockFetch = vi.fn(() => new Promise(() => {}));
    (useClient as ReturnType<typeof vi.fn>).mockReturnValue({
      fetch: mockFetch,
      transaction: vi.fn(),
    });

    render(<ShowClonerTool />, { wrapper });

    expect(mockFetch).toHaveBeenCalled();
  });
});
