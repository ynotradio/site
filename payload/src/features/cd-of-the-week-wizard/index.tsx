import React from 'react';
import { DefaultTemplate } from '@payloadcms/next/templates';
import type { AdminViewServerProps } from 'payload';
import { CdOfTheWeekWizardClient } from './CdOfTheWeekWizardClient';

const REQUIRED_COLLECTIONS = ['cdoftheweek', 'records', 'artists', 'people', 'media'] as const;

export const CdOfTheWeekWizardTool: React.FC<AdminViewServerProps> = ({
  initPageResult,
  params,
  searchParams,
}) => {
  const existingVisibleCollections = initPageResult.visibleEntities?.collections ?? [];
  const visibleEntities = {
    ...(initPageResult.visibleEntities ?? { globals: [] }),
    collections: Array.from(new Set([...existingVisibleCollections, ...REQUIRED_COLLECTIONS])),
    globals: initPageResult.visibleEntities?.globals ?? [],
  };

  return (
    <DefaultTemplate
      i18n={initPageResult.req.i18n}
      locale={initPageResult.locale}
      params={params}
      payload={initPageResult.req.payload}
      permissions={initPageResult.permissions}
      searchParams={searchParams}
      user={initPageResult.req.user || undefined}
      visibleEntities={visibleEntities}
    >
      <CdOfTheWeekWizardClient />
    </DefaultTemplate>
  );
};

export default CdOfTheWeekWizardTool;
