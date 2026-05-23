'use client';

import React, { useEffect, useRef } from 'react';
import { useListQuery } from '@payloadcms/ui';
import './ShowsListHeader.css';

export const ShowsListHeader: React.FC = () => {
  const { query, handleWhereChange, handleSortChange } = useListQuery();
  const applied = useRef(false);

  useEffect(() => {
    if (applied.current) return;
    // Only apply default if no where filter is already active
    if (query?.where) return;

    applied.current = true;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    handleWhereChange({
      or: [{ and: [{ date: { greater_than_equal: today.toISOString() } }] }],
    });
    handleSortChange('startTime');
  }, [query, handleWhereChange, handleSortChange]);

  return (
    <div className="shows-list-header">
      <a href="/admin/show-cloner" className="shows-list-header__link">
        Show Cloner
      </a>
    </div>
  );
};

export default ShowsListHeader;
