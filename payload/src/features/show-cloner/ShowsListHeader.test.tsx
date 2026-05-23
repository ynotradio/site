// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { useListQuery } from '@payloadcms/ui';
import { ShowsListHeader } from './ShowsListHeader';

const mockHandleWhereChange = vi.fn();
const mockHandleSortChange = vi.fn();

vi.mock('@payloadcms/ui', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@payloadcms/ui')>();
  return {
    ...actual,
    useListQuery: vi.fn(),
  };
});

describe('ShowsListHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useListQuery).mockReturnValue({
      query: {},
      handleWhereChange: mockHandleWhereChange,
      handleSortChange: mockHandleSortChange,
    } as any);
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

  it('applies today filter and startTime sort when no where filter is active', async () => {
    render(<ShowsListHeader />);

    await waitFor(() => expect(mockHandleWhereChange).toHaveBeenCalledOnce());

    const where = mockHandleWhereChange.mock.calls[0][0];
    expect(where).toHaveProperty('or[0].and[0].date.greater_than_equal');
    expect(mockHandleSortChange).toHaveBeenCalledWith('startTime');
  });

  it('does not apply filter when where is already set', async () => {
    vi.mocked(useListQuery).mockReturnValue({
      query: { where: { or: [{ and: [{ date: { greater_than_equal: '2026-01-01' } }] }] } },
      handleWhereChange: mockHandleWhereChange,
      handleSortChange: mockHandleSortChange,
    } as any);

    render(<ShowsListHeader />);

    await new Promise((r) => {
      setTimeout(r, 50);
    });
    expect(mockHandleWhereChange).not.toHaveBeenCalled();
  });
});
