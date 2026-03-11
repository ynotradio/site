import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { AdminBracketMatch } from './AdminBracketMatch';

const meta: Meta<typeof AdminBracketMatch> = {
  title: 'MRM / AdminBracketMatch',
  component: AdminBracketMatch,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 220 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof AdminBracketMatch>;

export const Default: Story = {
  args: {
    band1: { seed: 1, name: 'Japanese Breakfast' },
    band2: { seed: 16, name: 'Charly Bliss' },
    matchLabel: '#1',
    statusBadge: '⏳',
    href: '#',
  },
};

export const LiveMatch: Story = {
  args: {
    band1: { seed: 3, name: 'The YYYs', pct: '52%' },
    band2: { seed: 14, name: 'R.E.M.', pct: '48%' },
    live: true,
    matchLabel: '#7',
    statusBadge: '🔴 LIVE',
    href: '#',
  },
};

export const ClosedWithWinner: Story = {
  args: {
    band1: { seed: 1, name: 'Japanese Breakfast', pct: '68%' },
    band2: { seed: 16, name: 'Charly Bliss', pct: '32%' },
    winner: '1',
    matchLabel: '#1',
    statusBadge: '✅',
    href: '#',
  },
};

export const TBDMatch: Story = {
  args: {
    band1: null,
    band2: null,
    matchLabel: '#33',
    statusBadge: '⏳',
    href: '#',
  },
};

export const NoLink: Story = {
  args: {
    band1: { seed: 5, name: 'The Clash' },
    band2: { seed: 12, name: 'Blur' },
    matchLabel: '#5',
  },
};

export const BracketGrid: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 200px)', gap: 8 }}>
      {[
        {
          n: 1,
          b1: 'Japanese Breakfast',
          b2: 'Charly Bliss',
          s1: 1,
          s2: 16,
          w: '1' as const,
        },
        {
          n: 2,
          b1: 'The Smiths',
          b2: 'Pixies',
          s1: 8,
          s2: 9,
          w: '2' as const,
        },
        {
          n: 3,
          b1: 'Depeche Mode',
          b2: 'Sonic Youth',
          s1: 4,
          s2: 13,
          w: '1' as const,
        },
        {
          n: 4,
          b1: 'The Clash',
          b2: 'Blur',
          s1: 5,
          s2: 12,
          w: '1' as const,
        },
      ].map((m) => (
        <AdminBracketMatch
          key={m.n}
          band1={{ seed: m.s1, name: m.b1, pct: '62%' }}
          band2={{ seed: m.s2, name: m.b2, pct: '38%' }}
          winner={m.w}
          matchLabel={`#${m.n}`}
          statusBadge="✅"
          href="#"
        />
      ))}
    </div>
  ),
};
