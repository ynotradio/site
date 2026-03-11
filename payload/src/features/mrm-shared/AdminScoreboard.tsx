'use client';

import React from 'react';
import './AdminScoreboard.css';

export interface AdminScoreboardProps {
  band1Pct: number;
  band2Pct: number;
  band1Label?: string;
  band2Label?: string;
}

/**
 * React equivalent of the `<mrm-scoreboard>` web component.
 * Renders a two-tone bar (orange ← | → blue) sized to vote percentages.
 */
export const AdminScoreboard: React.FC<AdminScoreboardProps> = ({
  band1Pct,
  band2Pct,
  band1Label = '',
  band2Label = '',
}) => {
  const noVotes = band1Pct === 0 && band2Pct === 0;
  const b1Width = noVotes ? 50 : band1Pct;
  const b2Width = noVotes ? 50 : band2Pct;

  return (
    <div
      className="admin-scoreboard"
      role="img"
      aria-label={`Score: ${band1Label} vs ${band2Label}`}
    >
      <span className="admin-scoreboard__score admin-scoreboard__score--band1">{band1Label}</span>
      <span
        className="admin-scoreboard__bar admin-scoreboard__bar--band1"
        style={{ flexBasis: `${b1Width}%` }}
      />
      <span
        className="admin-scoreboard__bar admin-scoreboard__bar--band2"
        style={{ flexBasis: `${b2Width}%` }}
      />
      <span className="admin-scoreboard__score admin-scoreboard__score--band2">{band2Label}</span>
    </div>
  );
};

export default AdminScoreboard;
