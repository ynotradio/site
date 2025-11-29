// Empty state component when no DJs exist
import React from 'react';
import { Text } from '@sanity/ui';

export const EmptyState = () => (
  <Text align="center" size={2} style={{ padding: '20px' }} data-testid="empty-state">
    No DJs found. Create some DJs first.
  </Text>
);

export default EmptyState;
