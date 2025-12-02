// /plugins/show-cloner/index.tsx
import React, { useCallback, useEffect, useState } from 'react';
import {
  Stack, Card, Button, Text, Flex, Select, Box, Label,
} from '@sanity/ui';
import { useClient } from 'sanity';
import { LoadingSpinner } from './components/LoadingSpinner';
import { EmptyState } from './components/EmptyState';
import { ShowRow } from './components/ShowRow';
import { Show, DateGroup } from './types';

// Helper function to format date for display
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

// Helper function to get day name
const getDayName = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'long' });
};

// Main component for Show cloning
export function ShowClonerTool() {
  const [shows, setShows] = useState<Show[]>([]);
  const [dateGroups, setDateGroups] = useState<DateGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [cloning, setCloning] = useState(false);
  const [sourceDate, setSourceDate] = useState<string>('');
  const [targetDate, setTargetDate] = useState<string>('');
  const client = useClient({ apiVersion: '2023-01-01' });

  // Load shows from Sanity
  useEffect(() => {
    async function fetchShows() {
      try {
        const result = await client.fetch<Show[]>(`
          *[_type == "show"] | order(date asc, startTime asc) {
            _id,
            date,
            startTime,
            endTime,
            host,
            note
          }
        `);
        setShows(result);

        // Group shows by date
        const groups: { [key: string]: Show[] } = {};
        result.forEach((show) => {
          if (!groups[show.date]) {
            groups[show.date] = [];
          }
          groups[show.date].push(show);
        });

        const groupedDates: DateGroup[] = Object.keys(groups)
          .sort()
          .map((date) => ({
            date,
            formattedDate: formatDate(date),
            dayName: getDayName(date),
            shows: groups[date],
          }));

        setDateGroups(groupedDates);

        // Set default source date to first available date
        if (groupedDates.length > 0) {
          setSourceDate(groupedDates[0].date);
        }
      } catch (error) {
        console.error('Error fetching shows:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchShows();
  }, [client]);

  // Handle cloning shows from source date to target date
  const handleClone = useCallback(async () => {
    if (!sourceDate || !targetDate) {
      alert('Please select both a source date and target date');
      return;
    }

    if (sourceDate === targetDate) {
      alert('Source and target dates cannot be the same');
      return;
    }

    setCloning(true);

    try {
      // Get shows from source date
      const sourceShows = shows.filter((show) => show.date === sourceDate);

      if (sourceShows.length === 0) {
        alert('No shows found on the source date');
        setCloning(false);
        return;
      }

      // Create a transaction for all new shows
      const transaction = client.transaction();

      // Create new shows for target date
      sourceShows.forEach((show) => {
        transaction.create({
          _type: 'show',
          date: targetDate,
          startTime: show.startTime,
          endTime: show.endTime,
          host: show.host,
          note: show.note,
        });
      });

      // Commit all creates
      await transaction.commit();
      alert(`Successfully cloned ${sourceShows.length} show(s) to ${formatDate(targetDate)}`);

      // Reload shows
      setLoading(true);
      const result = await client.fetch<Show[]>(`
        *[_type == "show"] | order(date asc, startTime asc) {
          _id,
          date,
          startTime,
          endTime,
          host,
          note
        }
      `);
      setShows(result);

      // Re-group shows by date
      const groups: { [key: string]: Show[] } = {};
      result.forEach((show) => {
        if (!groups[show.date]) {
          groups[show.date] = [];
        }
        groups[show.date].push(show);
      });

      const groupedDates: DateGroup[] = Object.keys(groups)
        .sort()
        .map((date) => ({
          date,
          formattedDate: formatDate(date),
          dayName: getDayName(date),
          shows: groups[date],
        }));

      setDateGroups(groupedDates);
    } catch (error) {
      console.error('Error cloning shows:', error);
      alert('Error cloning shows');
    } finally {
      setCloning(false);
      setLoading(false);
    }
  }, [client, shows, sourceDate, targetDate]);

  // Get shows for selected source date
  const selectedDateShows = sourceDate
    ? dateGroups.find((group) => group.date === sourceDate)?.shows || []
    : [];

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Card padding={4} radius={2}>
      <Stack space={4}>
        <Flex direction="column" gap={2}>
          <Text size={2} weight="semibold">
            Clone Schedule
          </Text>
          <Text size={1} muted>
            Copy all shows from one date to another. This is useful for creating
            recurring schedules.
          </Text>
        </Flex>

        {dateGroups.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Source date selection */}
            <Card padding={3} radius={2} shadow={1} tone="default">
              <Stack space={3}>
                <Box>
                  <Label size={1}>Source Date (copy from)</Label>
                  <Select
                    value={sourceDate}
                    onChange={(event) => setSourceDate(event.currentTarget.value)}
                    style={{ marginTop: '8px' }}
                  >
                    {dateGroups.map((group) => (
                      <option key={group.date} value={group.date}>
                        {group.formattedDate} ({group.shows.length} show
                        {group.shows.length !== 1 ? 's' : ''})
                      </option>
                    ))}
                  </Select>
                </Box>

                {selectedDateShows.length > 0 && (
                  <Box>
                    <Text size={1} weight="semibold" style={{ marginBottom: '8px' }}>
                      Shows on {formatDate(sourceDate)}:
                    </Text>
                    <Stack space={1}>
                      {selectedDateShows.map((show) => (
                        <ShowRow key={show._id} show={show} />
                      ))}
                    </Stack>
                  </Box>
                )}
              </Stack>
            </Card>

            {/* Target date selection */}
            <Card padding={3} radius={2} shadow={1} tone="default">
              <Stack space={3}>
                <Box>
                  <Label size={1}>Target Date (copy to)</Label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(event) => setTargetDate(event.target.value)}
                    style={{
                      marginTop: '8px',
                      padding: '8px',
                      borderRadius: '4px',
                      border: '1px solid #ccc',
                      width: '100%',
                      fontSize: '14px',
                    }}
                  />
                </Box>
              </Stack>
            </Card>

            <Flex justify="flex-end" gap={2}>
              <Button
                tone="primary"
                text="Clone Shows"
                onClick={handleClone}
                disabled={cloning || !sourceDate || !targetDate}
                loading={cloning}
              />
            </Flex>
          </>
        )}
      </Stack>
    </Card>
  );
}

// Export the component directly
export default ShowClonerTool;
