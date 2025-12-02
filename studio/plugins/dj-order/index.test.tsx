import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import { ThemeProvider, studioTheme } from '@sanity/ui';
import { useClient } from 'sanity';
import { DJOrderTool } from './index';

// Mock sanity useClient
vi.mock('sanity', () => ({
  useClient: vi.fn(),
}));

// Mock @dnd-kit/core
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dnd-context">{children}</div>
  ),
  closestCenter: vi.fn(),
  KeyboardSensor: vi.fn(),
  PointerSensor: vi.fn(),
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
}));

// Mock @dnd-kit/sortable
vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sortable-context">{children}</div>
  ),
  sortableKeyboardCoordinates: vi.fn(),
  verticalListSortingStrategy: vi.fn(),
  arrayMove: (array: unknown[], from: number, to: number) => {
    const newArray = [...array];
    const [item] = newArray.splice(from, 1);
    newArray.splice(to, 0, item);
    return newArray;
  },
}));

// Mock SortableItem component
vi.mock('./components/SortableItem', () => ({
  SortableItem: ({ name, isActive }: { name: string; isActive: boolean }) => (
    <div data-testid="sortable-item" data-active={isActive}>{name}</div>
  ),
}));

// Wrapper for Sanity UI components
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={studioTheme}>{children}</ThemeProvider>
);

describe('DJOrderTool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading spinner initially', () => {
    const mockFetch = vi.fn(() => new Promise(() => {}));
    (useClient as ReturnType<typeof vi.fn>).mockReturnValue({
      fetch: mockFetch,
      transaction: vi.fn(),
    });

    render(<DJOrderTool />, { wrapper });

    // Should show loading spinner
    const spinner = document.querySelector('[data-ui="Spinner"]');
    expect(spinner).toBeInTheDocument();
  });

  it('calls fetch on mount', () => {
    const mockFetch = vi.fn(() => new Promise(() => {}));
    (useClient as ReturnType<typeof vi.fn>).mockReturnValue({
      fetch: mockFetch,
      transaction: vi.fn(),
    });

    render(<DJOrderTool />, { wrapper });

    expect(mockFetch).toHaveBeenCalled();
  });
});
