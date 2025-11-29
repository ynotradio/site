// Loading spinner component
import React from 'react';
import { Flex, Spinner } from '@sanity/ui';

export const LoadingSpinner = () => (
  <Flex align="center" justify="center" padding={5} height="fill" data-testid="loading-spinner">
    <Spinner />
  </Flex>
);

export default LoadingSpinner;
