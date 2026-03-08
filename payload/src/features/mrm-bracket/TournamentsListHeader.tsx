'use client';

import React from 'react';
import './TournamentsListHeader.css';

/**
 * Link displayed above the Madness Tournaments collection list.
 * Takes the admin directly to the Bracket Overview.
 */
export const TournamentsListHeader: React.FC = () => (
  <div className="tournaments-list-header">
    <a href="/admin/mrm-bracket" className="tournaments-list-header__link">
      Bracket Overview
    </a>
  </div>
);

export default TournamentsListHeader;
