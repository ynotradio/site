// Types for DJ Order feature

export interface DJ {
  id: string;
  displayName: string;
  sortOrder: number;
  onAir: boolean;
}

export interface SortableItemProps {
  id: string;
  name: string;
  isActive: boolean;
}
