import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Logo } from './Logo';

describe('Logo', () => {
  it('renders the Y-Not branding text', () => {
    render(<Logo />);
    expect(screen.getByText('Y-Not')).toBeInTheDocument();
  });

  it('renders the Radio text', () => {
    render(<Logo />);
    expect(screen.getByText('Radio')).toBeInTheDocument();
  });

  it('renders the CMS suffix', () => {
    render(<Logo />);
    expect(screen.getByText('CMS')).toBeInTheDocument();
  });

  it('applies the logo container class', () => {
    const { container } = render(<Logo />);
    expect(container.querySelector('.ynot-logo')).toBeInTheDocument();
  });

  it('applies brand color class to Y-Not text', () => {
    const { container } = render(<Logo />);
    expect(container.querySelector('.ynot-logo__ynot')).toBeInTheDocument();
  });

  it('applies radio class', () => {
    const { container } = render(<Logo />);
    expect(container.querySelector('.ynot-logo__radio')).toBeInTheDocument();
  });

  it('applies cms class', () => {
    const { container } = render(<Logo />);
    expect(container.querySelector('.ynot-logo__cms')).toBeInTheDocument();
  });
});
