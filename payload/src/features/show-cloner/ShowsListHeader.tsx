'use client';

import React from 'react';
import './ShowsListHeader.css';

export const ShowsListHeader: React.FC = () => (
  <div className="shows-list-header">
    <a href="/admin/show-cloner" className="shows-list-header__link">
      Show Cloner
    </a>
  </div>
);

export default ShowsListHeader;
