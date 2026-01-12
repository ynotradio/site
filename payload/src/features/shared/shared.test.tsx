/**
 * Unit tests for shared UI components
 *
 * Tests the LoadingSpinner and EmptyState components used across features.
 */

import { describe, it, expect } from 'vitest';
import React from 'react';

// Import the components
import { LoadingSpinner } from './LoadingSpinner';
import { EmptyState } from './EmptyState';

describe('LoadingSpinner', () => {
  it('should be a React component', () => {
    expect(typeof LoadingSpinner).toBe('function');
  });

  it('should return a valid React element', () => {
    const element = LoadingSpinner();
    expect(React.isValidElement(element)).toBe(true);
  });
});

describe('EmptyState', () => {
  it('should be a React component', () => {
    expect(typeof EmptyState).toBe('function');
  });

  it('should return a valid React element', () => {
    const element = EmptyState({});
    expect(React.isValidElement(element)).toBe(true);
  });

  it('should accept message prop', () => {
    const element = EmptyState({ message: 'Custom message' });
    expect(React.isValidElement(element)).toBe(true);
  });
});
