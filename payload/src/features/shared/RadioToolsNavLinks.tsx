'use client';

import React from 'react';
import Link from 'next/link';
import './RadioToolsNavLinks.css';

// Custom navigation links for Radio Tools
export const RadioToolsNavLinks: React.FC = () => (
  <div className="radio-tools-nav">
    <div className="radio-tools-nav__heading">Radio Tools</div>
    <Link href="/admin/dj-order" className="radio-tools-nav__link">
      🎧 DJ Order
    </Link>
    <Link href="/admin/show-cloner" className="radio-tools-nav__link">
      📋 Show Cloner
    </Link>
  </div>
);

export default RadioToolsNavLinks;
