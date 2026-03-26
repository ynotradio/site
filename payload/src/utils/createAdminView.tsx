import React from 'react';
import { DefaultTemplate } from '@payloadcms/next/templates';
import type { AdminViewServerProps } from 'payload';

export function createAdminView(
  ClientComponent: React.ComponentType,
): React.FC<AdminViewServerProps> {
  const AdminView: React.FC<AdminViewServerProps> = ({ initPageResult, params, searchParams }) => (
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
      <ClientComponent />
    </DefaultTemplate>
  );
  return AdminView;
}
