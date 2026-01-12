'use client';

// Component for a single sortable DJ item
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { SortableItemProps } from '../types';

export const SortableItem = ({ id, name, isActive }: SortableItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: 'grab',
    padding: '12px',
    margin: '8px 0',
    border: '1px solid #ccc',
    borderRadius: '4px',
    background: isDragging ? '#f0f0f0' : '#fff',
    boxShadow: isDragging ? '0 4px 12px rgba(0,0,0,0.15)' : '0 1px 3px rgba(0,0,0,0.1)',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <div style={{ color: '#2276fc', marginRight: '5px', fontSize: '16px' }}>
        ⋮⋮
      </div>
      <span
        style={{
          fontWeight: isActive ? 600 : 400,
          color: isActive ? '#000' : '#666',
          fontSize: '14px',
        }}
      >
        {name}
        {!isActive && (
          <span style={{ color: '#777', marginLeft: '8px', fontWeight: 400 }}>
            (Inactive)
          </span>
        )}
      </span>
    </div>
  );
};

export default SortableItem;
