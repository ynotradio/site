/**
 * Unit tests for LoadingSpinner component
 */

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { LoadingSpinner } from './LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders without crashing', () => {
    render(<LoadingSpinner />);
    // The spinner should be in the document
    expect(document.querySelector('div')).toBeInTheDocument();
  });

  it('contains the spinning animation element', () => {
    const { container } = render(<LoadingSpinner />);
    // Find the inner spinner element (the one with border styles)
    const spinnerElement = container.querySelector('div > div');
    expect(spinnerElement).toBeInTheDocument();
  });

  it('includes the spin keyframe animation styles', () => {
    const { container } = render(<LoadingSpinner />);
    const styleElement = container.querySelector('style');
    expect(styleElement).toBeInTheDocument();
    expect(styleElement?.textContent).toContain('@keyframes spin');
  });

  it('has proper centering styles', () => {
    const { container } = render(<LoadingSpinner />);
    const outerDiv = container.firstChild as HTMLElement;
    expect(outerDiv).toHaveStyle({ display: 'flex' });
  });
});
