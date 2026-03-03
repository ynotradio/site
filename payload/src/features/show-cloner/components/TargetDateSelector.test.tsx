// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TargetDateSelector } from './TargetDateSelector';

describe('TargetDateSelector', () => {
  const defaultProps = {
    targetStartDate: '2024-01-22',
    targetEndDate: '2024-01-28',
    sourceStartDate: '2024-01-15',
    sourceEndDate: '2024-01-21',
    onTargetStartDateChange: vi.fn(),
  };

  it('renders target start date input', () => {
    render(<TargetDateSelector {...defaultProps} />);
    const input = screen.getByLabelText('Target Start Date');
    expect(input).toHaveValue('2024-01-22');
  });

  it('calls onTargetStartDateChange when date changes', () => {
    const handler = vi.fn();
    render(<TargetDateSelector {...defaultProps} onTargetStartDateChange={handler} />);
    fireEvent.change(screen.getByLabelText('Target Start Date'), {
      target: { value: '2024-01-29' },
    });
    expect(handler).toHaveBeenCalledWith('2024-01-29');
  });

  it('shows calculated target end date when provided', () => {
    render(<TargetDateSelector {...defaultProps} />);
    expect(screen.getByText('Target End Date (calculated)')).toBeInTheDocument();
  });

  it('does not show target end date when empty', () => {
    render(<TargetDateSelector {...defaultProps} targetEndDate="" />);
    expect(screen.queryByText('Target End Date (calculated)')).not.toBeInTheDocument();
  });

  it('shows date range summary when all dates are set', () => {
    render(<TargetDateSelector {...defaultProps} />);
    expect(screen.getByText(/Shows will be cloned from/)).toBeInTheDocument();
  });

  it('does not show summary when target start date is empty', () => {
    render(<TargetDateSelector {...defaultProps} targetStartDate="" />);
    expect(screen.queryByText(/Shows will be cloned from/)).not.toBeInTheDocument();
  });

  it('does not show summary when source dates are empty', () => {
    render(
      <TargetDateSelector
        {...defaultProps}
        sourceStartDate=""
        sourceEndDate=""
      />,
    );
    expect(screen.queryByText(/Shows will be cloned from/)).not.toBeInTheDocument();
  });
});
