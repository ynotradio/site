/**
 * Unit tests for EmptyState component
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('renders the default message when no props provided', () => {
    render(<EmptyState />);
    expect(screen.getByText('No items found.')).toBeInTheDocument();
  });

  it('renders a custom message when provided', () => {
    const customMessage = 'No shows found. Create some shows first.';
    render(<EmptyState message={customMessage} />);
    expect(screen.getByText(customMessage)).toBeInTheDocument();
  });

  it('has proper text styling', () => {
    const { container } = render(<EmptyState />);
    const div = container.firstChild as HTMLElement;
    expect(div).toHaveStyle({ textAlign: 'center' });
  });

  it('accepts and displays various message types', () => {
    const messages = ['No DJs found.', 'No concerts available.', 'Empty playlist.'];

    messages.forEach((message) => {
      const { unmount } = render(<EmptyState message={message} />);
      expect(screen.getByText(message)).toBeInTheDocument();
      unmount();
    });
  });
});
