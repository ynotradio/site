// Types for Show Cloner feature

export interface Show {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  name?: string;
  hostName?: string;
  host?: {
    id: string;
    displayName?: string;
  } | string | null;
  note?: unknown; // Rich text field - using unknown instead of any for type safety
}

export interface ShowRowProps {
  show: Show;
}

export interface DateGroup {
  date: string;
  formattedDate: string;
  dayName: string;
  shows: Show[];
}

// API response types
export interface ShowApiResponse {
  id: string | number;
  date?: string;
  startTime?: string;
  endTime?: string;
  name?: string;
  host?: {
    id: string | number;
    displayName?: string;
  } | null;
  note?: unknown;
}

export interface ShowsApiResult {
  docs: ShowApiResponse[];
  totalDocs: number;
  limit: number;
  totalPages: number;
  page: number;
}

// Payload for creating a new show via API
export interface NewShowPayload {
  date: string;
  startTime: string;
  endTime: string;
  name?: string;
  host?: number | string;
}
