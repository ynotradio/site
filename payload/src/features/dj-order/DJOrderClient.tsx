'use client';

// DJ Order Tool - Client Component for interactive functionality
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
import type { DJ, DJApiResponse, DJsApiResult } from './types';
import './DJOrderClient.css';

// Client component for DJ ordering
export const DJOrderClient: React.FC = () => {
  const [djs, setDjs] = useState<DJ[]>([]);
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

  // Set up step nav breadcrumbs
  useEffect(() => {
    setStepNav([
      {
        label: 'DJs',
        url: '/admin/collections/djs',
      },
      {
        label: 'DJ Order',
      },
    ]);
  }, [setStepNav]);

  // Load DJs from Payload API
  useEffect(() => {
    async function fetchDjs() {
      try {
        const response = await fetch('/api/djs?limit=100&sort=sortOrder&where[onAir][equals]=true');
        if (!response.ok) {
          throw new Error('Failed to fetch DJs');
        }
        const data: DJsApiResult = await response.json();
        const fetchedDjs: DJ[] = data.docs.map((dj: DJApiResponse) => ({
          id: String(dj.id),
          displayName: dj.displayName || `DJ #${dj.id}`,
          sortOrder: dj.sortOrder ?? 0,
          onAir: dj.onAir ?? true,
        }));
        setDjs(fetchedDjs);
      } catch (err) {
        setError('Error loading DJs. Please try again.');
        // eslint-disable-next-line no-console
        console.error('Error fetching DJs:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchDjs();
  }, []);

  // Handle drag end - update the order
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setDjs((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
      // Clear any previous success message when order changes
      setSuccessMessage(null);
    }
  }, []);

  // Save the new order to Payload
  const saveOrder = async () => {
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Update each DJ with its new sortOrder
      // Include _status and onAir to preserve existing values when drafts are enabled
      const updatePromises = djs.map((dj, index) => fetch(`/api/djs/${dj.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sortOrder: index,
          onAir: dj.onAir,
          _status: 'published',
        }),
      }));

      await Promise.all(updatePromises);
      setSuccessMessage('DJ order saved successfully!');
    } catch (err) {
      setError('Error saving DJ order. Please try again.');
      // eslint-disable-next-line no-console
      console.error('Error saving DJ order:', err);
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
      <div className="dj-order-client">
        <div className="dj-order-client__header">
          <h1 className="dj-order-client__title">DJ Order</h1>
          <p className="dj-order-client__description">
            Drag and drop DJs to change their display order on the Deejays page. Changes won&apos;t
            be saved until you click the &quot;Save Order&quot; button.
          </p>
        </div>

        {error && (
          <div className="dj-order-client__alert dj-order-client__alert--error">{error}</div>
        )}

        {successMessage && (
          <div className="dj-order-client__alert dj-order-client__alert--success">
            {successMessage}
          </div>
        )}

        <div className="dj-order-client__list-container">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={djs.map((dj) => dj.id)} strategy={verticalListSortingStrategy}>
              {djs.length === 0 ? (
                <EmptyState message="No DJs found. Create some DJs first." />
              ) : (
                djs.map((dj) => (
                  <SortableItem key={dj.id} id={dj.id} name={dj.displayName} isActive={dj.onAir} />
                ))
              )}
            </SortableContext>
          </DndContext>
        </div>

        <div className="dj-order-client__actions">
          <button
            type="button"
            onClick={saveOrder}
            disabled={saving || djs.length === 0}
            className={`dj-order-client__save-button ${saving ? 'dj-order-client__save-button--saving' : ''}`}
          >
            {saving ? 'Saving...' : 'Save Order'}
          </button>
        </div>
      </div>
    </Gutter>
  );
};
