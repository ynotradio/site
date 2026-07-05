// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CloneButton } from './CloneButton';

describe('CloneButton', () => {
  it('renders with correct label for multiple shows', () => {
    render(
      <CloneButton cloning={false} disabled={false} showCount={5} onClick={vi.fn()} />,
    );
    expect(screen.getByRole('button', { name: 'Clone 5 Shows' })).toBeInTheDocument();
  });

  it('renders with singular label for one show', () => {
    render(
      <CloneButton cloning={false} disabled={false} showCount={1} onClick={vi.fn()} />,
    );
    expect(screen.getByRole('button', { name: 'Clone 1 Show' })).toBeInTheDocument();
  });

  it('renders "Cloning..." when cloning is true', () => {
    render(
      <CloneButton cloning={true} disabled={true} showCount={3} onClick={vi.fn()} />,
    );
    expect(screen.getByRole('button', { name: 'Cloning...' })).toBeInTheDocument();
  });

  it('calls onClick when clicked and not disabled', () => {
    const handleClick = vi.fn();
    render(
      <CloneButton cloning={false} disabled={false} showCount={2} onClick={handleClick} />,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('does not call onClick when disabled', () => {
    const handleClick = vi.fn();
    render(
      <CloneButton cloning={false} disabled={true} showCount={0} onClick={handleClick} />,
    );
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('is disabled when cloning prop is true', () => {
    render(
      <CloneButton cloning={true} disabled={true} showCount={3} onClick={vi.fn()} />,
    );
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('renders with reduced opacity when disabled', () => {
    render(
      <CloneButton cloning={false} disabled={true} showCount={0} onClick={vi.fn()} />,
    );
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('renders with full opacity when enabled', () => {
    render(
      <CloneButton cloning={false} disabled={false} showCount={3} onClick={vi.fn()} />,
    );
    const button = screen.getByRole('button');
    expect(button).not.toBeDisabled();
  });

  it('applies cloning class when cloning', () => {
    render(
      <CloneButton cloning={true} disabled={true} showCount={3} onClick={vi.fn()} />,
    );
    expect(screen.getByRole('button')).toHaveClass('clone-button--cloning');
  });

  it('does not apply cloning class when not cloning', () => {
    render(
      <CloneButton cloning={false} disabled={false} showCount={3} onClick={vi.fn()} />,
    );
    expect(screen.getByRole('button')).not.toHaveClass('clone-button--cloning');
  });
});
