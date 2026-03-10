import React, { useEffect, useRef } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

/* Side-effect import registers the <mrm-bracket-match> custom element. */
// eslint-disable-next-line import/extensions
import './MrmBracketMatch.js';

/* Import the PHP site's madness.css so light-DOM class names are styled. */
import '../../style/madness.css';

/**
 * Thin React wrapper so Storybook can render the custom element declaratively.
 * In production PHP pages, the element is used directly in HTML with
 * class="match left|right live_match" for external CSS positioning.
 */
interface BracketMatchProps {
  band1Seed?: string;
  band1Name?: string;
  band1Pct?: string;
  band2Seed?: string;
  band2Name?: string;
  band2Pct?: string;
  winner?: '' | '1' | '2';
  matchId?: string;
  cssClass?: string;
}

const BracketMatchWrapper: React.FC<BracketMatchProps> = ({
  band1Seed, band1Name, band1Pct,
  band2Seed, band2Name, band2Pct,
  winner, matchId, cssClass,
}) => {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const setAttr = (name: string, value?: string) => {
      if (value != null && value !== '') el.setAttribute(name, value);
      else el.removeAttribute(name);
    };

    setAttr('band1-seed', band1Seed);
    setAttr('band1-name', band1Name);
    setAttr('band1-pct', band1Pct);
    setAttr('band2-seed', band2Seed);
    setAttr('band2-name', band2Name);
    setAttr('band2-pct', band2Pct);
    setAttr('winner', winner);
    setAttr('match-id', matchId);
    if (cssClass) el.className = cssClass;
  });

  return React.createElement('mrm-bracket-match', { ref });
};

const meta: Meta<typeof BracketMatchWrapper> = {
  title: 'MRM/BracketMatch',
  component: BracketMatchWrapper,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Light-DOM web component for bracket match slots. Uses original CSS class names '
          + '(.band1, .band2, .seed, .band_abbr, .mrm_winner, .mrm_loser) for compatibility '
          + 'with the madness.css layout.',
      },
    },
  },
  argTypes: {
    winner: { control: 'select', options: ['', '1', '2'] },
    cssClass: {
      control: 'text',
      description: 'CSS classes on the host element (e.g. "match left", "match right live_match")',
    },
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
    cssClass: 'match left',
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
    cssClass: 'match left',
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
    cssClass: 'match left',
  },
};

export const LiveMatch: Story = {
  args: {
    band1Seed: '3',
    band1Name: 'Foo Fghtrs',
    band2Seed: '14',
    band2Name: 'Green Day',
    matchId: '3',
    cssClass: 'match right live_match',
  },
};

export const RightSide: Story = {
  args: {
    band1Seed: '2',
    band1Name: 'Pearl Jam',
    band2Seed: '15',
    band2Name: 'Smsh Mouth',
    matchId: '2',
    cssClass: 'match right',
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
          cssClass="match left"
          matchId={String(i + 1)}
        />
      ))}
    </div>
  ),
};
