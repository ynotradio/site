// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { DJOrderClient } from './DJOrderClient';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const dndCallbacks = vi.hoisted(() => ({
  onDragEnd: undefined as ((event: any) => void) | undefined,
}));

// Mock Payload UI components
vi.mock('@payloadcms/ui', () => ({
  Gutter: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="gutter">{children}</div>
  ),
  useStepNav: () => ({
    setStepNav: vi.fn(),
  }),
}));

// Mock shared components
vi.mock('../shared/LoadingSpinner', () => ({
  LoadingSpinner: () => <div data-testid="loading-spinner">Loading...</div>,
}));

vi.mock('../shared/EmptyState', () => ({
  EmptyState: ({ message }: { message: string }) => <div data-testid="empty-state">{message}</div>,
}));

// Mock SortableItem
vi.mock('./components/SortableItem', () => ({
  SortableItem: ({ id, name, isActive }: { id: string; name: string; isActive: boolean }) => (
    <div data-testid={`sortable-item-${id}`} data-active={isActive}>
      {name}
    </div>
  ),
}));

// Mock @dnd-kit/core
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({
    children,
    onDragEnd,
  }: {
    children: React.ReactNode;
    onDragEnd?: (event: any) => void;
  }) => {
    dndCallbacks.onDragEnd = onDragEnd;
    return <div data-testid="dnd-context">{children}</div>;
  },
  closestCenter: vi.fn(),
  KeyboardSensor: vi.fn(),
  PointerSensor: vi.fn(),
  useSensor: vi.fn(() => ({})),
  useSensors: vi.fn(() => []),
}));

// Mock @dnd-kit/sortable
vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sortable-context">{children}</div>
  ),
  arrayMove: (arr: unknown[], oldIndex: number, newIndex: number) => {
    const newArr = [...arr];
    const [removed] = newArr.splice(oldIndex, 1);
    newArr.splice(newIndex, 0, removed);
    return newArr;
  },
  sortableKeyboardCoordinates: vi.fn(),
  verticalListSortingStrategy: vi.fn(),
}));

const mockDjsResponse = {
  docs: [
    { id: '1', displayName: 'DJ Alpha', sortOrder: 0, onAir: true },
    { id: '2', displayName: 'DJ Beta', sortOrder: 1, onAir: true },
    { id: '3', displayName: 'DJ Gamma', sortOrder: 2, onAir: false },
  ],
  totalDocs: 3,
  limit: 100,
  totalPages: 1,
  page: 1,
  pagingCounter: 1,
  hasPrevPage: false,
  hasNextPage: false,
  prevPage: null,
  nextPage: null,
};

