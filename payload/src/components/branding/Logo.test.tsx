import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Logo } from './Logo';

describe('Logo', () => {
  it('renders the Y-Not Radio logo image', () => {
    render(<Logo />);
    const img = screen.getByAltText('Y-Not Radio');
    expect(img).toBeInTheDocument();
  });

  it('uses the correct logo source', () => {
    render(<Logo />);
    const img = screen.getByAltText('Y-Not Radio');
    expect(img).toHaveAttribute('src', '/ynot-logo.svg');
  });

  it('applies the logo container class', () => {
    const { container } = render(<Logo />);
    expect(container.querySelector('.ynot-logo')).toBeInTheDocument();
  });

  it('applies the image class', () => {
    const { container } = render(<Logo />);
    expect(container.querySelector('.ynot-logo__image')).toBeInTheDocument();
  });
});
