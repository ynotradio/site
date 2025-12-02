// Types for Show Cloner plugin

export interface Show {
  _id: string;
  date: string;
  startTime: string;
  endTime: string;
  host: string;
  note?: string;
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
