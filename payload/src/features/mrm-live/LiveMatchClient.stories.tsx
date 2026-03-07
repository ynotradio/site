import type { Meta, StoryObj } from '@storybook/react';
import { LiveMatchClient } from './LiveMatchClient';

const NOW = new Date();
const PAST = (min: number) => new Date(NOW.getTime() - min * 60_000).toISOString();
const FUTURE = (min: number) => new Date(NOW.getTime() + min * 60_000).toISOString();

const BAND1 = {
  id: 'b1', name: 'Radiohead', abbreviation: 'RH', seed: 1, placement: 1,
};
const BAND2 = {
  id: 'b2', name: 'Nirvana', abbreviation: 'NIR', seed: 1, placement: 2,
};

const meta: Meta<typeof LiveMatchClient> = {
  title: 'Features/MRM Live/LiveMatchClient',
  component: LiveMatchClient,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof LiveMatchClient>;

const baseMatchResponse = (overrides: object) => ({
  docs: [
    {
      id: 'match-1',
      matchNumber: 7,
      round: '1',
      region: 2,
      band1: BAND1,
      band2: BAND2,
      band1Votes: 1523,
      band2Votes: 1456,
      startTime: PAST(30),
      endTime: FUTURE(30),
      winner: null,
      showScore: true,
      sponsor: 'Acme Records',
      sponsorMessage: 'Fueling the best music on the air.',
      ...overrides,
    },
  ],
  totalDocs: 1,
});

export const LiveMatch: Story = {
  parameters: {
    mockData: [
      {
        url: /\/api\/madness-matches/,
        method: 'GET',
        status: 200,
        response: baseMatchResponse({}),
      },
    ],
  },
};

export const OvertimeTied: Story = {
  parameters: {
    mockData: [
      {
        url: /\/api\/madness-matches/,
        method: 'GET',
        status: 200,
        response: baseMatchResponse({
          id: 'match-ot',
          band1Votes: 1500,
          band2Votes: 1500,
          endTime: PAST(5),
        }),
      },
    ],
  },
};

export const CloseableMatch: Story = {
  parameters: {
    mockData: [
      {
        url: /\/api\/madness-matches/,
        method: 'GET',
        status: 200,
        response: baseMatchResponse({
          id: 'match-close',
          band1Votes: 2100,
          band2Votes: 950,
          endTime: PAST(10),
        }),
      },
    ],
  },
};

export const ClosedWithWinner: Story = {
  parameters: {
    mockData: [
      {
        url: /\/api\/madness-matches/,
        method: 'GET',
        status: 200,
        response: baseMatchResponse({
          id: 'match-done',
          band1Votes: 2100,
          band2Votes: 950,
          endTime: PAST(120),
          winner: BAND1,
        }),
      },
    ],
  },
};

export const NoActiveMatch: Story = {
  parameters: {
    mockData: [
      {
        url: /\/api\/madness-matches/,
        method: 'GET',
        status: 200,
        response: { docs: [], totalDocs: 0 },
      },
    ],
  },
};

export const ApiError: Story = {
  parameters: {
    mockData: [
      {
        url: /\/api\/madness-matches/,
        method: 'GET',
        status: 500,
        response: { error: 'Internal Server Error' },
      },
    ],
  },
};
