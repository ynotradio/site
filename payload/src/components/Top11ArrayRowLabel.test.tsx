import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Top11EntryRowLabel, Top11NomineeRowLabel } from './Top11ArrayRowLabel';

const useRowLabel = vi.fn();

vi.mock('@payloadcms/ui', () => ({
  useRowLabel: () => useRowLabel(),
}));

describe('Top11ArrayRowLabel', () => {
  it('uses the populated artist and song name for entries', () => {
    useRowLabel.mockReturnValue({
      data: { song: { artist: { name: 'Kurt Vile' }, title: 'Chance to Bleed' } },
      rowNumber: 0,
    });

    render(<Top11EntryRowLabel />);

    expect(screen.getByText('Kurt Vile — Chance to Bleed')).toBeInTheDocument();
  });

  it('falls back to the numbered entry label when the song is empty', () => {
    useRowLabel.mockReturnValue({ data: { song: null }, rowNumber: 1 });

    render(<Top11EntryRowLabel />);

    expect(screen.getByText('Entry 02')).toBeInTheDocument();
  });

  it('uses the numbered nominee label when the song is empty', () => {
    useRowLabel.mockReturnValue({ data: { song: null }, rowNumber: 2 });

    render(<Top11NomineeRowLabel />);

    expect(screen.getByText('Nominee 03')).toBeInTheDocument();
  });
});
