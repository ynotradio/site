'use client';

import React from 'react';
import type { CollectionConfig } from 'payload';

type StatusMessageParams = {
  config: Pick<CollectionConfig, 'fields' | 'labels'> | undefined;
  configLoaded: boolean;
  loading: boolean;
  error: string | null;
  collectionSlug: string;
  singularLabel: string;
  hasFields: boolean;
};

export const getInlineCollectionStatusMessage = ({
  config,
  configLoaded,
  loading,
  error,
  collectionSlug,
  singularLabel,
  hasFields,
}: StatusMessageParams): React.ReactNode => {
  if (!configLoaded || loading) {
    return <div style={{ padding: '2rem 0' }}>Loading form…</div>;
  }

  if (!config) {
    return (
      <div className="payload-error" style={{ color: 'var(--theme-error-500)' }}>
        {error || `Collection "${collectionSlug}" not found`}
      </div>
    );
  }

  if (!hasFields) {
    return <div>The {singularLabel} collection has no fields to display.</div>;
  }

  return null;
};
