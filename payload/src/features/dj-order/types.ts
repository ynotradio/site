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

// API response types
export interface DJApiResponse {
  id: string | number;
  displayName?: string;
  sortOrder?: number;
  onAir?: boolean;
}

export interface DJsApiResult {
  docs: DJApiResponse[];
  totalDocs: number;
  limit: number;
  totalPages: number;
  page: number;
}
