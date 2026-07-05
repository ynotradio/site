'use client';

import React from 'react';
import { ToolLinkPill } from '../shared/ToolLinkPill';

/**
 * Component displayed above the CDs of the Week collection list view.
 * Provides a link to the combined "Create CD of the Week + Album" wizard.
 */
export const CdOfTheWeekListHeader: React.FC = () => (
  <ToolLinkPill href="/admin/cd-of-the-week-wizard" label="New CD of the Week + Album" />
);

export default CdOfTheWeekListHeader;
