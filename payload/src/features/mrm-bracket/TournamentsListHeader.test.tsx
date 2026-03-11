import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TournamentsListHeader } from './TournamentsListHeader';

describe('TournamentsListHeader', () => {
  it('renders tip text about the Bracket tab', () => {
    render(<TournamentsListHeader />);
    expect(screen.getByText(/Bracket/)).toBeInTheDocument();
  });
});
