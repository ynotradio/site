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

    const wrapper = container.querySelector('.shows-list-header');
    expect(wrapper).toBeInTheDocument();

    const link = container.querySelector('.shows-list-header__link');
    expect(link).toBeInTheDocument();
  });

  it('renders as a navigation link', () => {
    render(<ShowsListHeader />);

    const link = screen.getByRole('link', { name: 'Show Cloner' });
    expect(link).toBeInTheDocument();
  });
});
