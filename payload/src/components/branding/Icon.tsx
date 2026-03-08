'use client';

import React from 'react';
import './Icon.css';

/**
 * Y-Not Radio icon for the Payload admin navigation and favicon area.
 * Renders the oval Y-Not Radio logo at icon size.
 */
export const Icon: React.FC = () => (
  <div className="ynot-icon" aria-label="Y-Not Radio">
    <img src="/ynot-logo.svg" alt="Y-Not Radio" className="ynot-icon__image" />
  </div>
);

export default Icon;
