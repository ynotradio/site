import type { Meta, StoryObj } from '@storybook/react';
import {
  StatusCard,
  ResultsCard,
  WriteInsCard,
  WinnerDrawCard,
} from './Top11ContestControlsPanels';

const meta: Meta = {
  title: 'Features/Top11/Top11ContestControlsPanels',
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
};

export default meta;

const CONTEST_OPEN = {
  id: 1,
  status: 'open' as const,
  weekOf: '2026-06-25T00:00:00.000Z',
};

const CONTEST_CLOSED = {
  ...CONTEST_OPEN,
  status: 'closed' as const,
};

const STATS = {
  contestId: 1,
  status: 'open' as const,
  totalVotes: 120,
  uniqueVoters: 118,
  contestants: 4,
  newsletterOptInContestants: 3,
  writeInCount: 3,
  rankedWriteIns: [
    { text: 'Wet Leg - Catch These Fists', count: 2, hiddenCount: 0 },
    { text: "boygenius - Emily I'm Sorry", count: 1, hiddenCount: 0 },
  ],
  rankedSongs: [
    {
      song: 5527,
      songTitle: 'Chance to Bleed',
      songArtist: 'Kurt Vile',
      displayOrder: 1,
      votes: 23,
    },
    {
      song: 5584,
      songTitle: 'A Good Day for Dying',
      songArtist: 'The Bug Club',
      displayOrder: 2,
      votes: 19,
    },
    {
      song: 5563,
      songTitle: 'Yip Yip Yow',
      songArtist: 'Caroline Rose',
      displayOrder: 3,
      votes: 17,
    },
  ],
};

export const StatusCardOpen: StoryObj<typeof StatusCard> = {
  render: () => (
    <StatusCard
      contest={CONTEST_OPEN}
      saving={false}
      onSetStatus={async () => {}}
      onClone={async () => {}}
    />
  ),
};

export const StatusCardClosed: StoryObj<typeof StatusCard> = {
  render: () => (
    <StatusCard
      contest={CONTEST_CLOSED}
      saving={false}
      onSetStatus={async () => {}}
      onClone={async () => {}}
    />
  ),
};

export const Results: StoryObj<typeof ResultsCard> = {
  render: () => <ResultsCard stats={STATS} />,
};

export const ResultsEmpty: StoryObj<typeof ResultsCard> = {
  render: () => <ResultsCard stats={null} />,
};

export const WriteIns: StoryObj<typeof WriteInsCard> = {
  render: () => <WriteInsCard stats={STATS} />,
};

export const WinnerDrawReady: StoryObj<typeof WinnerDrawCard> = {
  render: () => (
    <WinnerDrawCard saving={false} canPickWinner lastWinner={null} onPickWinner={async () => {}} />
  ),
};

export const WinnerDrawResult: StoryObj<typeof WinnerDrawCard> = {
  render: () => (
    <WinnerDrawCard
      saving={false}
      canPickWinner
      lastWinner={{
        winner: {
          id: 1,
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane@example.com',
        },
        drawLogId: 1,
        totalEntries: 4,
        eligibleEntries: 3,
        excludePriorWinners: true,
      }}
      onPickWinner={async () => {}}
    />
  ),
};
