'use client';

import React from 'react';
import './DJsListHeader.css';

/**
 * Component displayed above the DJs collection list view.
 * Provides a link to the DJ Order tool styled as a Pill.
 */
export const DJsListHeader: React.FC = () => (
  <div className="djs-list-header">
    <a href="/admin/dj-order" className="djs-list-header__link">
      DJ Sort Order
    </a>
  </div>
);

export default DJsListHeader;
