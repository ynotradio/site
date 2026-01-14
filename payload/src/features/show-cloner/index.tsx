// Show Cloner Tool - Server Component wrapper
import React from 'react';
import { DefaultTemplate } from '@payloadcms/next/templates';
import type { AdminViewServerProps } from 'payload';
import { ShowClonerClient } from './ShowClonerClient';

// Main Server Component for Show cloning
export const ShowClonerTool: React.FC<AdminViewServerProps> = ({
  initPageResult,
  params,
  searchParams,
}) => {
  return (
    <DefaultTemplate
      i18n={initPageResult.req.i18n}
      locale={initPageResult.locale}
      params={params}
      payload={initPageResult.req.payload}
      permissions={initPageResult.permissions}
      searchParams={searchParams}
      user={initPageResult.req.user || undefined}
      visibleEntities={initPageResult.visibleEntities}
    >
      <ShowClonerClient />
    </DefaultTemplate>
  );
};

export default ShowClonerTool;

