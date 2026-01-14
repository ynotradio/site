'use client';

// Component for a single sortable DJ item
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { SortableItemProps } from '../types';
import './SortableItem.css';

export const SortableItem = ({ id, name, isActive }: SortableItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const className = `sortable-item ${isDragging ? 'sortable-item--dragging' : ''}`;
  const nameClassName = `sortable-item__name ${isActive ? 'sortable-item__name--active' : 'sortable-item__name--inactive'}`;

  return (
    <div ref={setNodeRef} style={style} className={className} {...attributes} {...listeners}>
      <div className="sortable-item__handle">⋮⋮</div>
      <span className={nameClassName}>
        {name}
        {!isActive && <span className="sortable-item__inactive-label">(Inactive)</span>}
      </span>
    </div>
  );
};

export default SortableItem;
