/**
 * Show Cloner Utility Functions
 *
 * Helper functions for date formatting and show grouping
 */

import type { Show, DateGroup } from './types';

// Helper to parse date string as local date (not UTC)
// This handles date-only strings like '2024-01-15' correctly
const parseLocalDate = (dateStr: string): Date => {
  // If the date string is just YYYY-MM-DD, parse it as local time
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  // Otherwise parse normally (handles ISO strings with time)
  return new Date(dateStr);
};

// Helper function to format date for display
export const formatDate = (dateStr: string): string => {
  const date = parseLocalDate(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

// Helper function to format date range for display
export const formatDateRange = (startDate: string, endDate: string): string => {
  const start = parseLocalDate(startDate);
  const end = parseLocalDate(endDate);
  const startStr = start.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const endStr = end.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  return `${startStr} - ${endStr}`;
};

// Helper function to get day name
export const getDayName = (dateStr: string): string => {
  const date = parseLocalDate(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'long' });
};

// Helper function to format date without weekday (for compact display)
export const formatDateShort = (dateStr: string): string => {
  const date = parseLocalDate(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

// Helper function to calculate the number of days between two dates
export const getDaysDifference = (startDate: string, endDate: string): number => {
  const start = parseLocalDate(startDate);
  const end = parseLocalDate(endDate);
  const diffTime = end.getTime() - start.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
};

// Helper function to add days to a date
export const addDays = (dateStr: string, days: number): string => {
  const date = parseLocalDate(dateStr);
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper function to group shows by date
export const groupShowsByDate = (shows: Show[]): DateGroup[] => {
  const groups: { [key: string]: Show[] } = {};
  shows.forEach((show) => {
    if (!groups[show.date]) {
      groups[show.date] = [];
    }
    groups[show.date].push(show);
  });

  return Object.keys(groups)
    .sort()
    .map((date) => ({
      date,
      formattedDate: formatDate(date),
      dayName: getDayName(date),
      shows: groups[date],
    }));
};

// Helper function to get shows within a date range
export const getShowsInRange = (
  shows: Show[],
  startDate: string,
  endDate: string,
): Show[] => shows.filter((show) => show.date >= startDate && show.date <= endDate);
