'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Gutter, useStepNav } from '@payloadcms/ui';
import { SortableItem } from './components/SortableItem';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { EmptyState } from '../shared/EmptyState';
import type { Story, StoryApiResponse, StoriesApiResult } from './types';
import './StoryOrderClient.css';

export const StoryOrderClient: React.FC = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { setStepNav } = useStepNav();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    setStepNav([
      {
        label: 'Stories',
        url: '/admin/collections/posts',
      },
      {
        label: 'Story Order',
      },
    ]);
  }, [setStepNav]);

  useEffect(() => {
    async function fetchStories() {
      try {
        const response = await fetch(
          '/api/posts?limit=100&sort=priority&where[showOnFrontPage][equals]=true',
        );
        if (!response.ok) {
          throw new Error('Failed to fetch stories');
        }
        const data: StoriesApiResult = await response.json();
        const fetchedStories: Story[] = data.docs.map((story: StoryApiResponse) => ({
          id: String(story.id),
          headline: story.headline || `Story #${story.id}`,
          priority: story.priority ?? 0,
          showOnFrontPage: story.showOnFrontPage ?? true,
        }));
        setStories(fetchedStories);
      } catch (err) {
        setError('Error loading stories. Please try again.');
        // eslint-disable-next-line no-console
        console.error('Error fetching stories:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchStories();
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setStories((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
      // Clear any previous success message when order changes
      setSuccessMessage(null);
    }
  }, []);

  const saveOrder = async () => {
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Include _status and showOnFrontPage to preserve existing values when drafts are enabled.
      // Lower priority numbers appear first on the front page, so top-of-list gets 0.
      const updatePromises = stories.map((story, index) => fetch(`/api/posts/${story.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priority: index,
          showOnFrontPage: story.showOnFrontPage,
          _status: 'published',
        }),
      }));

      await Promise.all(updatePromises);
      setSuccessMessage('Story order saved successfully!');
    } catch (err) {
      setError('Error saving story order. Please try again.');
      // eslint-disable-next-line no-console
      console.error('Error saving story order:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Gutter>
        <LoadingSpinner />
      </Gutter>
    );
  }

  return (
    <Gutter>
      <div className="story-order-client">
        <div className="story-order-client__header">
          <h1 className="story-order-client__title">Story Order</h1>
          <p className="story-order-client__description">
            Drag and drop stories to change their display order on the front page. Changes
            won&apos;t be saved until you click the &quot;Save Order&quot; button.
          </p>
        </div>

        {error && (
          <div className="story-order-client__alert story-order-client__alert--error">{error}</div>
        )}

        {successMessage && (
          <div className="story-order-client__alert story-order-client__alert--success">
            {successMessage}
          </div>
        )}

        <div className="story-order-client__list-container">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={stories.map((story) => story.id)}
              strategy={verticalListSortingStrategy}
            >
              {stories.length === 0 ? (
                <EmptyState message='No front-page stories found. Enable "Show on front page" on a story first.' />
              ) : (
                stories.map((story) => (
                  <SortableItem
                    key={story.id}
                    id={story.id}
                    name={story.headline}
                    isActive={story.showOnFrontPage}
                  />
                ))
              )}
            </SortableContext>
          </DndContext>
        </div>

        <div className="story-order-client__actions">
          <button
            type="button"
            onClick={saveOrder}
            disabled={saving || stories.length === 0}
            className={`story-order-client__save-button ${saving ? 'story-order-client__save-button--saving' : ''}`}
          >
            {saving ? 'Saving...' : 'Save Order'}
          </button>
        </div>
      </div>
    </Gutter>
  );
};
