import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, studioTheme } from '@sanity/ui';
import { ShowRow } from './ShowRow';
import { Show } from '../types';

// Wrapper for Sanity UI components
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={studioTheme}>{children}</ThemeProvider>
);

describe('ShowRow', () => {
  const mockShow: Show = {
    _id: 'show-1',
    date: '2024-01-15',
    startTime: '09:00',
    endTime: '12:00',
    host: 'DJ Test',
    note: 'Morning Show',
  };

  it('renders show host name', () => {
    render(<ShowRow show={mockShow} />, { wrapper });
    expect(screen.getByText(/DJ Test/)).toBeInTheDocument();
  });

  it('renders show time range', () => {
    render(<ShowRow show={mockShow} />, { wrapper });
    expect(screen.getByText('09:00 - 12:00')).toBeInTheDocument();
  });

  it('renders show note', () => {
    render(<ShowRow show={mockShow} />, { wrapper });
    expect(screen.getByText(/Morning Show/)).toBeInTheDocument();
  });

  it('renders without note when not provided', () => {
    const showWithoutNote: Show = {
      _id: 'show-2',
      date: '2024-01-15',
      startTime: '13:00',
      endTime: '17:00',
      host: 'Another DJ',
    };
    render(<ShowRow show={showWithoutNote} />, { wrapper });
    expect(screen.getByText(/Another DJ/)).toBeInTheDocument();
    expect(screen.getByText('13:00 - 17:00')).toBeInTheDocument();
  });
});
