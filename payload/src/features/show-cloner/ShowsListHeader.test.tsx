// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ShowsListHeader } from './ShowsListHeader';

const mockReplace = vi.fn();

vi.mock('next/navigation', () => ({
  useSearchParams: vi.fn(() => new URLSearchParams()),
  useRouter: vi.fn(() => ({ replace: mockReplace })),
}));

describe('ShowsListHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams());
    vi.mocked(useRouter).mockReturnValue({ replace: mockReplace } as any);
  });

  it('renders the Show Cloner link', () => {
    render(<ShowsListHeader />);

    const link = screen.getByText('Show Cloner');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/admin/show-cloner');
  });

  it('applies correct CSS classes', () => {
    const { container } = render(<ShowsListHeader />);

    const wrapper = container.querySelector('.shows-list-header');
    expect(wrapper).toBeInTheDocument();

    const link = container.querySelector('.shows-list-header__link');
    expect(link).toBeInTheDocument();
  });

  it('renders as a navigation link', () => {
    render(<ShowsListHeader />);

    const link = screen.getByRole('link', { name: 'Show Cloner' });
    expect(link).toBeInTheDocument();
  });

  it('redirects to today-filtered URL when no where param is present', async () => {
    render(<ShowsListHeader />);

    await waitFor(() => expect(mockReplace).toHaveBeenCalledOnce());

    const redirectUrl = mockReplace.mock.calls[0][0] as string;
    const params = new URLSearchParams(redirectUrl.slice(1));
    expect(params.get('sort')).toBe('-startTime');
    expect(params.get('groupBy')).toBe('date');
    expect(params.has('where[or][0][and][0][date][greater_than_equal]')).toBe(true);
  });

  it('does not redirect when where param is already present', async () => {
    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams(
        'where[or][0][and][0][date][greater_than_equal]=2026-01-01T00:00:00.000Z',
      ),
    );

    render(<ShowsListHeader />);

    await new Promise((r) => {
      setTimeout(r, 50);
    });
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
