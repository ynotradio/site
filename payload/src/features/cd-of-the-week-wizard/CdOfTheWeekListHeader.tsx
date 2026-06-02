'use client';

import React from 'react';
import './CdOfTheWeekListHeader.css';

/**
 * Component displayed above the CDs of the Week collection list view.
 * Provides a link to the combined "Create CD of the Week + Album" wizard.
 */
export const CdOfTheWeekListHeader: React.FC = () => (
  <div className="cdotw-list-header">
    <a href="/admin/cd-of-the-week-wizard" className="cdotw-list-header__link">
      ➕ New CD of the Week + Album
    </a>
  </div>
);

export default CdOfTheWeekListHeader;
