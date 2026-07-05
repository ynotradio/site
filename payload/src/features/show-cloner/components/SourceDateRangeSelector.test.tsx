// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SourceDateRangeSelector } from './SourceDateRangeSelector';
import type { DateGroup } from '../types';

const mockDateGroups: DateGroup[] = [
  {
    date: '2024-01-15',
    formattedDate: 'Monday, Jan 15, 2024',
    dayName: 'Monday',
    shows: [
      {
        id: '1',
        date: '2024-01-15',
        startTime: '10:00:00',
        endTime: '12:00:00',
        name: 'Morning Show',
        hostName: 'DJ Test',
      },
    ],
  },
];

describe('SourceDateRangeSelector', () => {
  const defaultProps = {
    sourceStartDate: '2024-01-15',
    sourceEndDate: '2024-01-21',
    selectedRangeDateGroups: [],
    selectedRangeShows: 0,
    onStartDateChange: vi.fn(),
    onEndDateChange: vi.fn(),
  };

  it('renders start date input with correct value', () => {
    render(<SourceDateRangeSelector {...defaultProps} />);
    const input = screen.getByLabelText('Start Date');
    expect(input).toHaveValue('2024-01-15');
  });

  it('renders end date input with correct value', () => {
    render(<SourceDateRangeSelector {...defaultProps} />);
    const input = screen.getByLabelText('End Date');
    expect(input).toHaveValue('2024-01-21');
  });

  it('calls onStartDateChange when start date is changed', () => {
    const onStartDateChange = vi.fn();
    render(
      <SourceDateRangeSelector {...defaultProps} onStartDateChange={onStartDateChange} />,
    );
    fireEvent.change(screen.getByLabelText('Start Date'), { target: { value: '2024-01-22' } });
    expect(onStartDateChange).toHaveBeenCalledWith('2024-01-22');
  });

  it('calls onEndDateChange when end date is changed', () => {
    const onEndDateChange = vi.fn();
    render(
      <SourceDateRangeSelector {...defaultProps} onEndDateChange={onEndDateChange} />,
    );
    fireEvent.change(screen.getByLabelText('End Date'), { target: { value: '2024-01-28' } });
    expect(onEndDateChange).toHaveBeenCalledWith('2024-01-28');
  });

  it('shows shows list when date groups are provided', () => {
    render(
      <SourceDateRangeSelector
        {...defaultProps}
        selectedRangeDateGroups={mockDateGroups}
        selectedRangeShows={1}
      />,
    );
    expect(screen.getByText(/Shows in selected range/)).toBeInTheDocument();
    expect(screen.getByText(/1 total/)).toBeInTheDocument();
  });

  it('shows "No shows found" message when dates selected but no shows', () => {
    render(
      <SourceDateRangeSelector
        {...defaultProps}
        selectedRangeDateGroups={[]}
        selectedRangeShows={0}
      />,
    );
    expect(screen.getByText('No shows found in the selected date range.')).toBeInTheDocument();
  });

  it('does not show empty message when no dates are selected', () => {
    render(
      <SourceDateRangeSelector
        {...defaultProps}
        sourceStartDate=""
        sourceEndDate=""
        selectedRangeDateGroups={[]}
        selectedRangeShows={0}
      />,
    );
    expect(
      screen.queryByText('No shows found in the selected date range.'),
    ).not.toBeInTheDocument();
  });

  it('displays show list with day name and show count', () => {
    render(
      <SourceDateRangeSelector
        {...defaultProps}
        selectedRangeDateGroups={mockDateGroups}
        selectedRangeShows={1}
      />,
    );
    expect(screen.getByText(/Monday/)).toBeInTheDocument();
    expect(screen.getByText(/1 show\b/)).toBeInTheDocument();
  });

  it('pluralises "shows" when a date group has more than one show', () => {
    const multiShowGroups: DateGroup[] = [
      {
        date: '2024-01-15',
        formattedDate: 'Monday, Jan 15, 2024',
        dayName: 'Monday',
        shows: [
          {
            id: '1',
            date: '2024-01-15',
            startTime: '10:00:00',
            endTime: '12:00:00',
            name: 'Morning Show',
            hostName: 'DJ A',
          },
          {
            id: '2',
            date: '2024-01-15',
            startTime: '12:00:00',
            endTime: '14:00:00',
            name: 'Afternoon Show',
            hostName: 'DJ B',
          },
        ],
      },
    ];
    render(
      <SourceDateRangeSelector
        {...defaultProps}
        selectedRangeDateGroups={multiShowGroups}
        selectedRangeShows={2}
      />,
    );
    expect(screen.getByText(/2 shows\b/)).toBeInTheDocument();
  });
});
