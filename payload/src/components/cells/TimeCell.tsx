'use client';

import React from 'react';
import type { DefaultCellComponentProps } from 'payload';

function formatAmPm(value: unknown): string {
  if (!value || typeof value !== 'string') return '—';
  const [hStr = '0', mStr = '0'] = value.split(':');
  const h24 = parseInt(hStr, 10);
  const m = mStr.padStart(2, '0');
  const ampm = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

export const TimeCell: React.FC<DefaultCellComponentProps> = ({ cellData }) => (
  <span style={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
    {formatAmPm(cellData)}
  </span>
);

export default TimeCell;
