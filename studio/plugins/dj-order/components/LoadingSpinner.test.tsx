import { describe, it, expect } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import { ThemeProvider, studioTheme } from '@sanity/ui';
import { LoadingSpinner } from './LoadingSpinner';

// Wrapper for Sanity UI components
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={studioTheme}>{children}</ThemeProvider>
);

describe('LoadingSpinner', () => {
  it('renders the loading spinner', () => {
    const { container } = render(<LoadingSpinner />, { wrapper });
    expect(container.querySelector('[data-sanity-icon="spinner"]')).toBeInTheDocument();
  });
});
