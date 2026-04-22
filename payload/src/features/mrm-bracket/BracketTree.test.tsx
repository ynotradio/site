import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BracketTree } from './BracketTree';
import type { BracketMatch } from './types';

const PAST = (min: number) => new Date(Date.now() - min * 60_000).toISOString();
const FUTURE = (min: number) => new Date(Date.now() + min * 60_000).toISOString();

const makeMatch = (
  id: string,
  matchNumber: number,
  round: string,
  region: number,
  overrides: Partial<BracketMatch> = {},
): BracketMatch => ({
  id,
  matchNumber,
  round,
  region,
  band1Votes: 0,
  band2Votes: 0,
  startTime: FUTURE(60),
  endTime: FUTURE(120),
  winner: null,
  band1: { id: 'b1', name: 'Radiohead', abbreviation: 'RH', seed: 1, placement: 1 },
  band2: { id: 'b2', name: 'Nirvana', abbreviation: 'NIR', seed: 16, placement: 16 },
  ...overrides,
});

// Minimal bracket: one match per region in R1 (matches 1, 9, 17, 25)
const MINIMAL_MATCHES: BracketMatch[] = [
  makeMatch('m1', 1, '1', 1),
  makeMatch('m9', 9, '1', 2),
  makeMatch('m17', 17, '1', 3),
  makeMatch('m25', 25, '1', 4),
];

describe('BracketTree', () => {
  it('renders without crashing with an empty match list', () => {
    const { container } = render(<BracketTree matches={[]} />);
    expect(container.querySelector('.bracket-tree')).toBeInTheDocument();
  });

  it('renders the bracket scroll container', () => {
    const { container } = render(<BracketTree matches={MINIMAL_MATCHES} />);
    expect(container.querySelector('.bracket-tree__scroll')).toBeInTheDocument();
  });

  it('renders four region divs', () => {
    const { container } = render(<BracketTree matches={MINIMAL_MATCHES} />);
    const regions = container.querySelectorAll('[class*="bracket-tree__region--"]');
    expect(regions.length).toBeGreaterThanOrEqual(4);
  });

  it('renders match cells with band abbreviations', () => {
    render(<BracketTree matches={MINIMAL_MATCHES} />);
    const abbrs = screen.getAllByText('RH');
    expect(abbrs.length).toBeGreaterThan(0);
  });

  it('renders match links pointing to admin controls URL', () => {
    render(<BracketTree matches={MINIMAL_MATCHES} />);
    const links = screen.getAllByRole('link');
    expect(links.some((l) => l.getAttribute('href')?.includes('m1'))).toBe(true);
  });

  it('renders live status class for in-progress matches', () => {
    const liveMatch = makeMatch('m2', 2, '1', 1, {
      startTime: PAST(30),
      endTime: FUTURE(30),
    });
    const { container } = render(<BracketTree matches={[liveMatch]} />);
    expect(container.querySelector('.bracket-tree__cell--live')).toBeInTheDocument();
  });

  it('renders winner/loser classes for closed matches', () => {
    const closedMatch = makeMatch('m3', 3, '1', 1, {
      startTime: PAST(120),
      endTime: PAST(30),
      winner: { id: 'b1', name: 'Radiohead', seed: 1, placement: 1 },
    });
    const { container } = render(<BracketTree matches={[closedMatch]} />);
    expect(container.querySelector('.bracket-tree__winner')).toBeInTheDocument();
    expect(container.querySelector('.bracket-tree__loser')).toBeInTheDocument();
  });

  it('renders vote percentages for matches with votes', () => {
    const matchWithVotes = makeMatch('m4', 4, '1', 1, {
      startTime: PAST(60),
      endTime: PAST(10),
      band1Votes: 600,
      band2Votes: 400,
      winner: { id: 'b1', name: 'Radiohead', seed: 1, placement: 1 },
    });
    render(<BracketTree matches={[matchWithVotes]} />);
    expect(screen.getByText('60%')).toBeInTheDocument();
    expect(screen.getByText('40%')).toBeInTheDocument();
  });

  it('renders TBD when band is null', () => {
    const tbdMatch = makeMatch('m5', 5, '1', 1, { band1: null, band2: null });
    render(<BracketTree matches={[tbdMatch]} />);
    const tbds = screen.getAllByText('TBD');
    expect(tbds.length).toBe(2);
  });

  it('renders championship matches in the championship area', () => {
    const finalMatch = makeMatch('m63', 63, '6', 5, {
      startTime: FUTURE(60),
      endTime: FUTURE(120),
    });
    const { container } = render(<BracketTree matches={[finalMatch]} />);
    expect(container.querySelector('.bracket-tree__championship')).toBeInTheDocument();
    expect(container.querySelector('.bracket-tree__final')).toBeInTheDocument();
  });

  it('renders semi-left match in the championship area', () => {
    const semiLeft = makeMatch('m61', 61, '5', 5);
    const { container } = render(<BracketTree matches={[semiLeft]} />);
    expect(container.querySelector('.bracket-tree__semi--left')).toBeInTheDocument();
  });

  it('renders both semi-final matches in the championship area', () => {
    const semiLeft = makeMatch('m61', 61, '5', 5);
    const semiRight = makeMatch('m62', 62, '5', 5);
    const { container } = render(<BracketTree matches={[semiLeft, semiRight]} />);
    expect(container.querySelector('.bracket-tree__semi--left')).toBeInTheDocument();
    expect(container.querySelector('.bracket-tree__semi--right')).toBeInTheDocument();
  });
});
