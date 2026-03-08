'use client';

import React from 'react';
import './Logo.css';

/**
 * Y-Not Radio logo for the Payload admin login screen and header.
 * Renders the oval Y-Not Radio logo at display size.
 */
export const Logo: React.FC = () => (
  <div className="ynot-logo">
    <img
      src="/ynot-logo.svg"
      alt="Y-Not Radio"
      className="ynot-logo__image"
    />
  </div>
);

export default Logo;
