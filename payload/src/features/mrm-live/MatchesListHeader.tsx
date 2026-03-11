'use client';

import React from 'react';
import './MatchesListHeader.css';

/**
 * Header displayed above the Madness Matches collection list.
 * Points users to the Match Controls tab and the Live Dashboard.
 */
export const MatchesListHeader: React.FC = () => (
  <div className="matches-list-header">
    <span className="matches-list-header__tip">
      💡 Click a match, then use the <strong>Match Controls</strong> tab for live management.
    </span>
    <a href="/admin/mrm-live" className="matches-list-header__link">
      📡 Live Dashboard
    </a>
  </div>
);

export default MatchesListHeader;
