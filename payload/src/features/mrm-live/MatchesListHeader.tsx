'use client';

import React from 'react';
import './MatchesListHeader.css';

/**
 * Header displayed above the Madness Matches collection list.
 * Points users to the Match Controls tab.
 */
export const MatchesListHeader: React.FC = () => (
  <div className="matches-list-header">
    <span className="matches-list-header__tip">
      💡 Click a match, then use the <strong>Match Controls</strong> tab for live management.
    </span>
  </div>
);

export default MatchesListHeader;
