// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ShowsListHeader } from './ShowsListHeader';

describe('ShowsListHeader', () => {
  it('renders the Show Cloner link', () => {
    render(<ShowsListHeader />);
    const link = screen.getByText('Show Cloner');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/admin/show-cloner');
  });

  it('applies correct CSS classes', () => {
    const { container } = render(<ShowsListHeader />);
    expect(container.querySelector('.tool-link-pill-row')).toBeInTheDocument();
    expect(container.querySelector('.tool-link-pill')).toBeInTheDocument();
  });

  it('renders as a navigation link', () => {
    render(<ShowsListHeader />);
    expect(screen.getByRole('link', { name: 'Show Cloner' })).toBeInTheDocument();
  });
});
