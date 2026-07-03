// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PostsListHeader } from './PostsListHeader';

describe('PostsListHeader', () => {
  it('renders the Story Sort Order link', () => {
    render(<PostsListHeader />);

    const link = screen.getByText('Story Sort Order');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/admin/story-order');
  });

  it('applies correct CSS classes', () => {
    const { container } = render(<PostsListHeader />);

    const wrapper = container.querySelector('.posts-list-header');
    expect(wrapper).toBeInTheDocument();

    const link = container.querySelector('.posts-list-header__link');
    expect(link).toBeInTheDocument();
  });

  it('renders as a navigation link', () => {
    render(<PostsListHeader />);

    const link = screen.getByRole('link', { name: 'Story Sort Order' });
    expect(link).toBeInTheDocument();
  });
});
