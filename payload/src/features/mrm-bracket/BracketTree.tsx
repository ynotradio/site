'use client';

import React from 'react';
import type { BracketMatch } from './types';
import {
  organizeForBracket,
  getBandAbbr,
  getBandSeed,
  getVotePcts,
  getCellStatus,
  getWinnerSlot,
} from './bracketUtils';
import type { RegionRounds } from './bracketUtils';
import './BracketTree.css';

const MATCH_CONTROLS_BASE = '/admin/collections/modern-rock-madness-matches';

/* ------------------------------------------------------------------ */
/* BracketCell — compact match cell for the bracket tree              */
/* ------------------------------------------------------------------ */

interface BracketCellProps {
  match: BracketMatch;
  className?: string;
}

const BracketCell: React.FC<BracketCellProps> = ({ match, className = '' }) => {
  const status = getCellStatus(match);
  const winner = getWinnerSlot(match);
  const pcts = status !== 'upcoming' ? getVotePcts(match) : null;

  const liveCls = status === 'live' ? ' bracket-tree__cell--live' : '';
  const cls = `bracket-tree__cell${liveCls} ${className}`.trim();

  const bandRow = (slot: '1' | '2') => {
    const band = slot === '1' ? match.band1 : match.band2;
    const pct = slot === '1' ? pcts?.b1 : pcts?.b2;
    const isWinner = winner === slot;
    const isLoser = winner != null && winner !== slot;

    let rowCls = '';
    if (isWinner) rowCls = ' bracket-tree__winner';
    else if (isLoser) rowCls = ' bracket-tree__loser';
    return (
      <dt className={rowCls.trim()}>
        <span className="bracket-tree__seed">{getBandSeed(band)}</span>
        <span className="bracket-tree__abbr">{getBandAbbr(band)}</span>
        {pct != null && <span className="bracket-tree__pct">{pct}</span>}
      </dt>
    );
  };

  return (
    <a
      href={`${MATCH_CONTROLS_BASE}/${match.id}/controls`}
      className={cls}
      title={`Match #${match.matchNumber}`}
    >
      <dl>
        {bandRow('1')}
        {bandRow('2')}
      </dl>
    </a>
  );
};

/* ------------------------------------------------------------------ */
/* Region — renders 4 rounds within a bracket region                  */
/* ------------------------------------------------------------------ */

interface RegionProps {
  data: RegionRounds;
  regionNum: 1 | 2 | 3 | 4;
}

const Region: React.FC<RegionProps> = ({ data, regionNum }) => {
  const side = regionNum <= 2 ? 'left' : 'right';
  const cls = `bracket-tree__region bracket-tree__region--${regionNum} bracket-tree__region--${side}`;

  return (
    <div className={cls}>
      {(['round1', 'round2', 'round3', 'round4'] as const).map((roundKey, i) => (
        <div key={roundKey} className={`bracket-tree__round bracket-tree__round--${i + 1}`}>
          {data[roundKey].map((m) => (
            <BracketCell key={m.id} match={m} />
          ))}
        </div>
      ))}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* BracketTree — full bracket visualization                           */
/* ------------------------------------------------------------------ */

export interface BracketTreeProps {
  matches: BracketMatch[];
}

export const BracketTree: React.FC<BracketTreeProps> = ({ matches }) => {
  const layout = organizeForBracket(matches);

  return (
    <div className="bracket-tree__scroll">
      <div className="bracket-tree">
        {([1, 2, 3, 4] as const).map((r) => (
          <Region key={r} regionNum={r} data={layout.regions[r]} />
        ))}

        <div className="bracket-tree__championship">
          {layout.semiLeft && (
            <BracketCell match={layout.semiLeft} className="bracket-tree__semi--left" />
          )}
          {layout.final && <BracketCell match={layout.final} className="bracket-tree__final" />}
          {layout.semiRight && (
            <BracketCell match={layout.semiRight} className="bracket-tree__semi--right" />
          )}
        </div>
      </div>
    </div>
  );
};

export default BracketTree;
