import React, { useEffect, useRef } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

/* Side-effect import registers the <mrm-bracket-match> custom element. */
// eslint-disable-next-line import/extensions
import './MrmBracketMatch.js';

/**
 * Thin React wrapper so Storybook can render the custom element declaratively.
 * In production PHP pages, the element is used directly in HTML.
 */
interface BracketMatchProps {
  band1Seed?: string;
  band1Name?: string;
  band1Pct?: string;
  band2Seed?: string;
  band2Name?: string;
  band2Pct?: string;
  winner?: '' | '1' | '2';
  live?: boolean;
  matchId?: string;
  side?: 'left' | 'right' | '';
}

const BracketMatchWrapper: React.FC<BracketMatchProps> = ({
  band1Seed, band1Name, band1Pct,
  band2Seed, band2Name, band2Pct,
  winner, live, matchId, side,
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

    setAttr('band1-seed', band1Seed);
    setAttr('band1-name', band1Name);
    setAttr('band1-pct', band1Pct);
    setAttr('band2-seed', band2Seed);
    setAttr('band2-name', band2Name);
    setAttr('band2-pct', band2Pct);
    setAttr('winner', winner);
    setAttr('live', live);
    setAttr('match-id', matchId);
    setAttr('side', side);
  });

  // React 19 passes unknown attributes through to custom elements,
  // but we use a ref for explicit control over boolean attributes.
  return React.createElement('mrm-bracket-match', { ref });
};

const meta: Meta<typeof BracketMatchWrapper> = {
  title: 'MRM/BracketMatch',
  component: BracketMatchWrapper,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  argTypes: {
    winner: { control: 'select', options: ['', '1', '2'] },
    side: { control: 'select', options: ['', 'left', 'right'] },
    live: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof BracketMatchWrapper>;

export const Default: Story = {
  args: {
    band1Seed: '1',
    band1Name: 'Radiohead',
    band2Seed: '16',
    band2Name: 'Weezer',
    matchId: '1',
    side: 'left',
  },
};

export const WithScores: Story = {
  args: {
    band1Seed: '4',
    band1Name: 'Muse',
    band1Pct: '55%',
    band2Seed: '13',
    band2Name: 'RHCP',
    band2Pct: '45%',
    matchId: '5',
    side: 'left',
  },
};

export const Winner: Story = {
  args: {
    band1Seed: '1',
    band1Name: 'Radiohead',
    band1Pct: '62%',
    band2Seed: '16',
    band2Name: 'Weezer',
    band2Pct: '38%',
    winner: '1',
    matchId: '1',
    side: 'left',
  },
};

export const LiveMatch: Story = {
  args: {
    band1Seed: '3',
    band1Name: 'Foo Fghtrs',
    band2Seed: '14',
    band2Name: 'Green Day',
    live: true,
    matchId: '3',
    side: 'right',
  },
};

export const RightSide: Story = {
  args: {
    band1Seed: '2',
    band1Name: 'Pearl Jam',
    band2Seed: '15',
    band2Name: 'Smsh Mouth',
    matchId: '2',
    side: 'right',
  },
};

/** Several bracket matches arranged vertically to simulate a bracket column. */
export const BracketColumn: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
      {[
        {
          s1: '1', n1: 'Radiohead', s2: '16', n2: 'Weezer',
        },
        {
          s1: '8', n1: 'Foo Fghtrs', s2: '9', n2: 'Green Day',
        },
        {
          s1: '4', n1: 'Muse', s2: '13', n2: 'RHCP',
        },
        {
          s1: '5', n1: 'Pearl Jam', s2: '12', n2: 'Smsh Mouth',
        },
      ].map((m, i) => (
        <BracketMatchWrapper
          key={i}
          band1Seed={m.s1}
          band1Name={m.n1}
          band2Seed={m.s2}
          band2Name={m.n2}
          side="left"
          matchId={String(i + 1)}
        />
      ))}
    </div>
  ),
};
