/**
 * Unit tests for RadioToolsNavLinks component
 */

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RadioToolsNavLinks } from './RadioToolsNavLinks';

describe('RadioToolsNavLinks', () => {
  it('renders the Radio Tools section header', () => {
    render(<RadioToolsNavLinks />);
    expect(screen.getByText('Radio Tools')).toBeInTheDocument();
  });

  it('renders the DJ Order link', () => {
    render(<RadioToolsNavLinks />);
    const djOrderLink = screen.getByRole('link', { name: /DJ Order/i });
    expect(djOrderLink).toBeInTheDocument();
    expect(djOrderLink).toHaveAttribute('href', '/admin/dj-order');
  });

  it('renders the Show Cloner link', () => {
    render(<RadioToolsNavLinks />);
    const showClonerLink = screen.getByRole('link', { name: /Show Cloner/i });
    expect(showClonerLink).toBeInTheDocument();
    expect(showClonerLink).toHaveAttribute('href', '/admin/show-cloner');
  });

  it('renders emoji icons with the links', () => {
    render(<RadioToolsNavLinks />);
    expect(screen.getByText(/🎧/)).toBeInTheDocument();
    expect(screen.getByText(/📋/)).toBeInTheDocument();
  });

  it('has both navigation links', () => {
    render(<RadioToolsNavLinks />);
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(2);
  });
});
