import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MatchesListHeader } from './MatchesListHeader';

describe('MatchesListHeader', () => {
  it('renders the Live Match Dashboard link', () => {
    render(<MatchesListHeader />);
    const link = screen.getByRole('link', { name: 'Live Match Dashboard' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/admin/mrm-live');
  });
});
