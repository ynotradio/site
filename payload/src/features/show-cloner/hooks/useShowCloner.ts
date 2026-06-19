import { useState, useCallback } from 'react';
import type { Show, NewShowPayload } from '../types';
import {
  getDaysDifference, addDays, formatDateRange, getShowsInRange,
} from '../utils';

export const useShowCloner = (shows: Show[], onComplete: () => Promise<void>) => {
  const [cloning, setCloning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const cloneShows = useCallback(
    async (sourceStartDate: string, sourceEndDate: string, targetStartDate: string) => {
      if (!sourceStartDate || !sourceEndDate || !targetStartDate) {
        setError('Please select a source date range and target start date');
        return;
      }

      if (sourceStartDate > sourceEndDate) {
        setError('Source start date must be before or equal to end date');
        return;
      }

      // Check for overlapping date ranges
      const daysDiff = getDaysDifference(sourceStartDate, sourceEndDate);
      const targetEndDate = addDays(targetStartDate, daysDiff);

      // Check if source and target ranges overlap
      const rangesOverlap = !(targetEndDate < sourceStartDate || targetStartDate > sourceEndDate);
      if (rangesOverlap) {
        setError('Source and target date ranges cannot overlap');
        return;
      }

      setCloning(true);
      setError(null);
      setSuccessMessage(null);

      try {
        // Get shows from source date range
        const sourceShows = getShowsInRange(shows, sourceStartDate, sourceEndDate);

        if (sourceShows.length === 0) {
          setError('No shows found in the source date range');
          setCloning(false);
          return;
        }

        // Create new shows for target date range, preserving day offsets
        const createPromises = sourceShows.map((show) => {
          // Calculate the day offset from source start date
          const dayOffset = getDaysDifference(sourceStartDate, show.date);
          const newDate = addDays(targetStartDate, dayOffset);

          const newShow: NewShowPayload = {
            date: newDate,
            startTime: show.startTime,
            endTime: show.endTime,
          };

          if (show.name) {
            newShow.name = show.name;
          }
          if (show.host) {
            // Handle both object and string references - Payload expects numeric IDs
            const hostId = typeof show.host === 'object' ? show.host.id : show.host;
            if (hostId) {
              // Convert to number if it's a valid numeric value
              const numericId = Number(hostId);
              newShow.host = !Number.isNaN(numericId) ? numericId : hostId;
            }
          }
          if (show.note) {
            newShow.note = show.note;
          }

          return fetch('/api/shows', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(newShow),
          });
        });

        await Promise.all(createPromises);

        const targetRange = formatDateRange(targetStartDate, targetEndDate);
        setSuccessMessage(`Successfully cloned ${sourceShows.length} show(s) to ${targetRange}`);

        // Reload shows
        await onComplete();
      } catch (err) {
        setError('Error cloning shows. Please try again.');
        // eslint-disable-next-line no-console
        console.error('Error cloning shows:', err);
      } finally {
        setCloning(false);
      }
    },
    [shows, onComplete],
  );

  const clearMessages = useCallback(() => {
    setSuccessMessage(null);
    setError(null);
  }, []);

  return {
    cloning,
    error,
    successMessage,
    cloneShows,
    clearMessages,
  };
};
