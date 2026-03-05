import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Icon } from './Icon';

describe('Icon', () => {
  it('renders the YN monogram text', () => {
    render(<Icon />);
    expect(screen.getByText('YN')).toBeInTheDocument();
  });

  it('has an accessible label', () => {
    render(<Icon />);
    expect(screen.getByLabelText('Y-Not Radio')).toBeInTheDocument();
  });

  it('applies the icon container class', () => {
    const { container } = render(<Icon />);
    expect(container.querySelector('.ynot-icon')).toBeInTheDocument();
  });

  it('applies the text class to the monogram', () => {
    const { container } = render(<Icon />);
    expect(container.querySelector('.ynot-icon__text')).toBeInTheDocument();
  });
});
