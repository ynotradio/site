'use client';

import React from 'react';
import './Logo.css';

/**
 * Y-Not Radio logo for the Payload admin login screen and header.
 * Displays the station name with brand styling.
 */
export const Logo: React.FC = () => (
  <div className="ynot-logo">
    <span className="ynot-logo__ynot">Y-Not</span>
    <span className="ynot-logo__radio">Radio</span>
    <span className="ynot-logo__cms">CMS</span>
  </div>
);

export default Logo;
