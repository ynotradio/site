// DJ Order Tool - Server Component wrapper
import React from 'react';
import { DefaultTemplate } from '@payloadcms/next/templates';
import type { AdminViewServerProps } from 'payload';
import { DJOrderClient } from './DJOrderClient';

// Main Server Component for DJ ordering
export const DJOrderTool: React.FC<AdminViewServerProps> = ({
  initPageResult,
  params,
  searchParams,
}) => (
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
    <DJOrderClient />
  </DefaultTemplate>
);

export default DJOrderTool;
