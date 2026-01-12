'use client';

// Empty state component
import React from 'react';

interface EmptyStateProps {
  message?: string;
}

export const EmptyState = ({ message = 'No items found.' }: EmptyStateProps) => (
  <div
    style={{
      textAlign: 'center',
      padding: '20px',
      color: '#666',
      fontSize: '14px',
    }}
  >
    {message}
  </div>
);

export default EmptyState;
