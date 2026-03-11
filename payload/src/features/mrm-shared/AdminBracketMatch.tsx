'use client';

import React from 'react';
import './AdminBracketMatch.css';

export interface BracketMatchBand {
  seed?: number | string;
  name: string;
  pct?: string;
}

export interface AdminBracketMatchProps {
  band1?: BracketMatchBand | null;
  band2?: BracketMatchBand | null;
  /** "1" or "2" — which band won */
  winner?: '1' | '2' | null;
  /** Whether this match is currently live */
  live?: boolean;
  /** URL to navigate to when clicked */
  href?: string;
  /** Match number label (e.g. "#7") */
  matchLabel?: string;
  /** Status badge text (e.g. "🔴 LIVE") */
  statusBadge?: string;
}

const BandRow: React.FC<{
  band: BracketMatchBand | null | undefined;
  slot: 'band1' | 'band2';
  winnerSlot: '1' | '2' | null | undefined;
}> = ({ band, slot, winnerSlot }) => {
  const slotNum = slot === 'band1' ? '1' : '2';
  const isWinner = winnerSlot === slotNum;
  const isLoser = winnerSlot != null && winnerSlot !== slotNum;

  const className = [slot, isWinner ? 'mrm_winner' : '', isLoser ? 'mrm_loser' : '']
    .filter(Boolean)
    .join(' ');

  if (!band) {
    return (
      <dt className={className}>
        <span className="seed" />
        <span className="band_abbr">(TBD)</span>
      </dt>
    );
  }

  return (
    <dt className={className}>
      <span className="seed">{band.seed ?? ''}</span>
      <span className="band_abbr">{band.name}</span>
      {band.pct != null && <span className="percentage">{band.pct}</span>}
    </dt>
  );
};

/**
 * React equivalent of the `<mrm-bracket-match>` web component.
 * Renders the same HTML structure with the same CSS class names,
 * plus optional admin features like edit links and status badges.
 */
export const AdminBracketMatch: React.FC<AdminBracketMatchProps> = ({
  band1,
  band2,
  winner,
  live = false,
  href,
  matchLabel,
  statusBadge,
}) => {
  const inner = (
    <div className={`admin-bracket-match${live ? ' admin-bracket-match--live' : ''}`}>
      {(matchLabel || statusBadge) && (
        <div className="admin-bracket-match__header">
          {matchLabel && <span className="admin-bracket-match__label">{matchLabel}</span>}
          {statusBadge && <span className="admin-bracket-match__badge">{statusBadge}</span>}
        </div>
      )}
      <dl>
        <BandRow band={band1} slot="band1" winnerSlot={winner} />
        <BandRow band={band2} slot="band2" winnerSlot={winner} />
      </dl>
    </div>
  );

  if (href) {
    return (
      <a
        href={href}
        className="admin-bracket-match__link"
        aria-label={`${matchLabel ?? 'Match'}: ${band1?.name ?? 'TBD'} vs ${band2?.name ?? 'TBD'}`}
      >
        {inner}
      </a>
    );
  }

  return inner;
};

export default AdminBracketMatch;
