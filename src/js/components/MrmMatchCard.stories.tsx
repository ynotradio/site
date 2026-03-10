import React, { useEffect, useRef } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

// eslint-disable-next-line import/extensions
import './MrmMatchCard.js';

interface MatchCardProps {
  matchId?: string;
  status?: 'running' | 'early' | 'over';
  band1Name?: string;
  band1Image?: string;
  band2Name?: string;
  band2Image?: string;
  band1Pct?: string;
  band2Pct?: string;
  showResults?: boolean;
  hasVoted?: boolean;
  sponsor?: string;
  sponsorMsg?: string;
}

const MatchCardWrapper: React.FC<MatchCardProps> = ({
  matchId, status,
  band1Name, band1Image, band2Name, band2Image,
  band1Pct, band2Pct,
  showResults, hasVoted,
  sponsor, sponsorMsg,
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
    setAttr('band2-name', band2Name);
    setAttr('band2-image', band2Image);
    setAttr('band1-pct', band1Pct);
    setAttr('band2-pct', band2Pct);
    setAttr('show-results', showResults);
    setAttr('has-voted', hasVoted);
    setAttr('sponsor', sponsor);
    setAttr('sponsor-msg', sponsorMsg);
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
  },
};

export default meta;
type Story = StoryObj<typeof MatchCardWrapper>;

export const LiveMatch: Story = {
  args: {
    matchId: '42',
    status: 'running',
    band1Name: 'Radiohead',
    band1Image: 'https://placehold.co/200x200?text=Radiohead',
    band2Name: 'Muse',
    band2Image: 'https://placehold.co/200x200?text=Muse',
  },
};

export const UpcomingMatch: Story = {
  args: {
    matchId: '43',
    status: 'early',
    band1Name: 'Foo Fighters',
    band1Image: 'https://placehold.co/200x200?text=Foo+Fighters',
    band2Name: 'Green Day',
    band2Image: 'https://placehold.co/200x200?text=Green+Day',
  },
};

export const CompletedMatch: Story = {
  args: {
    matchId: '41',
    status: 'over',
    band1Name: 'Pearl Jam',
    band1Image: 'https://placehold.co/200x200?text=Pearl+Jam',
    band2Name: 'Nirvana',
    band2Image: 'https://placehold.co/200x200?text=Nirvana',
    band1Pct: '62%',
    band2Pct: '38%',
    showResults: true,
  },
};

export const AlreadyVoted: Story = {
  args: {
    matchId: '42',
    status: 'running',
    band1Name: 'Radiohead',
    band1Image: 'https://placehold.co/200x200?text=Radiohead',
    band2Name: 'Muse',
    band2Image: 'https://placehold.co/200x200?text=Muse',
    hasVoted: true,
  },
};

export const WithSponsor: Story = {
  args: {
    matchId: '42',
    status: 'running',
    band1Name: 'Radiohead',
    band1Image: 'https://placehold.co/200x200?text=Radiohead',
    band2Name: 'Muse',
    band2Image: 'https://placehold.co/200x200?text=Muse',
    sponsor: 'Acme Records',
    sponsorMsg: 'Tune in every day for Modern Rock Madness!',
  },
};

export const CompletedWithSponsor: Story = {
  args: {
    matchId: '41',
    status: 'over',
    band1Name: 'Pearl Jam',
    band1Image: 'https://placehold.co/200x200?text=Pearl+Jam',
    band2Name: 'Nirvana',
    band2Image: 'https://placehold.co/200x200?text=Nirvana',
    band1Pct: '55%',
    band2Pct: '45%',
    showResults: true,
    sponsor: 'Guitar Center',
    sponsorMsg: 'Your ultimate music destination',
  },
};
