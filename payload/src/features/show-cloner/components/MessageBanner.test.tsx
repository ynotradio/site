// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MessageBanner } from './MessageBanner';

describe('MessageBanner', () => {
  it('renders the message text', () => {
    render(<MessageBanner message="Something went wrong." type="error" />);
    expect(screen.getByText('Something went wrong.')).toBeInTheDocument();
  });

  it('applies error styles when type is error', () => {
    const { container } = render(<MessageBanner message="Error!" type="error" />);
    const div = container.firstChild as HTMLElement;
    expect(div).toHaveStyle({ backgroundColor: '#fee' });
    expect(div).toHaveStyle({ color: '#c00' });
  });

  it('applies success styles when type is success', () => {
    const { container } = render(<MessageBanner message="Done!" type="success" />);
    const div = container.firstChild as HTMLElement;
    expect(div).toHaveStyle({ backgroundColor: '#e6ffed' });
    expect(div).toHaveStyle({ color: '#22863a' });
  });

  it('renders success message content', () => {
    render(<MessageBanner message="Shows cloned successfully!" type="success" />);
    expect(screen.getByText('Shows cloned successfully!')).toBeInTheDocument();
  });
});
