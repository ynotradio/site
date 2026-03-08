import type { Meta, StoryObj } from '@storybook/react';
import { BracketClient } from './BracketClient';

const TOURNAMENT = {
  id: 't1',
  name: 'Modern Rock Madness 2025',
  year: 2025,
  status: 'active',
  startDate: '2025-03-01',
};

const NOW = new Date();
const PAST = (min: number) => new Date(NOW.getTime() - min * 60_000).toISOString();
const FUTURE = (min: number) => new Date(NOW.getTime() + min * 60_000).toISOString();

const makeMatch = (
  id: string,
  matchNumber: number,
  round: string,
  band1Name: string,
  band1Seed: number,
  band2Name: string,
  band2Seed: number,
  overrides: object = {},
) => ({
  id,
  matchNumber,
  round,
  band1Votes: 0,
  band2Votes: 0,
  startTime: FUTURE(60),
  endTime: FUTURE(120),
  winner: null,
  band1: {
    id: `b-${band1Name}`, name: band1Name, seed: band1Seed, placement: matchNumber * 2 - 1,
  },
  band2: {
    id: `b-${band2Name}`, name: band2Name, seed: band2Seed, placement: matchNumber * 2,
  },
  ...overrides,
});

const SAMPLE_MATCHES = [
  makeMatch('m1', 1, '1', 'Radiohead', 1, 'Smashing Pumpkins', 16, {
    band1Votes: 1823, band2Votes: 942, startTime: PAST(120), endTime: FUTURE(60),
  }),
  makeMatch('m2', 2, '1', 'Nirvana', 2, 'Alice in Chains', 15, { startTime: FUTURE(90), endTime: FUTURE(150) }),
  makeMatch('m3', 3, '1', 'Pearl Jam', 3, 'Soundgarden', 14, { startTime: FUTURE(180) }),
  makeMatch('m4', 4, '1', 'Foo Fighters', 4, 'Weezer', 13, { startTime: FUTURE(270) }),
  makeMatch('m33', 33, '2', 'Radiohead', 1, '(TBD)', 2, {
    band2: null,
    startTime: FUTURE(2000),
    winner: {
      id: 'b-Radiohead', name: 'Radiohead', seed: 1, placement: 1,
    },
    band1Votes: 2100,
    band2Votes: 950,
    endTime: PAST(30),
  }),
  makeMatch('m49', 49, '3', '(TBD)', 1, '(TBD)', 1, { band1: null, band2: null, startTime: FUTURE(5000) }),
];

const meta: Meta<typeof BracketClient> = {
  title: 'Features/MRM Bracket/BracketClient',
  component: BracketClient,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof BracketClient>;

export const ActiveTournament: Story = {
  parameters: {
    mockData: [
      {
        url: /\/api\/modern-rock-madness-tournaments/,
        method: 'GET',
        status: 200,
        response: { docs: [TOURNAMENT], totalDocs: 1 },
      },
      {
        url: /\/api\/modern-rock-madness-matches/,
        method: 'GET',
        status: 200,
        response: { docs: SAMPLE_MATCHES, totalDocs: SAMPLE_MATCHES.length },
      },
    ],
  },
};

export const NoTournament: Story = {
  parameters: {
    mockData: [
      {
        url: /\/api\/modern-rock-madness-tournaments/,
        method: 'GET',
        status: 200,
        response: { docs: [], totalDocs: 0 },
      },
      {
        url: /\/api\/modern-rock-madness-matches/,
        method: 'GET',
        status: 200,
        response: { docs: [], totalDocs: 0 },
      },
    ],
  },
};

export const NoMatches: Story = {
  parameters: {
    mockData: [
      {
        url: /\/api\/modern-rock-madness-tournaments/,
        method: 'GET',
        status: 200,
        response: { docs: [TOURNAMENT], totalDocs: 1 },
      },
      {
        url: /\/api\/modern-rock-madness-matches/,
        method: 'GET',
        status: 200,
        response: { docs: [], totalDocs: 0 },
      },
    ],
  },
};
