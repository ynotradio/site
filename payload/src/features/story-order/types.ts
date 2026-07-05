// Types for Story Order feature

export interface Story {
  id: string;
  headline: string;
  priority: number;
  showOnFrontPage: boolean;
}

export interface SortableItemProps {
  id: string;
  name: string;
  isActive: boolean;
}

// API response types
export interface StoryApiResponse {
  id: string | number;
  headline?: string;
  priority?: number;
  showOnFrontPage?: boolean;
}

export interface StoriesApiResult {
  docs: StoryApiResponse[];
  totalDocs: number;
  limit: number;
  totalPages: number;
  page: number;
}
