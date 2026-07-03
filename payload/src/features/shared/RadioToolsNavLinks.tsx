'use client';

import React from 'react';
import Link from 'next/link';
import './RadioToolsNavLinks.css';

// Custom navigation links for Radio Tools, styled to match Payload's native
// nav-group sections (see .nav-group / .nav__link in the admin theme).
export const RadioToolsNavLinks: React.FC = () => (
  <div className="nav-group radio-tools-nav">
    <div className="nav-group__label radio-tools-nav__label">Radio Tools</div>
    <div className="nav-group__content">
      <Link href="/admin/dj-order" className="nav__link">
        <span className="nav__link-label">🎧 DJ Order</span>
      </Link>
      <Link href="/admin/story-order" className="nav__link">
        <span className="nav__link-label">📰 Story Order</span>
      </Link>
      <Link href="/admin/show-cloner" className="nav__link">
        <span className="nav__link-label">📋 Show Cloner</span>
      </Link>
      <Link href="/admin/cd-of-the-week-wizard" className="nav__link">
        <span className="nav__link-label">💿 New CD of the Week + Album</span>
      </Link>
    </div>
  </div>
);

export default RadioToolsNavLinks;
