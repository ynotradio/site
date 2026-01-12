'use client';

// Show Cloner Tool - Clone shows from one date to another
import React, { useCallback, useEffect, useState } from 'react';
import { ShowRow } from './components/ShowRow';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { EmptyState } from '../shared/EmptyState';
import type {
  Show, DateGroup, ShowApiResponse, ShowsApiResult,
} from './types';

// Helper function to format date for display
export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

// Helper function to get day name
export const getDayName = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'long' });
};

// Helper function to group shows by date
export const groupShowsByDate = (shows: Show[]): DateGroup[] => {
  const groups: { [key: string]: Show[] } = {};
  shows.forEach((show) => {
    if (!groups[show.date]) {
      groups[show.date] = [];
    }
    groups[show.date].push(show);
  });

  return Object.keys(groups)
    .sort()
    .map((date) => ({
      date,
      formattedDate: formatDate(date),
      dayName: getDayName(date),
      shows: groups[date],
    }));
};

// Main component for Show cloning
export const ShowClonerTool: React.FC = () => {
  const [shows, setShows] = useState<Show[]>([]);
  const [dateGroups, setDateGroups] = useState<DateGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [cloning, setCloning] = useState(false);
  const [sourceDate, setSourceDate] = useState<string>('');
  const [targetDate, setTargetDate] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load shows from Payload API
  const loadShows = useCallback(async () => {
    try {
      const response = await fetch('/api/shows?limit=1000&sort=date,startTime');
      if (!response.ok) {
        throw new Error('Failed to fetch shows');
      }
      const data: ShowsApiResult = await response.json();

      const fetchedShows: Show[] = data.docs.map((show: ShowApiResponse) => ({
        id: String(show.id),
        date: show.date ? show.date.split('T')[0] : '',
        startTime: show.startTime || '',
        endTime: show.endTime || '',
        name: show.name || undefined,
        hostName: show.host?.displayName || undefined,
        host: show.host ? { id: String(show.host.id), displayName: show.host.displayName } : null,
        note: show.note,
      }));

      setShows(fetchedShows);
      const groupedDates = groupShowsByDate(fetchedShows);
      setDateGroups(groupedDates);

      // Set default source date to first available date
      if (groupedDates.length > 0 && !sourceDate) {
        setSourceDate(groupedDates[0].date);
      }
    } catch (err) {
      setError('Error loading shows. Please try again.');
      // eslint-disable-next-line no-console
      console.error('Error fetching shows:', err);
    } finally {
      setLoading(false);
    }
  }, [sourceDate]);

  useEffect(() => {
    loadShows();
  }, [loadShows]);

  // Handle cloning shows from source date to target date
  const handleClone = useCallback(async () => {
    if (!sourceDate || !targetDate) {
      setError('Please select both a source date and target date');
      return;
    }

    if (sourceDate === targetDate) {
      setError('Source and target dates cannot be the same');
      return;
    }

    setCloning(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Get shows from source date
      const sourceShows = shows.filter((show) => show.date === sourceDate);

      if (sourceShows.length === 0) {
        setError('No shows found on the source date');
        setCloning(false);
        return;
      }

      // Create new shows for target date
      const createPromises = sourceShows.map((show) => {
        const newShow: Record<string, any> = {
          date: targetDate,
          startTime: show.startTime,
          endTime: show.endTime,
        };

        if (show.name) {
          newShow.name = show.name;
        }
        if (show.host) {
          // Handle both object and string references
          const hostId = typeof show.host === 'object' ? show.host.id : show.host;
          if (hostId) {
            newShow.host = hostId;
          }
        }
        // Note: Rich text (Lexical) note field is not cloned because it contains complex
        // nested node structures with internal IDs that may cause issues if duplicated.
        // Users can add notes manually to cloned shows if needed.

        return fetch('/api/shows', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newShow),
        });
      });

      await Promise.all(createPromises);
      setSuccessMessage(`Successfully cloned ${sourceShows.length} show(s) to ${formatDate(targetDate)}`);

      // Reload shows
      setLoading(true);
      await loadShows();
    } catch (err) {
      setError('Error cloning shows. Please try again.');
      // eslint-disable-next-line no-console
      console.error('Error cloning shows:', err);
    } finally {
      setCloning(false);
      setLoading(false);
    }
  }, [loadShows, shows, sourceDate, targetDate]);

  // Get shows for selected source date
  const selectedDateShows = sourceDate
    ? dateGroups.find((group) => group.date === sourceDate)?.shows || []
    : [];

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div style={{ padding: '24px', maxWidth: '800px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '8px' }}>
          Show Cloner
        </h1>
        <p style={{ color: '#666', fontSize: '14px', marginBottom: '16px' }}>
          Copy all shows from one date to another. This is useful for creating
          recurring schedules.
        </p>
      </div>

      {error && (
        <div
          style={{
            padding: '12px 16px',
            marginBottom: '16px',
            backgroundColor: '#fee',
            border: '1px solid #fcc',
            borderRadius: '4px',
            color: '#c00',
            fontSize: '14px',
          }}
        >
          {error}
        </div>
      )}

      {successMessage && (
        <div
          style={{
            padding: '12px 16px',
            marginBottom: '16px',
            backgroundColor: '#e6ffed',
            border: '1px solid #a3d9a5',
            borderRadius: '4px',
            color: '#22863a',
            fontSize: '14px',
          }}
        >
          {successMessage}
        </div>
      )}

      {dateGroups.length === 0 ? (
        <EmptyState message="No shows found. Create some shows first." />
      ) : (
        <>
          {/* Source date selection */}
          <div
            style={{
              padding: '16px',
              marginBottom: '16px',
              borderRadius: '8px',
              border: '1px solid #ddd',
              backgroundColor: '#fafafa',
            }}
          >
            <div style={{ marginBottom: '12px' }}>
              <label
                htmlFor="source-date"
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 500,
                  marginBottom: '8px',
                  color: '#333',
                }}
              >
                Source Date (copy from)
              </label>
              <select
                id="source-date"
                value={sourceDate}
                onChange={(e) => {
                  setSourceDate(e.target.value);
                  setSuccessMessage(null);
                }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: '14px',
                  borderRadius: '4px',
                  border: '1px solid #ccc',
                  backgroundColor: '#fff',
                }}
              >
                {dateGroups.map((group) => (
                  <option key={group.date} value={group.date}>
                    {group.formattedDate} ({group.shows.length} show
                    {group.shows.length !== 1 ? 's' : ''})
                  </option>
                ))}
              </select>
            </div>

            {selectedDateShows.length > 0 && (
              <div>
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: 500,
                    marginBottom: '8px',
                    color: '#333',
                  }}
                >
                  Shows on {formatDate(sourceDate)}:
                </div>
                <div>
                  {selectedDateShows.map((show) => (
                    <ShowRow key={show.id} show={show} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Target date selection */}
          <div
            style={{
              padding: '16px',
              marginBottom: '16px',
              borderRadius: '8px',
              border: '1px solid #ddd',
              backgroundColor: '#fafafa',
            }}
          >
            <label
              htmlFor="target-date"
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 500,
                marginBottom: '8px',
                color: '#333',
              }}
            >
              Target Date (copy to)
            </label>
            <input
              id="target-date"
              type="date"
              value={targetDate}
              onChange={(e) => {
                setTargetDate(e.target.value);
                setSuccessMessage(null);
              }}
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '14px',
                borderRadius: '4px',
                border: '1px solid #ccc',
                backgroundColor: '#fff',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={handleClone}
              disabled={cloning || !sourceDate || !targetDate}
              style={{
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: 500,
                color: '#fff',
                backgroundColor: cloning ? '#999' : '#3182ce',
                border: 'none',
                borderRadius: '4px',
                cursor: cloning || !sourceDate || !targetDate ? 'not-allowed' : 'pointer',
                opacity: !sourceDate || !targetDate ? 0.5 : 1,
              }}
            >
              {cloning ? 'Cloning...' : 'Clone Shows'}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ShowClonerTool;
