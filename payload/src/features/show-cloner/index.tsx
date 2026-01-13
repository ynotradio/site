'use client';

// Show Cloner Tool - Clone shows from a date range to another date range
import React, { useCallback, useEffect, useState } from 'react';
import { ShowRow } from './components/ShowRow';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { EmptyState } from '../shared/EmptyState';
import type {
  Show, DateGroup, ShowApiResponse, ShowsApiResult, NewShowPayload,
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

// Helper function to format date range for display
export const formatDateRange = (startDate: string, endDate: string): string => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const startStr = start.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const endStr = end.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  return `${startStr} - ${endStr}`;
};

// Helper function to get day name
export const getDayName = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'long' });
};

// Helper function to format date without weekday (for compact display)
export const formatDateShort = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

// Helper function to calculate the number of days between two dates
export const getDaysDifference = (startDate: string, endDate: string): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = end.getTime() - start.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
};

// Helper function to add days to a date
export const addDays = (dateStr: string, days: number): string => {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
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

// Helper function to get shows within a date range
export const getShowsInRange = (
  shows: Show[],
  startDate: string,
  endDate: string,
): Show[] => shows.filter((show) => show.date >= startDate && show.date <= endDate);

// Main component for Show cloning
export const ShowClonerTool: React.FC = () => {
  const [shows, setShows] = useState<Show[]>([]);
  const [dateGroups, setDateGroups] = useState<DateGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [cloning, setCloning] = useState(false);
  const [sourceStartDate, setSourceStartDate] = useState<string>('');
  const [sourceEndDate, setSourceEndDate] = useState<string>('');
  const [targetStartDate, setTargetStartDate] = useState<string>('');
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
    } catch (err) {
      setError('Error loading shows. Please try again.');
      // eslint-disable-next-line no-console
      console.error('Error fetching shows:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadShows();
  }, [loadShows]);

  // Handle cloning shows from source date range to target date range
  const handleClone = useCallback(async () => {
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

      const targetRange = formatDateRange(targetStartDate, targetEndDate);
      setSuccessMessage(`Successfully cloned ${sourceShows.length} show(s) to ${targetRange}`);

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
  }, [loadShows, shows, sourceStartDate, sourceEndDate, targetStartDate]);

  // Get shows for selected source date range
  const selectedRangeShows = sourceStartDate && sourceEndDate
    ? getShowsInRange(shows, sourceStartDate, sourceEndDate)
    : [];

  // Group the selected shows by date for display
  const selectedRangeDateGroups = groupShowsByDate(selectedRangeShows);

  // Calculate target end date for display
  const targetEndDate = sourceStartDate && sourceEndDate && targetStartDate
    ? addDays(targetStartDate, getDaysDifference(sourceStartDate, sourceEndDate))
    : '';

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
          Clone shows from a date range to another. Perfect for copying an entire week
          of programming to a new week.
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
          {/* Source date range selection */}
          <div
            style={{
              padding: '16px',
              marginBottom: '16px',
              borderRadius: '8px',
              border: '1px solid #ddd',
              backgroundColor: '#fafafa',
            }}
          >
            <div
              style={{
                fontSize: '13px',
                fontWeight: 600,
                marginBottom: '12px',
                color: '#333',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Source Date Range (copy from)
            </div>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
              <div style={{ flex: 1 }}>
                <label
                  htmlFor="source-start-date"
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 500,
                    marginBottom: '8px',
                    color: '#555',
                  }}
                >
                  Start Date
                </label>
                <input
                  id="source-start-date"
                  type="date"
                  value={sourceStartDate}
                  onChange={(e) => {
                    setSourceStartDate(e.target.value);
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
              <div style={{ flex: 1 }}>
                <label
                  htmlFor="source-end-date"
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 500,
                    marginBottom: '8px',
                    color: '#555',
                  }}
                >
                  End Date
                </label>
                <input
                  id="source-end-date"
                  type="date"
                  value={sourceEndDate}
                  onChange={(e) => {
                    setSourceEndDate(e.target.value);
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
            </div>

            {selectedRangeDateGroups.length > 0 && (
              <div>
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: 500,
                    marginBottom: '8px',
                    color: '#333',
                  }}
                >
                  Shows in selected range ({selectedRangeShows.length} total):
                </div>
                <div
                  style={{
                    maxHeight: '300px',
                    overflowY: 'auto',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    backgroundColor: '#fff',
                  }}
                >
                  {selectedRangeDateGroups.map((group) => (
                    <div key={group.date}>
                      <div
                        style={{
                          padding: '8px 12px',
                          backgroundColor: '#f5f5f5',
                          borderBottom: '1px solid #e0e0e0',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: '#555',
                        }}
                      >
                        {group.dayName}, {formatDateShort(group.date)}
                        {' '}
                        ({group.shows.length} show{group.shows.length !== 1 ? 's' : ''})
                      </div>
                      <div style={{ padding: '4px 0' }}>
                        {group.shows.map((show) => (
                          <ShowRow key={show.id} show={show} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {sourceStartDate && sourceEndDate && selectedRangeShows.length === 0 && (
              <div
                style={{
                  padding: '12px',
                  textAlign: 'center',
                  color: '#666',
                  fontSize: '14px',
                }}
              >
                No shows found in the selected date range.
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
            <div
              style={{
                fontSize: '13px',
                fontWeight: 600,
                marginBottom: '12px',
                color: '#333',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Target Date Range (copy to)
            </div>

            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label
                  htmlFor="target-start-date"
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 500,
                    marginBottom: '8px',
                    color: '#555',
                  }}
                >
                  Target Start Date
                </label>
                <input
                  id="target-start-date"
                  type="date"
                  value={targetStartDate}
                  onChange={(e) => {
                    setTargetStartDate(e.target.value);
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
              {targetEndDate && (
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: 500,
                      marginBottom: '8px',
                      color: '#555',
                    }}
                  >
                    Target End Date (calculated)
                  </div>
                  <div
                    style={{
                      padding: '8px 12px',
                      fontSize: '14px',
                      borderRadius: '4px',
                      border: '1px solid #ccc',
                      backgroundColor: '#f0f0f0',
                      color: '#666',
                    }}
                  >
                    {formatDate(targetEndDate)}
                  </div>
                </div>
              )}
            </div>

            {targetStartDate && sourceStartDate && sourceEndDate && (
              <div
                style={{
                  marginTop: '12px',
                  padding: '10px 12px',
                  backgroundColor: '#e8f4fd',
                  borderRadius: '4px',
                  fontSize: '13px',
                  color: '#0066cc',
                }}
              >
                Shows will be cloned from{' '}
                <strong>{formatDateRange(sourceStartDate, sourceEndDate)}</strong>
                {' '}to{' '}
                <strong>{formatDateRange(targetStartDate, targetEndDate)}</strong>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={handleClone}
              disabled={
                cloning
                || !sourceStartDate
                || !sourceEndDate
                || !targetStartDate
                || selectedRangeShows.length === 0
              }
              style={{
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: 500,
                color: '#fff',
                backgroundColor: cloning ? '#999' : '#3182ce',
                border: 'none',
                borderRadius: '4px',
                cursor:
                  cloning
                  || !sourceStartDate
                  || !sourceEndDate
                  || !targetStartDate
                  || selectedRangeShows.length === 0
                    ? 'not-allowed'
                    : 'pointer',
                opacity:
                  !sourceStartDate
                  || !sourceEndDate
                  || !targetStartDate
                  || selectedRangeShows.length === 0
                    ? 0.5
                    : 1,
              }}
            >
              {cloning
                ? 'Cloning...'
                : `Clone ${selectedRangeShows.length} Show${selectedRangeShows.length !== 1 ? 's' : ''}`}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ShowClonerTool;
