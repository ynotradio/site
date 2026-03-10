import React, { useEffect, useRef } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

// eslint-disable-next-line import/extensions
import './MrmScoreboard.js';

interface ScoreboardProps {
  band1Pct?: string;
  band2Pct?: string;
  band1Label?: string;
  band2Label?: string;
}

const ScoreboardWrapper: React.FC<ScoreboardProps> = ({
  band1Pct, band2Pct, band1Label, band2Label,
}) => {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const setAttr = (name: string, value?: string) => {
      if (value != null && value !== '') el.setAttribute(name, value);
      else el.removeAttribute(name);
    };
    setAttr('band1-pct', band1Pct);
    setAttr('band2-pct', band2Pct);
    setAttr('band1-label', band1Label);
    setAttr('band2-label', band2Label);
  });

  return React.createElement('mrm-scoreboard', { ref, style: { maxWidth: '880px' } });
};

const meta: Meta<typeof ScoreboardWrapper> = {
  title: 'MRM/Scoreboard',
  component: ScoreboardWrapper,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof ScoreboardWrapper>;

export const EvenSplit: Story = {
  args: {
    band1Pct: '50', band2Pct: '50', band1Label: '50%', band2Label: '50%',
  },
};

export const Band1Leading: Story = {
  args: {
    band1Pct: '68', band2Pct: '32', band1Label: '68%', band2Label: '32%',
  },
};

export const Band2Leading: Story = {
  args: {
    band1Pct: '35', band2Pct: '65', band1Label: '35%', band2Label: '65%',
  },
};

export const Blowout: Story = {
  args: {
    band1Pct: '92', band2Pct: '8', band1Label: '92%', band2Label: '8%',
  },
};

export const NoVotesYet: Story = {
  args: {
    band1Pct: '0', band2Pct: '0', band1Label: '0%', band2Label: '0%',
  },
};
