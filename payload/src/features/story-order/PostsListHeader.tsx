'use client';

import React from 'react';
import './PostsListHeader.css';

/**
 * Component displayed above the Stories (Posts) collection list view.
 * Provides a link to the Story Order tool styled as a Pill.
 */
export const PostsListHeader: React.FC = () => (
  <div className="posts-list-header">
    <a href="/admin/story-order" className="posts-list-header__link">
      Story Sort Order
    </a>
  </div>
);

export default PostsListHeader;
