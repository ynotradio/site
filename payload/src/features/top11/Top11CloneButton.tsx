'use client';

import React, { useState } from 'react';
import { toast, useDocumentInfo } from '@payloadcms/ui';

export const Top11CloneButton: React.FC = () => {
  const { id } = useDocumentInfo();
  const [cloning, setCloning] = useState(false);

  if (!id) return null;

  const handleClick = async () => {
    setCloning(true);
    try {
      const res = await fetch('/api/top11-contests/clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceContestId: id }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.id) {
        throw new Error(body?.errors?.[0]?.message || 'Could not clone this contest.');
      }
      window.location.assign(`/admin/collections/top11-contests/${body.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not clone this contest.');
      setCloning(false);
    }
  };

  return (
    <button
      type="button"
      className="btn btn--style-secondary btn--size-medium"
      disabled={cloning}
      onClick={handleClick}
    >
      {cloning ? 'Cloning…' : 'Clone as New Draft'}
    </button>
  );
};
