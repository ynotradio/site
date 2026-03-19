import type { Meta, StoryObj } from '@storybook/react';
import type { LiveMatch } from './types';
import {
  NavLinks,
  MatchCardHeader,
  MatchCardBody,
  ActionButtons,
  AdminLinks,
} from './MatchControlsPanels';

const NOW = new Date();
const PAST = (min: number) => new Date(NOW.getTime() - min * 60_000).toISOString();
const FUTURE = (min: number) => new Date(NOW.getTime() + min * 60_000).toISOString();

const BAND1 = {
  id: 'b1',
  name: 'Radiohead',
  seed: 1,
  placement: 1,
};
const BAND2 = {
  id: 'b2',
  name: 'Nirvana',
  seed: 2,
  placement: 2,
};

const baseMatch = (overrides: Partial<LiveMatch> = {}): LiveMatch => ({
  id: 'match-1',
  matchNumber: 7,
  round: '1',
  band1: BAND1,
  band2: BAND2,
  band1Votes: 1523,
  band2Votes: 1456,
  startTime: PAST(30),
  endTime: FUTURE(30),
  winner: null,
  showScore: true,
  ...overrides,
});

/* ─── NavLinks ──────────────────────────────────────────────────── */

const navLinksMeta: Meta<typeof NavLinks> = {
  title: 'Features/MRM Live/MatchControlsPanels/NavLinks',
  component: NavLinks,
  tags: ['autodocs'],
};

export default navLinksMeta;
type NavLinksStory = StoryObj<typeof NavLinks>;

export const AllLinks: NavLinksStory = {
  args: {
    tournamentId: 'tournament-1',
    previousMatchId: 'match-prev',
    nextMatchId: 'match-next',
  },
};

export const PreviousOnly: NavLinksStory = {
  args: {
    tournamentId: null,
    previousMatchId: 'match-prev',
    nextMatchId: null,
  },
};

export const NextOnly: NavLinksStory = {
  args: {
    tournamentId: null,
    previousMatchId: null,
    nextMatchId: 'match-next',
  },
};

export const TournamentOnly: NavLinksStory = {
  args: {
    tournamentId: 'tournament-1',
    previousMatchId: null,
    nextMatchId: null,
  },
};

export const NoLinks: NavLinksStory = {
  args: {
    tournamentId: null,
    previousMatchId: null,
    nextMatchId: null,
  },
};

/* ─── MatchCardHeader ───────────────────────────────────────────── */

export const HeaderLive: StoryObj<typeof MatchCardHeader> = {
  render: (args) => <MatchCardHeader {...args} />,
  args: {
    match: baseMatch(),
    status: 'live',
  },
};

export const HeaderUpcoming: StoryObj<typeof MatchCardHeader> = {
  render: (args) => <MatchCardHeader {...args} />,
  args: {
    match: baseMatch({ round: '3', matchNumber: 42 }),
    status: 'upcoming',
  },
};

export const HeaderOvertime: StoryObj<typeof MatchCardHeader> = {
  render: (args) => <MatchCardHeader {...args} />,
  args: {
    match: baseMatch({ round: '5' }),
    status: 'overtime',
  },
};

export const HeaderClosed: StoryObj<typeof MatchCardHeader> = {
  render: (args) => <MatchCardHeader {...args} />,
  args: {
    match: baseMatch({ round: '6', matchNumber: 63 }),
    status: 'closed',
  },
};

/* ─── MatchCardBody ─────────────────────────────────────────────── */

const noop = async () => {};

export const BodyLive: StoryObj<typeof MatchCardBody> = {
  render: (args) => <MatchCardBody {...args} />,
  args: {
    match: baseMatch(),
    saving: false,
    onManualVote: noop,
  },
};

export const BodySaving: StoryObj<typeof MatchCardBody> = {
  render: (args) => <MatchCardBody {...args} />,
  args: {
    match: baseMatch(),
    saving: true,
    onManualVote: noop,
  },
};

export const BodyWithWinner: StoryObj<typeof MatchCardBody> = {
  render: (args) => <MatchCardBody {...args} />,
  args: {
    match: baseMatch({
      band1Votes: 2100,
      band2Votes: 950,
      endTime: PAST(30),
      winner: BAND1,
    }),
    saving: false,
    onManualVote: noop,
  },
};

export const BodyTBDBands: StoryObj<typeof MatchCardBody> = {
  render: (args) => <MatchCardBody {...args} />,
  args: {
    match: baseMatch({
      band1: null,
      band2: null,
      band1Votes: 0,
      band2Votes: 0,
    }),
    saving: false,
    onManualVote: noop,
  },
};

export const BodyZeroVotes: StoryObj<typeof MatchCardBody> = {
  render: (args) => <MatchCardBody {...args} />,
  args: {
    match: baseMatch({ band1Votes: 0, band2Votes: 0 }),
    saving: false,
    onManualVote: noop,
  },
};

/* ─── ActionButtons ─────────────────────────────────────────────── */

export const ActionsAllEnabled: StoryObj<typeof ActionButtons> = {
  render: (args) => <ActionButtons {...args} />,
  args: {
    saving: false,
    showScore: true,
    canClose: true,
    canExtend: true,
    onClose: noop,
    onExtend: noop,
    onToggleShowScore: noop,
    onRematch: noop,
  },
};

export const ActionsDisabledDuringLive: StoryObj<typeof ActionButtons> = {
  render: (args) => <ActionButtons {...args} />,
  args: {
    saving: false,
    showScore: true,
    canClose: false,
    canExtend: false,
    onClose: noop,
    onExtend: noop,
    onToggleShowScore: noop,
    onRematch: noop,
  },
};

export const ActionsSaving: StoryObj<typeof ActionButtons> = {
  render: (args) => <ActionButtons {...args} />,
  args: {
    saving: true,
    showScore: false,
    canClose: true,
    canExtend: true,
    onClose: noop,
    onExtend: noop,
    onToggleShowScore: noop,
    onRematch: noop,
  },
};

export const ActionsScoresHidden: StoryObj<typeof ActionButtons> = {
  render: (args) => <ActionButtons {...args} />,
  args: {
    saving: false,
    showScore: false,
    canClose: false,
    canExtend: true,
    onClose: noop,
    onExtend: noop,
    onToggleShowScore: noop,
    onRematch: noop,
  },
};

/* ─── AdminLinks ────────────────────────────────────────────────── */

export const AdminLinksDefault: StoryObj<typeof AdminLinks> = {
  render: (args) => <AdminLinks {...args} />,
  args: {
    match: baseMatch(),
  },
};

export const AdminLinksNoBands: StoryObj<typeof AdminLinks> = {
  render: (args) => <AdminLinks {...args} />,
  args: {
    match: baseMatch({ band1: null, band2: null }),
  },
};
