'use client';

import React, { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import './ShowsListHeader.css';

export const ShowsListHeader: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (Array.from(searchParams.keys()).some((k) => k.startsWith('where'))) return;

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const iso = today.toISOString();

    const params = new URLSearchParams(searchParams.toString());
    params.set('where[or][0][and][0][date][greater_than_equal]', iso);
    params.set('sort', 'date');
    params.set('groupBy', 'date');
    if (!params.has('limit')) params.set('limit', '10');
    router.replace(`?${params.toString()}`);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="shows-list-header">
      <a href="/admin/show-cloner" className="shows-list-header__link">
        Show Cloner
      </a>
    </div>
  );
};

export default ShowsListHeader;
