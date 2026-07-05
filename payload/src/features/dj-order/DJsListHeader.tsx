'use client';

import React from 'react';
import { ToolLinkPill } from '../shared/ToolLinkPill';

/**
 * Component displayed above the DJs collection list view.
 * Provides a link to the DJ Order tool styled as a Pill.
 */
export const DJsListHeader: React.FC = () => (
  <ToolLinkPill href="/admin/dj-order" label="DJ Sort Order" />
);

export default DJsListHeader;
