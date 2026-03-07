// Live Match Dashboard — Server Component wrapper
import React from 'react';
import { DefaultTemplate } from '@payloadcms/next/templates';
import type { AdminViewServerProps } from 'payload';
import { LiveMatchClient } from './LiveMatchClient';

export const LiveMatchTool: React.FC<AdminViewServerProps> = ({
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
    <LiveMatchClient />
  </DefaultTemplate>
);

export default LiveMatchTool;
