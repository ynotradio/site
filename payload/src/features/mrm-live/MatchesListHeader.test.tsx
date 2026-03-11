import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MatchesListHeader } from './MatchesListHeader';

describe('MatchesListHeader', () => {
  it('renders tip text about Match Controls tab', () => {
    render(<MatchesListHeader />);
    expect(screen.getByText(/Match Controls/)).toBeInTheDocument();
  });

  it('renders the Live Dashboard link', () => {
    render(<MatchesListHeader />);
    const link = screen.getByRole('link', { name: /Live Dashboard/ });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/admin/mrm-live');
  });
});
