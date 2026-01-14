'use client';

/**
 * DJ Order Tool - Refactored Client Component
 * Follows Single Responsibility Principle with extracted hook
 */
import React, { useCallback, useEffect } from 'react';
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
import { useDJOrder } from './hooks/useDJOrder';

export const DJOrderClient: React.FC = () => {
  const { setStepNav } = useStepNav();
  const {
    djs,
    setDjs,
    loading,
    saving,
    error,
    successMessage,
    loadDJs,
    saveOrder,
    clearSuccessMessage,
  } = useDJOrder();

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

  // Load DJs on mount
  useEffect(() => {
    loadDJs();
  }, [loadDJs]);

  // Handle drag end - update the order
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        setDjs((items) => {
          const oldIndex = items.findIndex((item) => item.id === active.id);
          const newIndex = items.findIndex((item) => item.id === over.id);
          return arrayMove(items, oldIndex, newIndex);
        });
        // Clear any previous success message when order changes
        clearSuccessMessage();
      }
    },
    [setDjs, clearSuccessMessage],
  );

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
          <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '8px' }}>DJ Order</h1>
          <p style={{ color: '#666', fontSize: '14px', marginBottom: '16px' }}>
            Drag and drop DJs to change their display order on the Deejays page. Changes won&apos;t
            be saved until you click the &quot;Save Order&quot; button.
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
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
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
