// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DJsListHeader } from './DJsListHeader';

describe('DJsListHeader', () => {
  it('renders the DJ Sort Order link', () => {
    render(<DJsListHeader />);

    const link = screen.getByText('DJ Sort Order');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/admin/dj-order');
  });

  it('applies correct CSS classes', () => {
    const { container } = render(<DJsListHeader />);

    const wrapper = container.querySelector('.tool-link-pill-row');
    expect(wrapper).toBeInTheDocument();

    const link = container.querySelector('.tool-link-pill');
    expect(link).toBeInTheDocument();
  });

  it('renders as a navigation link', () => {
    render(<DJsListHeader />);

    const link = screen.getByRole('link', { name: 'DJ Sort Order' });
    expect(link).toBeInTheDocument();
  });
});
