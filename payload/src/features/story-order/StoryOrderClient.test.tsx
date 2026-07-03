// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { StoryOrderClient } from './StoryOrderClient';
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

const mockStoriesResponse = {
  docs: [
    { id: '1', headline: 'Story Alpha', priority: 0, showOnFrontPage: true },
    { id: '2', headline: 'Story Beta', priority: 1, showOnFrontPage: true },
    { id: '3', headline: 'Story Gamma', priority: 2, showOnFrontPage: false },
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

describe('StoryOrderClient', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  describe('Loading State', () => {
    it('should show loading spinner initially', () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
        () => new Promise(() => {}), // Never resolves
      );

      render(<StoryOrderClient />);
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });
  });

  describe('Data Fetching', () => {
    it('should fetch stories from API on mount', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockStoriesResponse,
      });

      render(<StoryOrderClient />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });
      const [calledUrl] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      const params = new URL(calledUrl, 'http://localhost').searchParams;
      expect(params.get('limit')).toBe('100');
      expect(params.get('sort')).toBe('priority');
      expect(params.get('where[showOnFrontPage][equals]')).toBe('true');
      expect(params.get('where[_status][equals]')).toBe('published');
      // Only currently-active stories should be fetched — without this, every
      // story ever published (hundreds of expired/future ones) piles up here.
      expect(params.get('where[endDate][greater_than_equal]')).toBeTruthy();
      expect(params.get('where[startDate][less_than_equal]')).toBeTruthy();
    });

    it('should display stories after loading', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockStoriesResponse,
      });

      render(<StoryOrderClient />);

      await waitFor(() => {
        expect(screen.getByTestId('sortable-item-1')).toBeInTheDocument();
        expect(screen.getByTestId('sortable-item-2')).toBeInTheDocument();
        expect(screen.getByTestId('sortable-item-3')).toBeInTheDocument();
      });

      expect(screen.getByText('Story Alpha')).toBeInTheDocument();
      expect(screen.getByText('Story Beta')).toBeInTheDocument();
      expect(screen.getByText('Story Gamma')).toBeInTheDocument();
    });

    it('should handle fetch error', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'));

      render(<StoryOrderClient />);

      await waitFor(() => {
        expect(screen.getByText('Error loading stories. Please try again.')).toBeInTheDocument();
      });
    });

    it('should handle API response error', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      });

      render(<StoryOrderClient />);

      await waitFor(() => {
        expect(screen.getByText('Error loading stories. Please try again.')).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no stories', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockStoriesResponse, docs: [], totalDocs: 0 }),
      });

      render(<StoryOrderClient />);

      await waitFor(() => {
        expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      });
    });

    it('should disable save button when no stories', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockStoriesResponse, docs: [], totalDocs: 0 }),
      });

      render(<StoryOrderClient />);

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
          json: async () => mockStoriesResponse,
        })
        .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({}) });

      render(<StoryOrderClient />);

      await waitFor(() => {
        expect(screen.getByText('Story Alpha')).toBeInTheDocument();
      });

      const saveButton = screen.getByRole('button', { name: /Save Order/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Story order saved successfully!')).toBeInTheDocument();
      });
    });

    it('should show saving state while saving', async () => {
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockStoriesResponse,
        })
        .mockImplementation(
          () => new Promise((resolve) => {
            setTimeout(() => resolve({ ok: true, json: async () => ({}) }), 100);
          }),
        );

      render(<StoryOrderClient />);

      await waitFor(() => {
        expect(screen.getByText('Story Alpha')).toBeInTheDocument();
      });

      const saveButton = screen.getByRole('button', { name: /Save Order/i });
      fireEvent.click(saveButton);

      expect(screen.getByRole('button', { name: /Saving.../i })).toBeInTheDocument();
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Save Order/i })).toBeInTheDocument();
      });
    });

    it('should report which stories failed when a PATCH is rejected (network failure)', async () => {
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockStoriesResponse,
        })
        .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ ok: true, json: async () => ({}) });

      render(<StoryOrderClient />);

      await waitFor(() => {
        expect(screen.getByText('Story Alpha')).toBeInTheDocument();
      });

      const saveButton = screen.getByRole('button', { name: /Save Order/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(
          screen.getByText('Failed to save order for: Story Beta. Please try again.'),
        ).toBeInTheDocument();
      });
      expect(screen.queryByText('Story order saved successfully!')).not.toBeInTheDocument();
    });

    it('should report which stories failed when a PATCH returns a non-ok response', async () => {
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockStoriesResponse,
        })
        .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
        .mockResolvedValueOnce({ ok: false, status: 403, json: async () => ({}) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({}) });

      render(<StoryOrderClient />);

      await waitFor(() => {
        expect(screen.getByText('Story Alpha')).toBeInTheDocument();
      });

      const saveButton = screen.getByRole('button', { name: /Save Order/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(
          screen.getByText('Failed to save order for: Story Beta. Please try again.'),
        ).toBeInTheDocument();
      });
      expect(screen.queryByText('Story order saved successfully!')).not.toBeInTheDocument();
    });

    it('should report multiple failed stories together', async () => {
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockStoriesResponse,
        })
        .mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({}) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
        .mockRejectedValueOnce(new Error('Network error'));

      render(<StoryOrderClient />);

      await waitFor(() => {
        expect(screen.getByText('Story Alpha')).toBeInTheDocument();
      });

      const saveButton = screen.getByRole('button', { name: /Save Order/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(
          screen.getByText('Failed to save order for: Story Alpha, Story Gamma. Please try again.'),
        ).toBeInTheDocument();
      });
    });

    it('should disable save button while saving', async () => {
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockStoriesResponse,
        })
        .mockImplementation(
          () => new Promise((resolve) => {
            setTimeout(() => resolve({ ok: true, json: async () => ({}) }), 100);
          }),
        );

      render(<StoryOrderClient />);

      await waitFor(() => {
        expect(screen.getByText('Story Alpha')).toBeInTheDocument();
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
        json: async () => mockStoriesResponse,
      });

      render(<StoryOrderClient />);

      await waitFor(() => {
        expect(screen.getByText('Story Order')).toBeInTheDocument();
      });

      expect(
        screen.getByText(/Drag and drop stories to change their display order/i),
      ).toBeInTheDocument();
    });

    it('should render with correct CSS classes', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockStoriesResponse,
      });

      const { container } = render(<StoryOrderClient />);

      await waitFor(() => {
        expect(screen.getByText('Story Alpha')).toBeInTheDocument();
      });

      expect(container.querySelector('.story-order-client')).toBeInTheDocument();
      expect(container.querySelector('.story-order-client__header')).toBeInTheDocument();
      expect(container.querySelector('.story-order-client__list-container')).toBeInTheDocument();
      expect(container.querySelector('.story-order-client__actions')).toBeInTheDocument();
    });
  });

  describe('Story Display', () => {
    it('should pass isActive prop to SortableItem', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockStoriesResponse,
      });

      render(<StoryOrderClient />);

      await waitFor(() => {
        const activeItem = screen.getByTestId('sortable-item-1');
        const inactiveItem = screen.getByTestId('sortable-item-3');

        expect(activeItem.getAttribute('data-active')).toBe('true');
        expect(inactiveItem.getAttribute('data-active')).toBe('false');
      });
    });
  });

  describe('Drag and Drop', () => {
    it('should reorder stories when dragged to a new position', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockStoriesResponse,
      });

      render(<StoryOrderClient />);

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
        json: async () => mockStoriesResponse,
      });

      render(<StoryOrderClient />);

      await waitFor(() => {
        expect(screen.getByText('Story Alpha')).toBeInTheDocument();
      });

      act(() => {
        dndCallbacks.onDragEnd?.({ active: { id: '1' }, over: { id: '1' } });
      });

      expect(screen.getByText('Story Alpha')).toBeInTheDocument();
    });

    it('should not change order when dropped outside a sortable target', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockStoriesResponse,
      });

      render(<StoryOrderClient />);

      await waitFor(() => {
        expect(screen.getByText('Story Alpha')).toBeInTheDocument();
      });

      act(() => {
        dndCallbacks.onDragEnd?.({ active: { id: '1' }, over: null });
      });

      expect(screen.getByText('Story Alpha')).toBeInTheDocument();
    });

    it('should clear success message when order changes after save', async () => {
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ ok: true, json: async () => mockStoriesResponse })
        .mockResolvedValue({ ok: true, json: async () => ({}) });

      render(<StoryOrderClient />);

      await waitFor(() => expect(screen.getByText('Story Alpha')).toBeInTheDocument());

      fireEvent.click(screen.getByRole('button', { name: /Save Order/i }));
      await waitFor(() => expect(screen.getByText('Story order saved successfully!')).toBeInTheDocument());

      act(() => {
        dndCallbacks.onDragEnd?.({ active: { id: '1' }, over: { id: '2' } });
      });

      expect(screen.queryByText('Story order saved successfully!')).not.toBeInTheDocument();
    });
  });

  describe('Story field fallbacks', () => {
    it('should use fallback headline, priority, and showOnFrontPage when fields are missing', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockStoriesResponse,
          docs: [
            { id: '10' }, // missing headline → 'Story #10', priority → 0, showOnFrontPage → true
            { id: '11', headline: '', priority: undefined, showOnFrontPage: undefined },
          ],
        }),
      });

      render(<StoryOrderClient />);

      await waitFor(() => {
        expect(screen.getByText('Story #10')).toBeInTheDocument();
        expect(screen.getByText('Story #11')).toBeInTheDocument();
      });

      // Both stories default to showOnFrontPage=true, so their SortableItems are marked active
      expect(screen.getByTestId('sortable-item-10').getAttribute('data-active')).toBe('true');
      expect(screen.getByTestId('sortable-item-11').getAttribute('data-active')).toBe('true');
    });
  });
});
