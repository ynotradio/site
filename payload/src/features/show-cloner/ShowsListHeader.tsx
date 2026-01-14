'use client';

import React from 'react';
import './ShowsListHeader.css';

/**
 * Component displayed above the Shows collection list view.
 * Provides a link to the Show Cloner tool styled as a Pill.
 */
export const ShowsListHeader: React.FC = () => (
  <div className="shows-list-header">
    <a href="/admin/show-cloner" className="shows-list-header__link">
      Show Cloner
    </a>
  </div>
);

export default ShowsListHeader;
