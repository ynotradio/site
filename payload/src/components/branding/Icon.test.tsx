import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Icon } from './Icon';

describe('Icon', () => {
  it('renders the Y-Not Radio icon image', () => {
    render(<Icon />);
    const img = screen.getByAltText('Y-Not Radio');
    expect(img).toBeInTheDocument();
  });

  it('uses the correct logo source', () => {
    render(<Icon />);
    const img = screen.getByAltText('Y-Not Radio');
    expect(img).toHaveAttribute('src', '/ynot-logo.svg');
  });

  it('has an accessible label', () => {
    render(<Icon />);
    expect(screen.getByLabelText('Y-Not Radio')).toBeInTheDocument();
  });

  it('applies the icon container class', () => {
    const { container } = render(<Icon />);
    expect(container.querySelector('.ynot-icon')).toBeInTheDocument();
  });

  it('applies the image class', () => {
    const { container } = render(<Icon />);
    expect(container.querySelector('.ynot-icon__image')).toBeInTheDocument();
  });
});
