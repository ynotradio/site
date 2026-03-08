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
      src="/ynot-logo.png"
      alt="Y-Not Radio"
      className="ynot-logo__image"
      width={250}
      height={111}
    />
  </div>
);

export default Logo;
