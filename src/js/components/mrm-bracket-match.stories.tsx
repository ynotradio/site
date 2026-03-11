import React, { useEffect, useRef } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

// eslint-disable-next-line import/extensions
import './mrm-bracket-match.js';
import '../../style/madness.css';

/**
 * Thin React wrapper so Storybook can render the custom element declaratively.
 * BEM hierarchy: .mrm-bracket > .mrm-bracket__region--{N} > .match
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

/** Provides .mrm-bracket > .mrm-bracket__region BEM context for stories. */
const BracketContext: React.FC<{
  regionModifier?: string;
  children: React.ReactNode;
}> = ({ regionModifier = '1', children }) => {
  const side = parseInt(regionModifier, 10) <= 2 ? 'left' : 'right';
  return (
    <div className="mrm-bracket" style={{ position: 'relative' }}>
      <div
        className={
          'mrm-bracket__region'
          + ` mrm-bracket__region--${regionModifier
          } mrm-bracket__region--${side}`
        }
        style={{ position: 'static', height: 'auto' }}
      >
        {children}
      </div>
    </div>
  );
};

const meta: Meta<typeof BracketMatchWrapper> = {
  title: 'MRM/BracketMatch',
  component: BracketMatchWrapper,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  argTypes: {
    winner: { control: 'select', options: ['', '1', '2'] },
    cssClass: { control: 'text' },
  },
  decorators: [
    (Story) => (
      <BracketContext>
        <Story />
      </BracketContext>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof BracketMatchWrapper>;

/** Left-side match with right-rounded corners (region 1/2). */
export const Default: Story = {
  args: {
    band1Seed: '1',
    band1Name: 'JBrekie',
    band2Seed: '16',
    band2Name: 'ChlyBls',
    matchId: '1',
    cssClass: 'match left',
  },
};

/** Completed match with scores visible. */
export const WithScores: Story = {
  args: {
    band1Seed: '5',
    band1Name: 'Clash',
    band1Pct: '53%',
    band2Seed: '4',
    band2Name: 'CHVRCHS',
    band2Pct: '47%',
    matchId: '5',
    cssClass: 'match left',
  },
};

/** Winner is bold, loser is greyed out. */
export const Winner: Story = {
  args: {
    band1Seed: '1',
    band1Name: 'JBrekie',
    band1Pct: '77%',
    band2Seed: '16',
    band2Name: 'ChlyBls',
    band2Pct: '23%',
    winner: '1',
    matchId: '1',
    cssClass: 'match left',
  },
};

/** Active match with black background and white text. */
export const LiveMatch: Story = {
  args: {
    band1Seed: '3',
    band1Name: 'YYYs',
    band2Seed: '2',
    band2Name: 'REM',
    matchId: '63',
    cssClass: 'match left live_match',
  },
};

/** Right-side match with left-rounded corners (region 3/4). */
export const RightSide: Story = {
  decorators: [
    (Story) => (
      <BracketContext regionModifier="3">
        <Story />
      </BracketContext>
    ),
  ],
  args: {
    band1Seed: '2',
    band1Name: 'MnqnPsy',
    band2Seed: '15',
    band2Name: 'SpdyOtz',
    matchId: '2',
    cssClass: 'match right',
  },
};

type MatchData = {
  s1: string; n1: string; p1?: string;
  s2: string; n2: string; p2?: string;
  w?: '1' | '2';
};

const renderMatches = (matches: MatchData[], cls: string) => matches.map((m, i) => (
  <BracketMatchWrapper
    key={i}
    band1Seed={m.s1} band1Name={m.n1} band1Pct={m.p1}
    band2Seed={m.s2} band2Name={m.n2} band2Pct={m.p2}
    winner={m.w} cssClass={cls} matchId={String(i + 1)}
  />
));

/** Round 1 column: 4 completed matches stacked vertically. */
export const BracketColumn: Story = {
  render: () => (
    <BracketContext>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {renderMatches([
          {
            s1: '1', n1: 'JBrekie', p1: '77%', s2: '16', n2: 'ChlyBls', p2: '23%', w: '1',
          },
          {
            s1: '8', n1: 'Wombts', p1: '49%', s2: '9', n2: 'Jpndrds', p2: '51%', w: '2',
          },
          {
            s1: '5', n1: 'Clash', p1: '62%', s2: '12', n2: 'Cake', p2: '38%', w: '1',
          },
          {
            s1: '4', n1: 'CHVRCHS', p1: '65%', s2: '13', n2: 'SlvnEso', p2: '35%', w: '1',
          },
        ], 'match left')}
      </div>
    </BracketContext>
  ),
};

/** Championship: gradient bg, rounded corners, 143x68px, 12px font. */
export const Championship: Story = {
  render: () => (
    <div className="mrm-bracket" style={{ position: 'relative' }}>
      <div
        className="mrm-bracket__championship"
        style={{ position: 'static', width: '425px', height: '100px' }}
      >
        <BracketMatchWrapper
          band1Seed="3" band1Name="YYYs" band1Pct="48%"
          band2Seed="2" band2Name="REM" band2Pct="52%"
          matchId="63" cssClass="match mrm-bracket__match--final"
        />
      </div>
    </div>
  ),
};

/** Round progression with connector lines via .round3 border-right. */
export const RoundProgression: Story = {
  render: () => (
    <div className="mrm-bracket" style={{ position: 'relative' }}>
      <div
        className="mrm-bracket__region mrm-bracket__region--1 mrm-bracket__region--left"
        style={{ position: 'relative', height: '500px', width: '450px' }}
      >
        <div className="round1">
          {renderMatches([
            {
              s1: '1', n1: 'JBrekie', p1: '62%', s2: '16', n2: 'ChlyBls', p2: '38%', w: '1',
            },
            {
              s1: '8', n1: 'Wombts', p1: '62%', s2: '9', n2: 'Jpndrds', p2: '38%', w: '2',
            },
            {
              s1: '5', n1: 'Clash', p1: '62%', s2: '12', n2: 'Cake', p2: '38%', w: '1',
            },
            {
              s1: '4', n1: 'CHVRCHS', p1: '62%', s2: '13', n2: 'SlvnEso', p2: '38%', w: '1',
            },
          ], 'match left')}
        </div>
        <div className="round2">
          <BracketMatchWrapper
            band1Seed="1" band1Name="JBrekie" band1Pct="55%"
            band2Seed="9" band2Name="Jpndrds" band2Pct="45%"
            winner="1" cssClass="match left" matchId="17"
          />
          <BracketMatchWrapper
            band1Seed="5" band1Name="Clash" band1Pct="48%"
            band2Seed="4" band2Name="CHVRCHS" band2Pct="52%"
            winner="2" cssClass="match left" matchId="18"
          />
        </div>
        <div className="round3">
          <BracketMatchWrapper
            band1Seed="1" band1Name="JBrekie"
            band2Seed="4" band2Name="CHVRCHS"
            cssClass="match left" matchId="25"
          />
        </div>
        <div className="round4">
          <BracketMatchWrapper
            band1Seed="1" band1Name="JBrekie"
            band2Seed="3" band2Name="YYYs"
            cssClass="match left" matchId="29"
          />
        </div>
      </div>
    </div>
  ),
};
