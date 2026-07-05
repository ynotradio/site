import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TimeCell } from './TimeCell';

const field = { name: 'startTime', type: 'text' as const };

describe('TimeCell', () => {
  it('formats midnight correctly', () => {
    render(<TimeCell cellData="00:00" field={field} collectionSlug="shows" rowData={{}} />);
    expect(screen.getByText('12:00 AM')).toBeInTheDocument();
  });

  it('formats noon correctly', () => {
    render(<TimeCell cellData="12:00" field={field} collectionSlug="shows" rowData={{}} />);
    expect(screen.getByText('12:00 PM')).toBeInTheDocument();
  });

  it('formats a morning time', () => {
    render(<TimeCell cellData="09:00" field={field} collectionSlug="shows" rowData={{}} />);
    expect(screen.getByText('9:00 AM')).toBeInTheDocument();
  });

  it('formats an afternoon time', () => {
    render(<TimeCell cellData="14:30" field={field} collectionSlug="shows" rowData={{}} />);
    expect(screen.getByText('2:30 PM')).toBeInTheDocument();
  });

  it('handles HH:MM:SS format (strips seconds)', () => {
    render(<TimeCell cellData="09:00:00" field={field} collectionSlug="shows" rowData={{}} />);
    expect(screen.getByText('9:00 AM')).toBeInTheDocument();
  });

  it('renders em dash for null', () => {
    render(<TimeCell cellData={null} field={field} collectionSlug="shows" rowData={{}} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('renders em dash for empty string', () => {
    render(<TimeCell cellData="" field={field} collectionSlug="shows" rowData={{}} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});
