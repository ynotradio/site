'use client';

/**
 * Show Cloner Tool - Refactored Client Component
 * Follows Single Responsibility Principle with extracted hooks and components
 */
import React, { useEffect, useState } from 'react';
import { Gutter, useStepNav } from '@payloadcms/ui';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { EmptyState } from '../shared/EmptyState';
import { SourceDateRangeSelector } from './components/SourceDateRangeSelector';
import { TargetDateSelector } from './components/TargetDateSelector';
import { useShows } from './hooks/useShows';
import { useShowCloner } from './hooks/useShowCloner';
import { getDefaultDateRanges } from './utils/date-helpers';
import { getDaysDifference, addDays, groupShowsByDate, getShowsInRange } from './utils';

export const ShowClonerClient: React.FC = () => {
  // Calculate default date ranges
  const defaultRanges = getDefaultDateRanges();

  const [sourceStartDate, setSourceStartDate] = useState<string>(defaultRanges.sourceStartDate);
  const [sourceEndDate, setSourceEndDate] = useState<string>(defaultRanges.sourceEndDate);
  const [targetStartDate, setTargetStartDate] = useState<string>(defaultRanges.targetStartDate);

  const { setStepNav } = useStepNav();
  const { shows, loading, loadShows } = useShows();
  const { cloning, error, successMessage, cloneShows, clearMessages } = useShowCloner(
    shows,
    loadShows,
  );

  // Set up step nav breadcrumbs
  useEffect(() => {
    setStepNav([
      {
        label: 'Shows',
        url: '/admin/collections/shows',
      },
      {
        label: 'Show Cloner',
      },
    ]);
  }, [setStepNav]);

  // Load shows on mount
  useEffect(() => {
    loadShows();
  }, [loadShows]);

  // Handle date changes with message clearing
  const handleSourceStartDateChange = (date: string) => {
    setSourceStartDate(date);
    clearMessages();
  };

  const handleSourceEndDateChange = (date: string) => {
    setSourceEndDate(date);
    clearMessages();
  };

  const handleTargetStartDateChange = (date: string) => {
    setTargetStartDate(date);
    clearMessages();
  };

  // Get shows for selected source date range
  const selectedRangeShows =
    sourceStartDate && sourceEndDate ? getShowsInRange(shows, sourceStartDate, sourceEndDate) : [];

  // Group the selected shows by date for display
  const selectedRangeDateGroups = groupShowsByDate(selectedRangeShows);

  // Calculate target end date for display
  const targetEndDate =
    sourceStartDate && sourceEndDate && targetStartDate
      ? addDays(targetStartDate, getDaysDifference(sourceStartDate, sourceEndDate))
      : '';

  const dateGroups = groupShowsByDate(shows);

  if (loading) {
    return (
      <Gutter>
        <LoadingSpinner />
      </Gutter>
    );
  }

  const handleClone = () => {
    cloneShows(sourceStartDate, sourceEndDate, targetStartDate);
  };

  return (
    <Gutter>
      <div style={{ maxWidth: '800px', paddingTop: '24px', paddingBottom: '24px' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '8px' }}>Show Cloner</h1>
          <p style={{ color: '#666', fontSize: '14px', marginBottom: '16px' }}>
            Clone shows from a date range to another. Perfect for copying an entire week of
            programming to a new week.
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
            <SourceDateRangeSelector
              sourceStartDate={sourceStartDate}
              sourceEndDate={sourceEndDate}
              onSourceStartDateChange={handleSourceStartDateChange}
              onSourceEndDateChange={handleSourceEndDateChange}
              selectedRangeDateGroups={selectedRangeDateGroups}
              selectedRangeShows={selectedRangeShows}
            />

            <TargetDateSelector
              targetStartDate={targetStartDate}
              targetEndDate={targetEndDate}
              sourceStartDate={sourceStartDate}
              sourceEndDate={sourceEndDate}
              onTargetStartDateChange={handleTargetStartDateChange}
            />

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
    </Gutter>
  );
};
