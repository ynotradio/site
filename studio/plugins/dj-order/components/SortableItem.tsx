// Component for a single sortable DJ item
import React from 'react';
import { Text } from '@sanity/ui';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SortableItemProps } from '../types';

export const SortableItem = ({ id, name, isActive }: SortableItemProps) => {
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
    background: '#fff',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} data-testid={`sortable-item-${id}`}>
      <div style={{ color: '#2276fc', marginRight: '5px' }}>
        ⋮⋮
      </div>
      <Text size={2} weight={isActive ? 'semibold' : 'regular'} style={{ color: isActive ? '#000' : '#666' }}>
        {name} {!isActive && <span style={{ color: '#777', marginLeft: '5px' }}>(Inactive)</span>}
      </Text>
    </div>
  );
};

export default SortableItem;
