// Empty state component when no shows exist
import React from 'react';
import { Text } from '@sanity/ui';

export const EmptyState = () => (
  <Text align="center" size={2} style={{ padding: '20px' }}>
    No shows found. Create some shows first.
  </Text>
);

export default EmptyState;
