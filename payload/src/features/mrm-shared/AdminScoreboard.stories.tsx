import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { AdminScoreboard } from './AdminScoreboard';

const meta: Meta<typeof AdminScoreboard> = {
  title: 'MRM / AdminScoreboard',
  component: AdminScoreboard,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 500 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof AdminScoreboard>;

export const EvenSplit: Story = {
  args: {
    band1Pct: 50,
    band2Pct: 50,
    band1Label: '50%',
    band2Label: '50%',
  },
};

export const Band1Leading: Story = {
  args: {
    band1Pct: 68,
    band2Pct: 32,
    band1Label: '68%',
    band2Label: '32%',
  },
};

export const Band2Leading: Story = {
  args: {
    band1Pct: 35,
    band2Pct: 65,
    band1Label: '35%',
    band2Label: '65%',
  },
};

export const Blowout: Story = {
  args: {
    band1Pct: 92,
    band2Pct: 8,
    band1Label: '92%',
    band2Label: '8%',
  },
};

export const NoVotesYet: Story = {
  args: {
    band1Pct: 0,
    band2Pct: 0,
    band1Label: '0',
    band2Label: '0',
  },
};
