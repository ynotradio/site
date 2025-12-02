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
  it('renders show with both name and DJ', () => {
    const mockShow: Show = {
      _id: 'show-1',
      date: '2024-01-15',
      startTime: '09:00',
      endTime: '12:00',
      name: 'The Nooner',
      djName: 'Dave Lindquist',
    };
    render(<ShowRow show={mockShow} />, { wrapper });
    expect(screen.getByText(/The Nooner w\/ Dave Lindquist/)).toBeInTheDocument();
  });

  it('renders show time range', () => {
    const mockShow: Show = {
      _id: 'show-1',
      date: '2024-01-15',
      startTime: '09:00',
      endTime: '12:00',
      djName: 'Test DJ',
    };
    render(<ShowRow show={mockShow} />, { wrapper });
    expect(screen.getByText('09:00 - 12:00')).toBeInTheDocument();
  });

  it('renders show with only DJ name', () => {
    const mockShow: Show = {
      _id: 'show-2',
      date: '2024-01-15',
      startTime: '13:00',
      endTime: '17:00',
      djName: 'Josh T. Landow',
    };
    render(<ShowRow show={mockShow} />, { wrapper });
    expect(screen.getByText(/Josh T. Landow/)).toBeInTheDocument();
  });

  it('renders show with only name (no DJ)', () => {
    const mockShow: Show = {
      _id: 'show-3',
      date: '2024-01-15',
      startTime: '18:00',
      endTime: '22:00',
      name: 'Y-Not Session Shuffle',
    };
    render(<ShowRow show={mockShow} />, { wrapper });
    expect(screen.getByText(/Y-Not Session Shuffle/)).toBeInTheDocument();
  });

  it('renders show note when provided', () => {
    const mockShow: Show = {
      _id: 'show-4',
      date: '2024-01-15',
      startTime: '09:00',
      endTime: '12:00',
      name: 'Morning Show',
      note: 'Special guest today',
    };
    render(<ShowRow show={mockShow} />, { wrapper });
    expect(screen.getByText(/Special guest today/)).toBeInTheDocument();
  });
});
