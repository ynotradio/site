'use client';

import React from 'react';
import './MatchesListHeader.css';

/**
 * Link displayed above the Madness Matches collection list.
 * Takes the admin directly to the Live Match Dashboard.
 */
export const MatchesListHeader: React.FC = () => (
  <div className="matches-list-header">
    <a href="/admin/mrm-live" className="matches-list-header__link">
      Live Match Dashboard
    </a>
  </div>
);

export default MatchesListHeader;
