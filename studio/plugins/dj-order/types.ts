// Types for DJ Order plugin

export interface DJ {
  _id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
}

export interface SortableItemProps {
  id: string;
  name: string;
  isActive: boolean;
}
