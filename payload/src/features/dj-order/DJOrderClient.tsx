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
        const response = await fetch('/api/djs?limit=100&sort=sortOrder');
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
      const updatePromises = djs.map((dj, index) => fetch(`/api/djs/${dj.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sortOrder: index,
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
      <div style={{ maxWidth: '800px', paddingTop: '24px', paddingBottom: '24px' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '8px' }}>
            DJ Order
          </h1>
          <p style={{ color: '#666', fontSize: '14px', marginBottom: '16px' }}>
            Drag and drop DJs to change their display order on the Deejays page.
            Changes won&apos;t be saved until you click the &quot;Save Order&quot; button.
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: '12px 16px',
              marginBottom: '16px',
              backgroundColor: '#fee',
              border: '1px solid #fcc',
              borderRadius: '4px',
              color: '#c00',
              fontSize: '14px',
            }}
          >
            {error}
          </div>
        )}

        {successMessage && (
          <div
            style={{
              padding: '12px 16px',
              marginBottom: '16px',
              backgroundColor: '#e6ffed',
              border: '1px solid #a3d9a5',
              borderRadius: '4px',
              color: '#22863a',
              fontSize: '14px',
            }}
          >
            {successMessage}
          </div>
        )}

        <div
          style={{
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #ddd',
            backgroundColor: '#fafafa',
          }}
        >
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={djs.map((dj) => dj.id)}
              strategy={verticalListSortingStrategy}
            >
              {djs.length === 0 ? (
                <EmptyState message="No DJs found. Create some DJs first." />
              ) : (
                djs.map((dj) => (
                  <SortableItem
                    key={dj.id}
                    id={dj.id}
                    name={dj.displayName}
                    isActive={dj.onAir}
                  />
                ))
              )}
            </SortableContext>
          </DndContext>
        </div>

        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={saveOrder}
            disabled={saving || djs.length === 0}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: 500,
              color: '#fff',
              backgroundColor: saving ? '#999' : '#3182ce',
              border: 'none',
              borderRadius: '4px',
              cursor: saving || djs.length === 0 ? 'not-allowed' : 'pointer',
              opacity: djs.length === 0 ? 0.5 : 1,
            }}
          >
            {saving ? 'Saving...' : 'Save Order'}
          </button>
        </div>
      </div>
    </Gutter>
  );
};
