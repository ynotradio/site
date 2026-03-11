import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MatchesListHeader } from './MatchesListHeader';

describe('MatchesListHeader', () => {
  it('renders tip text about Match Controls tab', () => {
    render(<MatchesListHeader />);
    expect(screen.getByText(/Match Controls/)).toBeInTheDocument();
  });
});
