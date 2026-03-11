'use client';

import React from 'react';
import './TournamentsListHeader.css';

/**
 * Tip displayed above the Madness Tournaments collection list.
 * Points users to the Bracket tab within each tournament's edit view.
 */
export const TournamentsListHeader: React.FC = () => (
  <div className="tournaments-list-header">
    <span className="tournaments-list-header__tip">
      💡 Click a tournament, then use the <strong>Bracket</strong> tab to view its full bracket.
    </span>
  </div>
);

export default TournamentsListHeader;
