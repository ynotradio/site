/**
 * Unit tests for RadioToolsNavLinks component
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  it('renders the Story Order link', () => {
    render(<RadioToolsNavLinks />);
    const storyOrderLink = screen.getByRole('link', { name: /Story Order/i });
    expect(storyOrderLink).toBeInTheDocument();
    expect(storyOrderLink).toHaveAttribute('href', '/admin/story-order');
  });

  it('renders the Show Cloner link', () => {
    render(<RadioToolsNavLinks />);
    const showClonerLink = screen.getByRole('link', { name: /Show Cloner/i });
    expect(showClonerLink).toBeInTheDocument();
    expect(showClonerLink).toHaveAttribute('href', '/admin/show-cloner');
  });

  it('renders the CD of the Week wizard link', () => {
    render(<RadioToolsNavLinks />);
    const wizardLink = screen.getByRole('link', { name: /New CD of the Week/i });
    expect(wizardLink).toBeInTheDocument();
    expect(wizardLink).toHaveAttribute('href', '/admin/cd-of-the-week-wizard');
  });

  it('renders emoji icons with the links', () => {
    render(<RadioToolsNavLinks />);
    expect(screen.getByText(/🎧/)).toBeInTheDocument();
    expect(screen.getByText(/📰/)).toBeInTheDocument();
    expect(screen.getByText(/📋/)).toBeInTheDocument();
    expect(screen.getByText(/💿/)).toBeInTheDocument();
  });

  it('has all four navigation links', () => {
    render(<RadioToolsNavLinks />);
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(4);
  });
});
