import type { Meta, StoryObj } from '@storybook/react';
import { Top11ContestControlsTab } from './Top11ContestControlsTab';

const baseContest = (overrides: object) => ({
  id: 1,
  title: 'Week of July 6',
  status: 'open',
  weekOf: '2026-07-06T00:00:00.000Z',
  ...overrides,
});

const baseStats = (overrides: object) => ({
  contestId: 1,
  status: 'open',
  totalVotes: 42,
  uniqueVoters: 40,
  contestants: 12,
  newsletterOptInContestants: 5,
  writeInCount: 3,
  rankedWriteIns: [
    { text: 'Free Bird', count: 2, hiddenCount: 0 },
    { text: 'Stairway to Heaven', count: 1, hiddenCount: 1 },
  ],
  rankedSongs: [
    { song: 1, displayOrder: 1, votes: 30 },
    { song: 2, displayOrder: 2, votes: 12 },
  ],
  ...overrides,
});

const meta: Meta<typeof Top11ContestControlsTab> = {
  title: 'Features/Top11/Top11ContestControlsTab',
  component: Top11ContestControlsTab,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Top11ContestControlsTab>;

export const OpenContest: Story = {
  parameters: {
    mockData: [
      {
        url: /\/api\/top11-contests\/1$/,
        method: 'GET',
        status: 200,
        response: baseContest({}),
      },
      {
        url: /\/api\/top11-contests\/1\/stats/,
        method: 'GET',
        status: 200,
        response: baseStats({}),
      },
    ],
  },
};

export const ClosedContestReadyForWinner: Story = {
  parameters: {
    mockData: [
      {
        url: /\/api\/top11-contests\/1$/,
        method: 'GET',
        status: 200,
        response: baseContest({ status: 'closed' }),
      },
      {
        url: /\/api\/top11-contests\/1\/stats/,
        method: 'GET',
        status: 200,
        response: baseStats({ status: 'closed' }),
      },
    ],
  },
};

export const ArchivedContest: Story = {
  parameters: {
    mockData: [
      {
        url: /\/api\/top11-contests\/1$/,
        method: 'GET',
        status: 200,
        response: baseContest({ status: 'archived' }),
      },
      {
        url: /\/api\/top11-contests\/1\/stats/,
        method: 'GET',
        status: 200,
        response: baseStats({ status: 'archived' }),
      },
    ],
  },
};
