import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CdOfTheWeekListHeader } from './CdOfTheWeekListHeader';

describe('CdOfTheWeekListHeader', () => {
  it('renders the wizard link', () => {
    render(<CdOfTheWeekListHeader />);

    const link = screen.getByRole('link', { name: /New CD of the Week \+ Album/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/admin/cd-of-the-week-wizard');
  });

  it('applies correct CSS classes', () => {
    const { container } = render(<CdOfTheWeekListHeader />);

    expect(container.querySelector('.cdotw-list-header')).toBeInTheDocument();
    expect(container.querySelector('.cdotw-list-header__link')).toBeInTheDocument();
  });

  it('renders as a navigation link', () => {
    render(<CdOfTheWeekListHeader />);

    const link = screen.getByRole('link');
    expect(link).toBeInTheDocument();
  });
});
