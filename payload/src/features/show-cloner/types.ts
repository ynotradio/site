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
  } | string | null;
  note?: any; // Rich text field
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
