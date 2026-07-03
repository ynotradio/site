// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';
import { SortableContext } from '@dnd-kit/sortable';
import { SortableItem } from './SortableItem';

const mockUseSortable = vi.fn();

// Mock @dnd-kit/sortable
vi.mock('@dnd-kit/sortable', async () => {
  const actual = await vi.importActual('@dnd-kit/sortable');
  return {
    ...actual,
    useSortable: (...args: unknown[]) => mockUseSortable(...args),
  };
});

const defaultSortableReturn = {
  attributes: {},
  listeners: {},
  setNodeRef: vi.fn(),
  transform: null,
  transition: null,
  isDragging: false,
};

describe('SortableItem', () => {
  beforeEach(() => {
    mockUseSortable.mockReturnValue(defaultSortableReturn);
  });

  const renderWithDndContext = (component: React.ReactElement) => render(
    <DndContext>
      <SortableContext items={['1']}>{component}</SortableContext>
    </DndContext>,
  );

  it('renders story headline', () => {
    renderWithDndContext(<SortableItem id="1" name="Story Test" isActive={true} />);

    expect(screen.getByText('Story Test')).toBeInTheDocument();
  });

  it('renders drag handle icon', () => {
    const { container } = renderWithDndContext(
      <SortableItem id="1" name="Story Test" isActive={true} />,
    );

    const handle = container.querySelector('.sortable-item__handle');
    expect(handle).toBeInTheDocument();
    expect(handle).toHaveTextContent('⋮⋮');
  });

  it('displays (Hidden) label when isActive is false', () => {
    renderWithDndContext(<SortableItem id="1" name="Story Test" isActive={false} />);

    expect(screen.getByText('(Hidden)')).toBeInTheDocument();
  });

  it('does not display (Hidden) label when isActive is true', () => {
    renderWithDndContext(<SortableItem id="1" name="Story Test" isActive={true} />);

    expect(screen.queryByText('(Hidden)')).not.toBeInTheDocument();
  });

  it('applies active name class when isActive is true', () => {
    const { container } = renderWithDndContext(
      <SortableItem id="1" name="Story Test" isActive={true} />,
    );

    const nameElement = container.querySelector('.sortable-item__name--active');
    expect(nameElement).toBeInTheDocument();
  });

  it('applies inactive name class when isActive is false', () => {
    const { container } = renderWithDndContext(
      <SortableItem id="1" name="Story Test" isActive={false} />,
    );

    const nameElement = container.querySelector('.sortable-item__name--inactive');
    expect(nameElement).toBeInTheDocument();
  });

  it('applies dragging class when isDragging is true', () => {
    mockUseSortable.mockReturnValue({ ...defaultSortableReturn, isDragging: true });

    const { container } = renderWithDndContext(
      <SortableItem id="1" name="Story Test" isActive={true} />,
    );

    const item = container.querySelector('.sortable-item--dragging');
    expect(item).toBeInTheDocument();
  });
});
