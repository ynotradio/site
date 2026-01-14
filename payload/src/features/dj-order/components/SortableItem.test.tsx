// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';
import { SortableContext } from '@dnd-kit/sortable';
import { SortableItem } from './SortableItem';

// Mock @dnd-kit/sortable
vi.mock('@dnd-kit/sortable', async () => {
  const actual = await vi.importActual('@dnd-kit/sortable');
  return {
    ...actual,
    useSortable: () => ({
      attributes: {},
      listeners: {},
      setNodeRef: vi.fn(),
      transform: null,
      transition: null,
      isDragging: false,
    }),
  };
});

describe('SortableItem', () => {
  const renderWithDndContext = (component: React.ReactElement) => render(
    <DndContext>
      <SortableContext items={['1']}>{component}</SortableContext>
    </DndContext>,
  );

  it('renders DJ name', () => {
    renderWithDndContext(<SortableItem id="1" name="DJ Test" isActive={true} />);

    expect(screen.getByText('DJ Test')).toBeInTheDocument();
  });

  it('renders drag handle icon', () => {
    const { container } = renderWithDndContext(
      <SortableItem id="1" name="DJ Test" isActive={true} />,
    );

    const handle = container.querySelector('.sortable-item__handle');
    expect(handle).toBeInTheDocument();
    expect(handle).toHaveTextContent('⋮⋮');
  });

  it('displays (Inactive) label when isActive is false', () => {
    renderWithDndContext(<SortableItem id="1" name="DJ Test" isActive={false} />);

    expect(screen.getByText('(Inactive)')).toBeInTheDocument();
  });

  it('does not display (Inactive) label when isActive is true', () => {
    renderWithDndContext(<SortableItem id="1" name="DJ Test" isActive={true} />);

    expect(screen.queryByText('(Inactive)')).not.toBeInTheDocument();
  });

  it('applies active name class when isActive is true', () => {
    const { container } = renderWithDndContext(
      <SortableItem id="1" name="DJ Test" isActive={true} />,
    );

    const nameElement = container.querySelector('.sortable-item__name--active');
    expect(nameElement).toBeInTheDocument();
  });

  it('applies inactive name class when isActive is false', () => {
    const { container } = renderWithDndContext(
      <SortableItem id="1" name="DJ Test" isActive={false} />,
    );

    const nameElement = container.querySelector('.sortable-item__name--inactive');
    expect(nameElement).toBeInTheDocument();
  });
});
