'use client';

import React from 'react';
import './EmptyState.css';

interface EmptyStateProps {
  message?: string;
}

export const EmptyState = ({ message = 'No items found.' }: EmptyStateProps) => (
  <div className="empty-state">{message}</div>
);

export default EmptyState;
