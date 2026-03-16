import type { Meta, StoryObj } from '@storybook/react';
import { BracketTree } from './BracketTree';
import type { BracketMatch } from './types';

const NOW = new Date();
const PAST = (min: number) => new Date(NOW.getTime() - min * 60_000).toISOString();
const FUTURE = (min: number) => new Date(NOW.getTime() + min * 60_000).toISOString();

const makeMatch = (
  id: string,
  matchNumber: number,
  round: string,
  band1Name: string,
  band1Abbr: string,
  band1Seed: number,
  band2Name: string,
  band2Abbr: string,
  band2Seed: number,
  overrides: Partial<BracketMatch> = {},
): BracketMatch => ({
  id,
  matchNumber,
  round,
  band1Votes: 0,
  band2Votes: 0,
  startTime: FUTURE(60),
  endTime: FUTURE(120),
  winner: null,
  band1: {
    id: `b-${band1Name}`,
    name: band1Name,
    abbreviation: band1Abbr,
    seed: band1Seed,
    placement: matchNumber * 2 - 1,
  },
  band2: {
    id: `b-${band2Name}`,
    name: band2Name,
    abbreviation: band2Abbr,
    seed: band2Seed,
    placement: matchNumber * 2,
  },
  ...overrides,
});

// Seed 8 region-1 matches for a realistic R1 bracket view
const SAMPLE_MATCHES: BracketMatch[] = [
  makeMatch('m1', 1, '1', 'Radiohead', 'RH', 1, 'Smashing Pumpkins', 'SP', 16, {
    band1Votes: 1823,
    band2Votes: 942,
    startTime: PAST(120),
    endTime: FUTURE(60),
  }),
  makeMatch('m2', 2, '1', 'Nirvana', 'NIR', 2, 'Alice in Chains', 'AIC', 15),
  makeMatch('m3', 3, '1', 'Pearl Jam', 'PJ', 3, 'Soundgarden', 'SG', 14),
  makeMatch('m4', 4, '1', 'Foo Fighters', 'FF', 4, 'Weezer', 'WZR', 13),
  makeMatch('m5', 5, '1', 'Green Day', 'GD', 5, 'Blink-182', 'BLK', 12),
  makeMatch('m6', 6, '1', 'Red Hot Chili Peppers', 'RHCP', 6, 'Stone Temple Pilots', 'STP', 11),
  makeMatch('m7', 7, '1', 'Beck', 'BECK', 7, 'Sublime', 'SUB', 10),
  makeMatch('m8', 8, '1', 'Bush', 'BUSH', 8, 'Live', 'LIVE', 9),
  // R2
  makeMatch('m33', 33, '2', 'Radiohead', 'RH', 1, 'Nirvana', 'NIR', 2, {
    band1Votes: 2100,
    band2Votes: 950,
    startTime: PAST(240),
    endTime: PAST(120),
    winner: {
      id: 'b-Radiohead', name: 'Radiohead', seed: 1, placement: 1,
    },
  }),
  // Semi-final (left)
  makeMatch('m61', 61, '5', 'Radiohead', 'RH', 1, 'Pearl Jam', 'PJ', 3, {
    startTime: FUTURE(2880),
    endTime: FUTURE(2940),
  }),
  // Championship final
  makeMatch('m63', 63, '6', '(TBD)', 'TBD', 1, '(TBD)', 'TBD', 1, {
    band1: null,
    band2: null,
    startTime: FUTURE(5760),
    endTime: FUTURE(5820),
  }),
];

const meta: Meta<typeof BracketTree> = {
  title: 'Features/MRM Bracket/BracketTree',
  component: BracketTree,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof BracketTree>;

export const WithMatches: Story = {
  args: {
    matches: SAMPLE_MATCHES,
  },
};

export const Empty: Story = {
  args: {
    matches: [],
  },
};

export const LiveMatch: Story = {
  args: {
    matches: [
      makeMatch('m1', 1, '1', 'Radiohead', 'RH', 1, 'Nirvana', 'NIR', 2, {
        band1Votes: 1500,
        band2Votes: 1200,
        startTime: PAST(45),
        endTime: FUTURE(15),
      }),
    ],
  },
};
