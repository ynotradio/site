'use client';

import React from 'react';
import { useRowLabel } from '@payloadcms/ui';

const StaffPickRowLabel: React.FC = () => {
  const { data, rowNumber } = useRowLabel<{ artist?: string | null; title?: string | null }>();
  const text = [data?.artist?.trim(), data?.title?.trim()].filter(Boolean).join(' - ');
  return <>{`${(rowNumber ?? 0) + 1}. ${text || 'New pick'}`}</>;
};

export default StaffPickRowLabel;
