// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ToolLinkPill } from './ToolLinkPill';

describe('ToolLinkPill', () => {
  it('renders the link with the given label and href', () => {
    render(<ToolLinkPill href="/admin/dj-order" label="DJ Sort Order" />);

    const link = screen.getByRole('link', { name: 'DJ Sort Order' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/admin/dj-order');
  });

  it('applies the tool-link-pill classes', () => {
    const { container } = render(<ToolLinkPill href="/admin/show-cloner" label="Show Cloner" />);

    expect(container.querySelector('.tool-link-pill-row')).toBeInTheDocument();
    expect(container.querySelector('.tool-link-pill')).toBeInTheDocument();
  });
});
