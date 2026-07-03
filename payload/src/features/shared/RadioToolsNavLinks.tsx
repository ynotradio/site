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
    <Link href="/admin/story-order" className="radio-tools-nav__link">
      📰 Story Order
    </Link>
    <Link href="/admin/show-cloner" className="radio-tools-nav__link">
      📋 Show Cloner
    </Link>
    <Link href="/admin/cd-of-the-week-wizard" className="radio-tools-nav__link">
      💿 New CD of the Week + Album
    </Link>
  </div>
);

export default RadioToolsNavLinks;
