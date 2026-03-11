import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AdminBracketMatch } from './AdminBracketMatch';

describe('AdminBracketMatch', () => {
  it('renders band names', () => {
    render(
      <AdminBracketMatch
        band1={{ seed: 1, name: 'Radiohead' }}
        band2={{ seed: 16, name: 'Nirvana' }}
      />,
    );
    expect(screen.getByText('Radiohead')).toBeInTheDocument();
    expect(screen.getByText('Nirvana')).toBeInTheDocument();
  });

  it('renders TBD when band is null', () => {
    render(<AdminBracketMatch band1={null} band2={null} />);
    const tbds = screen.getAllByText('(TBD)');
    expect(tbds).toHaveLength(2);
  });

  it('renders seeds', () => {
    render(
      <AdminBracketMatch
        band1={{ seed: 1, name: 'Radiohead' }}
        band2={{ seed: 16, name: 'Nirvana' }}
      />,
    );
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('16')).toBeInTheDocument();
  });

  it('shows percentage when provided', () => {
    render(
      <AdminBracketMatch
        band1={{ seed: 1, name: 'Radiohead', pct: '62%' }}
        band2={{ seed: 16, name: 'Nirvana', pct: '38%' }}
      />,
    );
    expect(screen.getByText('62%')).toBeInTheDocument();
    expect(screen.getByText('38%')).toBeInTheDocument();
  });

  it('applies winner/loser classes', () => {
    const { container } = render(
      <AdminBracketMatch
        band1={{ seed: 1, name: 'Radiohead' }}
        band2={{ seed: 16, name: 'Nirvana' }}
        winner="1"
      />,
    );
    expect(container.querySelector('.mrm_winner')).toHaveTextContent('Radiohead');
    expect(container.querySelector('.mrm_loser')).toHaveTextContent('Nirvana');
  });

  it('applies live modifier class', () => {
    const { container } = render(
      <AdminBracketMatch
        band1={{ seed: 1, name: 'Radiohead' }}
        band2={{ seed: 16, name: 'Nirvana' }}
        live
      />,
    );
    expect(container.querySelector('.admin-bracket-match--live')).toBeInTheDocument();
  });

  it('renders as a link when href is provided', () => {
    render(
      <AdminBracketMatch
        band1={{ seed: 1, name: 'Radiohead' }}
        band2={{ seed: 16, name: 'Nirvana' }}
        href="/admin/collections/modern-rock-madness-matches/m1"
        matchLabel="#7"
      />,
    );
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/admin/collections/modern-rock-madness-matches/m1');
  });

  it('renders match label and status badge', () => {
    render(
      <AdminBracketMatch
        band1={{ seed: 1, name: 'Radiohead' }}
        band2={{ seed: 16, name: 'Nirvana' }}
        matchLabel="#7"
        statusBadge="🔴 LIVE"
      />,
    );
    expect(screen.getByText('#7')).toBeInTheDocument();
    expect(screen.getByText('🔴 LIVE')).toBeInTheDocument();
  });

  it('renders without link when no href', () => {
    render(
      <AdminBracketMatch
        band1={{ seed: 1, name: 'Radiohead' }}
        band2={{ seed: 16, name: 'Nirvana' }}
      />,
    );
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
