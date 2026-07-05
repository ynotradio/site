'use client';

import React from 'react';
import './ToolLinkPill.css';

export interface ToolLinkPillProps {
  href: string;
  label: string;
}

/**
 * Red pill link rendered above a collection's list view (via the `beforeList`
 * admin slot), pointing to a related custom tool (e.g. DJ Order, Show Cloner).
 * Payload has no slot to place this inside the native title/Create New row,
 * so this renders as its own right-aligned row directly beneath the title.
 */
export const ToolLinkPill: React.FC<ToolLinkPillProps> = ({ href, label }) => (
  <div className="tool-link-pill-row">
    <a href={href} className="tool-link-pill">
      {label}
    </a>
  </div>
);

export default ToolLinkPill;
