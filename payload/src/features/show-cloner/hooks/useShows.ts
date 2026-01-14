import { useState, useCallback } from 'react';
import type { Show, ShowApiResponse, ShowsApiResult } from '../types';

export const useShows = () => {
  const [shows, setShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadShows = useCallback(async () => {
    try {
      // Use limit=0 to get all shows (Payload returns all when limit is 0)
      const response = await fetch('/api/shows?limit=0&sort=-date,startTime');
      if (!response.ok) {
        throw new Error('Failed to fetch shows');
      }
      const data: ShowsApiResult = await response.json();

      const fetchedShows: Show[] = data.docs.map((show: ShowApiResponse) => {
        // Convert UTC date string to local date in YYYY-MM-DD format
        // The API returns dates like "2026-02-01T05:00:00.000Z" which represents
        // Jan 31, 2026 at midnight EST, so we need to parse it properly
        let localDate = '';
        if (show.date) {
          const utcDate = new Date(show.date);
          // Get the date in the local timezone as YYYY-MM-DD
          const year = utcDate.getFullYear();
          const month = String(utcDate.getMonth() + 1).padStart(2, '0');
          const day = String(utcDate.getDate()).padStart(2, '0');
          localDate = `${year}-${month}-${day}`;
        }

        return {
          id: String(show.id),
          date: localDate,
          startTime: show.startTime || '',
          endTime: show.endTime || '',
          name: show.name || undefined,
          hostName: show.host?.displayName || undefined,
          host: show.host ? { id: String(show.host.id), displayName: show.host.displayName } : null,
          note: show.note,
        };
      });

      setShows(fetchedShows);
      setError(null);
    } catch (err) {
      setError('Error loading shows. Please try again.');
      // eslint-disable-next-line no-console
      console.error('Error fetching shows:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    shows,
    loading,
    error,
    loadShows,
  };
};
