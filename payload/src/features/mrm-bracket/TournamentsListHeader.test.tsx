import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TournamentsListHeader } from './TournamentsListHeader';

describe('TournamentsListHeader', () => {
  it('renders the Bracket Overview link', () => {
    render(<TournamentsListHeader />);
    const link = screen.getByRole('link', { name: 'Bracket Overview' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/admin/mrm-bracket');
  });
});