describe('DJOrderClient', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  describe('Loading State', () => {
    it('should show loading spinner initially', () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
        () => new Promise(() => {}), // Never resolves
      );

      render(<DJOrderClient />);
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });
  });

  describe('Data Fetching', () => {
    it('should fetch DJs from API on mount', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDjsResponse,
      });

      render(<DJOrderClient />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/djs?limit=100&sort=sortOrder&where[onAir][equals]=true',
        );
      });
    });

    it('should display DJs after loading', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDjsResponse,
      });

      render(<DJOrderClient />);

      await waitFor(() => {
        expect(screen.getByTestId('sortable-item-1')).toBeInTheDocument();
        expect(screen.getByTestId('sortable-item-2')).toBeInTheDocument();
        expect(screen.getByTestId('sortable-item-3')).toBeInTheDocument();
      });

      expect(screen.getByText('DJ Alpha')).toBeInTheDocument();
      expect(screen.getByText('DJ Beta')).toBeInTheDocument();
      expect(screen.getByText('DJ Gamma')).toBeInTheDocument();
    });

    it('should handle fetch error', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'));

      render(<DJOrderClient />);

      await waitFor(() => {
        expect(screen.getByText('Error loading DJs. Please try again.')).toBeInTheDocument();
      });
    });

    it('should handle API response error', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      });

      render(<DJOrderClient />);

      await waitFor(() => {
        expect(screen.getByText('Error loading DJs. Please try again.')).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no DJs', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockDjsResponse, docs: [], totalDocs: 0 }),
      });

      render(<DJOrderClient />);

      await waitFor(() => {
        expect(screen.getByTestId('empty-state')).toBeInTheDocument();
        expect(screen.getByText('No DJs found. Create some DJs first.')).toBeInTheDocument();
      });
    });

    it('should disable save button when no DJs', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockDjsResponse, docs: [], totalDocs: 0 }),
      });

      render(<DJOrderClient />);

      await waitFor(() => {
        const saveButton = screen.getByRole('button', { name: /Save Order/i });
        expect(saveButton).toBeDisabled();
      });
    });
  });

  describe('Save Functionality', () => {
    it('should save order when save button clicked', async () => {
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockDjsResponse,
        })
        .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({}) });

      render(<DJOrderClient />);

      await waitFor(() => {
        expect(screen.getByText('DJ Alpha')).toBeInTheDocument();
      });

      const saveButton = screen.getByRole('button', { name: /Save Order/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('DJ order saved successfully!')).toBeInTheDocument();
      });
    });

    it('should show saving state while saving', async () => {
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockDjsResponse,
        })
        .mockImplementation(
          () => new Promise((resolve) => {
            setTimeout(() => resolve({ ok: true, json: async () => ({}) }), 100);
          }),
        );

      render(<DJOrderClient />);

      await waitFor(() => {
        expect(screen.getByText('DJ Alpha')).toBeInTheDocument();
      });

      const saveButton = screen.getByRole('button', { name: /Save Order/i });
      fireEvent.click(saveButton);

      expect(screen.getByRole('button', { name: /Saving.../i })).toBeInTheDocument();
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Save Order/i })).toBeInTheDocument();
      });
    });

    it('should handle save error', async () => {
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockDjsResponse,
        })
        .mockRejectedValueOnce(new Error('Save failed'));

      render(<DJOrderClient />);

      await waitFor(() => {
        expect(screen.getByText('DJ Alpha')).toBeInTheDocument();
      });

      const saveButton = screen.getByRole('button', { name: /Save Order/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Error saving DJ order. Please try again.')).toBeInTheDocument();
      });
    });

    it('should disable save button while saving', async () => {
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockDjsResponse,
        })
        .mockImplementation(
          () => new Promise((resolve) => {
            setTimeout(() => resolve({ ok: true, json: async () => ({}) }), 100);
          }),
        );

      render(<DJOrderClient />);

      await waitFor(() => {
        expect(screen.getByText('DJ Alpha')).toBeInTheDocument();
      });

      const saveButton = screen.getByRole('button', { name: /Save Order/i });
      fireEvent.click(saveButton);

      const savingButton = screen.getByRole('button', { name: /Saving.../i });
      expect(savingButton).toBeDisabled();
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Save Order/i })).toBeInTheDocument();
      });
    });
  });

  describe('UI Elements', () => {
    it('should render title and description', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDjsResponse,
      });

      render(<DJOrderClient />);

      await waitFor(() => {
        expect(screen.getByText('DJ Order')).toBeInTheDocument();
      });

      expect(
        screen.getByText(/Drag and drop DJs to change their display order/i),
      ).toBeInTheDocument();
    });

    it('should render with correct CSS classes', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDjsResponse,
      });

      const { container } = render(<DJOrderClient />);

      await waitFor(() => {
        expect(screen.getByText('DJ Alpha')).toBeInTheDocument();
      });

      expect(container.querySelector('.dj-order-client')).toBeInTheDocument();
      expect(container.querySelector('.dj-order-client__header')).toBeInTheDocument();
      expect(container.querySelector('.dj-order-client__list-container')).toBeInTheDocument();
      expect(container.querySelector('.dj-order-client__actions')).toBeInTheDocument();
    });
  });

  describe('DJ Display', () => {
    it('should pass isActive prop to SortableItem', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDjsResponse,
      });

      render(<DJOrderClient />);

      await waitFor(() => {
        const activeItem = screen.getByTestId('sortable-item-1');
        const inactiveItem = screen.getByTestId('sortable-item-3');

        expect(activeItem.getAttribute('data-active')).toBe('true');
        expect(inactiveItem.getAttribute('data-active')).toBe('false');
      });
    });
  });

  describe('Drag and Drop', () => {
    it('should reorder DJs when dragged to a new position', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDjsResponse,
      });

      render(<DJOrderClient />);

      await waitFor(() => {
        expect(screen.getByTestId('sortable-item-1')).toBeInTheDocument();
      });

      act(() => {
        dndCallbacks.onDragEnd?.({ active: { id: '1' }, over: { id: '2' } });
      });

      // All items still rendered after reorder
      expect(screen.getByTestId('sortable-item-1')).toBeInTheDocument();
      expect(screen.getByTestId('sortable-item-2')).toBeInTheDocument();
    });

    it('should not change order when dragged onto itself', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDjsResponse,
      });

      render(<DJOrderClient />);

      await waitFor(() => {
        expect(screen.getByText('DJ Alpha')).toBeInTheDocument();
      });

      act(() => {
        dndCallbacks.onDragEnd?.({ active: { id: '1' }, over: { id: '1' } });
      });

      expect(screen.getByText('DJ Alpha')).toBeInTheDocument();
    });

    it('should not change order when dropped outside a sortable target', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDjsResponse,
      });

      render(<DJOrderClient />);

      await waitFor(() => {
        expect(screen.getByText('DJ Alpha')).toBeInTheDocument();
      });

      act(() => {
        dndCallbacks.onDragEnd?.({ active: { id: '1' }, over: null });
      });

      expect(screen.getByText('DJ Alpha')).toBeInTheDocument();
    });

    it('should clear success message when order changes after save', async () => {
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ ok: true, json: async () => mockDjsResponse })
        .mockResolvedValue({ ok: true, json: async () => ({}) });

      render(<DJOrderClient />);

      await waitFor(() => expect(screen.getByText('DJ Alpha')).toBeInTheDocument());

      fireEvent.click(screen.getByRole('button', { name: /Save Order/i }));
      await waitFor(() => expect(screen.getByText('DJ order saved successfully!')).toBeInTheDocument());

      act(() => {
        dndCallbacks.onDragEnd?.({ active: { id: '1' }, over: { id: '2' } });
      });

      expect(screen.queryByText('DJ order saved successfully!')).not.toBeInTheDocument();
    });
  });

  describe('DJ field fallbacks', () => {
    it('should use fallback displayName, sortOrder, and onAir when fields are missing', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockDjsResponse,
          docs: [
            { id: '10' }, // missing displayName → 'DJ #10', sortOrder → 0, onAir → true
            { id: '11', displayName: '', sortOrder: undefined, onAir: undefined },
          ],
        }),
      });

      render(<DJOrderClient />);

      await waitFor(() => {
        expect(screen.getByText('DJ #10')).toBeInTheDocument();
        expect(screen.getByText('DJ #11')).toBeInTheDocument();
      });

      // Both DJs default to onAir=true, so their SortableItems are marked active
      expect(screen.getByTestId('sortable-item-10').getAttribute('data-active')).toBe('true');
      expect(screen.getByTestId('sortable-item-11').getAttribute('data-active')).toBe('true');
    });
  });
});
