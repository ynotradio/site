import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import YearEndNomineeRowLabel from './YearEndNomineeRowLabel';

const useRowLabel = vi.fn();

vi.mock('@payloadcms/ui', () => ({
  useRowLabel: () => useRowLabel(),
}));

describe('YearEndNomineeRowLabel', () => {
  it('shows the custom label', () => {
    useRowLabel.mockReturnValue({ data: { customLabel: 'The Studio' }, rowNumber: 0 });
    render(<YearEndNomineeRowLabel />);
    expect(screen.getByText('The Studio')).toBeInTheDocument();
  });

  it('shows a populated relationship name', () => {
    useRowLabel.mockReturnValue({
      data: { song: { id: 1, displayName: 'Wet Leg - CPR' } },
      rowNumber: 0,
    });
    render(<YearEndNomineeRowLabel />);
    expect(screen.getByText('Wet Leg - CPR')).toBeInTheDocument();
  });

  it('loads the name when the relationship is an id', async () => {
    useRowLabel.mockReturnValue({ data: { artist: 7 }, rowNumber: 0 });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ name: 'Metric' }) }),
    );
    render(<YearEndNomineeRowLabel />);
    await waitFor(() => expect(screen.getByText('Metric')).toBeInTheDocument());
  });

  it('adds the vote count once there are votes', () => {
    useRowLabel.mockReturnValue({ data: { customLabel: 'Wet Leg', voteCount: 42 }, rowNumber: 0 });
    render(<YearEndNomineeRowLabel />);
    expect(screen.getByText('Wet Leg (42 votes)')).toBeInTheDocument();
  });

  it('falls back to the numbered label', () => {
    useRowLabel.mockReturnValue({ data: {}, rowNumber: 2 });
    render(<YearEndNomineeRowLabel />);
    expect(screen.getByText('Nominee 03')).toBeInTheDocument();
  });
});
