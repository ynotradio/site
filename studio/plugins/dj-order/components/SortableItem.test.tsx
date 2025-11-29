import {
  describe, it, expect, vi,
} from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, studioTheme } from '@sanity/ui';
import { SortableItem } from './SortableItem';

// Wrapper for Sanity UI components
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={studioTheme}>{children}</ThemeProvider>
);

// Mock the dnd-kit sortable hook
vi.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
  }),
}));

// Mock the dnd-kit utilities
vi.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Transform: {
      toString: () => null,
    },
  },
}));

describe('SortableItem', () => {
  it('renders an active DJ item', () => {
    render(
      <SortableItem id="dj-1" name="Test DJ" isActive />,
      { wrapper },
    );
    expect(screen.getByTestId('sortable-item-dj-1')).toBeInTheDocument();
    expect(screen.getByText('Test DJ')).toBeInTheDocument();
    expect(screen.queryByText('(Inactive)')).not.toBeInTheDocument();
  });

  it('renders an inactive DJ item with inactive label', () => {
    render(
      <SortableItem id="dj-2" name="Inactive DJ" isActive={false} />,
      { wrapper },
    );
    expect(screen.getByTestId('sortable-item-dj-2')).toBeInTheDocument();
    expect(screen.getByText('Inactive DJ')).toBeInTheDocument();
    expect(screen.getByText('(Inactive)')).toBeInTheDocument();
  });

  it('renders the drag handle icon', () => {
    render(
      <SortableItem id="dj-3" name="Another DJ" isActive />,
      { wrapper },
    );
    expect(screen.getByText('⋮⋮')).toBeInTheDocument();
  });
});
