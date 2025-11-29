// /plugins/dj-order/index.tsx
import React, { useCallback, useEffect, useState } from 'react';
import {
  Stack, Card, Button, Text, Flex,
} from '@sanity/ui';
import { useClient } from 'sanity';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableItem } from './components/SortableItem';
import { LoadingSpinner } from './components/LoadingSpinner';
import { EmptyState } from './components/EmptyState';
import { DJ } from './types';

// Main component for DJ ordering
export function DJOrderTool() {
  const [djs, setDjs] = useState<DJ[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const client = useClient({ apiVersion: '2023-01-01' });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Load DJs from Sanity
  useEffect(() => {
    async function fetchDjs() {
      try {
        const result = await client.fetch<DJ[]>(`
          *[_type == "dj"] | order(sortOrder asc) {
            _id,
            "name": person->name,
            sortOrder,
            isActive
          }
        `);
        setDjs(result);
      } catch (error) {
        console.error('Error fetching DJs:', error);
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
        const oldIndex = items.findIndex((item) => item._id === active.id);
        const newIndex = items.findIndex((item) => item._id === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }, []);

  // Save the new order to Sanity
  const saveOrder = async () => {
    setSaving(true);

    try {
      // Create a transaction for all updates
      const transaction = client.transaction();

      // Update each DJ with its new sortOrder
      djs.forEach((dj, index) => {
        transaction.patch(dj._id, {
          set: {
            sortOrder: index,
          },
        });
      });

      // Commit all updates
      await transaction.commit();
      alert('DJ order saved successfully');
    } catch (error) {
      console.error('Error saving DJ order:', error);
      alert('Error saving DJ order');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Card padding={4} radius={2}>
      <Stack space={4}>
        <Flex direction="column" gap={2}>
          <Text size={2}>
            Drag and drop DJs to change their display order on the Deejays page.
            Changes won&apos;t be saved until you click the &quot;Save Order&quot; button.
          </Text>
        </Flex>

        <Card padding={3} radius={2} shadow={1} tone="default">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={djs.map((dj) => dj._id)}
              strategy={verticalListSortingStrategy}
            >
              {djs.length === 0 ? (
                <EmptyState />
              ) : (
                djs.map((dj) => (
                  <SortableItem
                    key={dj._id}
                    id={dj._id}
                    name={dj.name}
                    isActive={dj.isActive}
                  />
                ))
              )}
            </SortableContext>
          </DndContext>
        </Card>

        <Flex justify="flex-end">
          <Button
            tone="primary"
            text="Save Order"
            onClick={saveOrder}
            disabled={saving}
            loading={saving}
          />
        </Flex>
      </Stack>
    </Card>
  );
}

// Export the component directly
export default DJOrderTool;
