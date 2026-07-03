'use client';

import React from 'react';
import { ToolLinkPill } from '../shared/ToolLinkPill';

/**
 * Component displayed above the Stories (Posts) collection list view.
 * Provides a link to the Story Order tool styled as a Pill.
 */
export const PostsListHeader: React.FC = () => (
  <ToolLinkPill href="/admin/story-order" label="Story Sort Order" />
);

export default PostsListHeader;
