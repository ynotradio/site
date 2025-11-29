import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, studioTheme } from '@sanity/ui';
import { EmptyState } from './EmptyState';

// Wrapper for Sanity UI components
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={studioTheme}>{children}</ThemeProvider>
);

describe('EmptyState', () => {
  it('renders the empty state message', () => {
    render(<EmptyState />, { wrapper });
    expect(screen.getByText('No DJs found. Create some DJs first.')).toBeInTheDocument();
  });
});
