import React, { useEffect, useRef } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

// eslint-disable-next-line import/extensions
import './mrm-match-card.js';

/* Import the PHP site's madness.css for page-level MRM styles. */
import '../../style/madness.css';

interface MatchCardProps {
  matchId?: string;
  status?: 'running' | 'early' | 'over';
  band1Name?: string;
  band1Image?: string;
  band1Sponsor?: string;
  band2Name?: string;
  band2Image?: string;
  band2Sponsor?: string;
  band1Pct?: string;
  band2Pct?: string;
  showResults?: boolean;
  hasVoted?: boolean;
  winner?: '' | '1' | '2';
  tied?: boolean;
  sponsor?: string;
  sponsorMsg?: string;
  loginUrl?: string;
  timerText?: string;
}

const MatchCardWrapper: React.FC<MatchCardProps> = ({
  matchId,
  status,
  band1Name,
  band1Image,
  band1Sponsor,
  band2Name,
  band2Image,
  band2Sponsor,
  band1Pct,
  band2Pct,
  showResults,
  hasVoted,
  winner,
  tied,
  sponsor,
  sponsorMsg,
  loginUrl,
  timerText,
}) => {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const setAttr = (name: string, value?: string | boolean) => {
      if (value === true) el.setAttribute(name, '');
      else if (value === false || value == null || value === '') el.removeAttribute(name);
      else el.setAttribute(name, value);
    };

    setAttr('match-id', matchId);
    setAttr('status', status);
    setAttr('band1-name', band1Name);
    setAttr('band1-image', band1Image);
    setAttr('band1-sponsor', band1Sponsor);
    setAttr('band2-name', band2Name);
    setAttr('band2-image', band2Image);
    setAttr('band2-sponsor', band2Sponsor);
    setAttr('band1-pct', band1Pct);
    setAttr('band2-pct', band2Pct);
    setAttr('show-results', showResults);
    setAttr('has-voted', hasVoted);
    setAttr('winner', winner);
    setAttr('tied', tied);
    setAttr('sponsor', sponsor);
    setAttr('sponsor-msg', sponsorMsg);
    setAttr('login-url', loginUrl);
    setAttr('timer-text', timerText);
  });

  return React.createElement('mrm-match-card', { ref });
};

const meta: Meta<typeof MatchCardWrapper> = {
  title: 'MRM/MatchCard',
  component: MatchCardWrapper,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  argTypes: {
    status: { control: 'select', options: ['running', 'early', 'over'] },
    showResults: { control: 'boolean' },
    hasVoted: { control: 'boolean' },
    winner: { control: 'select', options: ['', '1', '2'] },
    tied: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof MatchCardWrapper>;

/** Running match with countdown timer, scores visible, vote buttons shown. */
export const LiveMatch: Story = {
  args: {
    matchId: '63',
    status: 'running',
    band1Name: 'Yeah Yeah Yeahs',
    band1Image: 'https://placehold.co/200x200?text=YYYs',
    band1Sponsor: 'Dave Mooney',
    band2Name: 'R.E.M.',
    band2Image: 'https://placehold.co/200x200?text=REM',
    band2Sponsor: 'Liz Whelan',
    band1Pct: '48%',
    band2Pct: '52%',
    showResults: true,
    timerText: '19:47:01',
  },
};

/** Running match before scores are enabled (show_score=0). */
export const LiveNoScores: Story = {
  args: {
    matchId: '63',
    status: 'running',
    band1Name: 'Yeah Yeah Yeahs',
    band1Image: 'https://placehold.co/200x200?text=YYYs',
    band2Name: 'R.E.M.',
    band2Image: 'https://placehold.co/200x200?text=REM',
    timerText: '23:59:59',
  },
};

/** Match hasn't started yet — shows "Voting has not started yet" message. */
export const UpcomingMatch: Story = {
  args: {
    matchId: '63',
    status: 'early',
    band1Name: 'Yeah Yeah Yeahs',
    band1Image: 'https://placehold.co/200x200?text=YYYs',
    band2Name: 'R.E.M.',
    band2Image: 'https://placehold.co/200x200?text=REM',
  },
};

/** Match completed with a clear winner — loser image dimmed. */
export const CompletedMatch: Story = {
  args: {
    matchId: '63',
    status: 'over',
    band1Name: 'Yeah Yeah Yeahs',
    band1Image: 'https://placehold.co/200x200?text=YYYs',
    band2Name: 'R.E.M.',
    band2Image: 'https://placehold.co/200x200?text=REM',
    band1Pct: '38%',
    band2Pct: '62%',
    showResults: true,
    winner: '2',
  },
};

/** Match over with equal votes — shows "tied" message. */
export const TiedMatch: Story = {
  args: {
    matchId: '63',
    status: 'over',
    band1Name: 'Yeah Yeah Yeahs',
    band1Image: 'https://placehold.co/200x200?text=YYYs',
    band2Name: 'R.E.M.',
    band2Image: 'https://placehold.co/200x200?text=REM',
    band1Pct: '50%',
    band2Pct: '50%',
    showResults: true,
    tied: true,
  },
};

/** User already voted — buttons hidden, "Thanks for voting!" shown. */
export const AlreadyVoted: Story = {
  args: {
    matchId: '63',
    status: 'running',
    band1Name: 'Yeah Yeah Yeahs',
    band1Image: 'https://placehold.co/200x200?text=YYYs',
    band2Name: 'R.E.M.',
    band2Image: 'https://placehold.co/200x200?text=REM',
    band1Pct: '48%',
    band2Pct: '52%',
    showResults: true,
    hasVoted: true,
    timerText: '19:47:01',
  },
};

/** User not logged in — "Log in to vote" links instead of vote buttons. */
export const NeedsLogin: Story = {
  args: {
    matchId: '63',
    status: 'running',
    band1Name: 'Yeah Yeah Yeahs',
    band1Image: 'https://placehold.co/200x200?text=YYYs',
    band2Name: 'R.E.M.',
    band2Image: 'https://placehold.co/200x200?text=REM',
    band1Pct: '48%',
    band2Pct: '52%',
    showResults: true,
    loginUrl: 'auth_login.php?returnTo=/madness',
    timerText: '19:47:01',
  },
};

/** Running match with sponsor info below the card. */
export const WithSponsor: Story = {
  args: {
    matchId: '63',
    status: 'running',
    band1Name: 'Yeah Yeah Yeahs',
    band1Image: 'https://placehold.co/200x200?text=YYYs',
    band2Name: 'R.E.M.',
    band2Image: 'https://placehold.co/200x200?text=REM',
    band1Pct: '48%',
    band2Pct: '52%',
    showResults: true,
    timerText: '19:47:01',
    sponsor: 'Guitar Center',
    sponsorMsg: 'Your ultimate music destination',
  },
};

/** Completed match with winner and sponsor info. */
export const CompletedWithSponsor: Story = {
  args: {
    matchId: '63',
    status: 'over',
    band1Name: 'Yeah Yeah Yeahs',
    band1Image: 'https://placehold.co/200x200?text=YYYs',
    band2Name: 'R.E.M.',
    band2Image: 'https://placehold.co/200x200?text=REM',
    band1Pct: '38%',
    band2Pct: '62%',
    showResults: true,
    winner: '2',
    sponsor: 'Guitar Center',
    sponsorMsg: 'Your ultimate music destination',
  },
};
