// /plugins/dj-order/index.tsx
import React, { useCallback, useEffect, useState } from 'react';
import {
  Stack, Card, Button, Text, Flex, Spinner,
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
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Define TypeScript interfaces
interface DJ {
  _id: string
  name: string
  sortOrder: number
  isActive: boolean
}

interface SortableItemProps {
  id: string
  name: string
  isActive: boolean
}

// Component for a single sortable DJ item
const SortableItem = ({ id, name, isActive }: SortableItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: 'grab',
    padding: '12px',
    margin: '8px 0',
    border: '1px solid #ccc',
    borderRadius: '4px',
    background: isActive ? '#e6f7ff' : '#f0f0f0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <div style={{ color: '#2276fc', marginRight: '5px' }}>
        ⋮⋮
      </div>
      <Text size={2} weight={isActive ? 'semibold' : 'regular'} style={{ color: isActive ? '#000' : '#666' }}>
        {name} {!isActive && <span style={{ color: '#777', marginLeft: '5px' }}>(Inactive)</span>}
      </Text>
    </div>
  );
};

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
    return (
      <Flex align="center" justify="center" padding={5} height="fill">
        <Spinner />
      </Flex>
    );
  }

  return (
    <Card padding={4} tone="primary" radius={2}>
      <Stack space={4}>
        <Flex direction="column" gap={2}>
          <Text size={4} weight="bold">Arrange DJs</Text>
          <Text size={2}>
            Drag and drop DJs using the grip handles to change their display order.
            Changes won't be saved until you click the "Save Order" button.
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
                <Text align="center" size={2} style={{ padding: '20px' }}>No DJs found. Create some DJs first.</Text>
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
