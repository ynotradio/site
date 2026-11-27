import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import StaffPickRowLabel from './StaffPickRowLabel';

const useRowLabel = vi.fn();

vi.mock('@payloadcms/ui', () => ({
  useRowLabel: () => useRowLabel(),
}));

describe('StaffPickRowLabel', () => {
  it('shows the rank, artist and title', () => {
    useRowLabel.mockReturnValue({
      data: { artist: 'Deep Sea Diver', title: 'SHOVEL' },
      rowNumber: 0,
    });
    render(<StaffPickRowLabel />);
    expect(screen.getByText('1. Deep Sea Diver - SHOVEL')).toBeInTheDocument();
  });

  it('shows just the title when there is no artist', () => {
    useRowLabel.mockReturnValue({ data: { title: 'Billboard Heart' }, rowNumber: 4 });
    render(<StaffPickRowLabel />);
    expect(screen.getByText('5. Billboard Heart')).toBeInTheDocument();
  });

  it('labels an empty row', () => {
    useRowLabel.mockReturnValue({ data: {}, rowNumber: 1 });
    render(<StaffPickRowLabel />);
    expect(screen.getByText('2. New pick')).toBeInTheDocument();
  });
});
