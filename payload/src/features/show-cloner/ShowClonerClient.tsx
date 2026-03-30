'use client';

import React, { useEffect } from 'react';
import { Gutter, useStepNav } from '@payloadcms/ui';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { EmptyState } from '../shared/EmptyState';
import { MessageBanner } from './components/MessageBanner';
import { SourceDateRangeSelector } from './components/SourceDateRangeSelector';
import { TargetDateSelector } from './components/TargetDateSelector';
import { CloneButton } from './components/CloneButton';
import { useShows } from './hooks/useShows';
import { useShowCloner } from './hooks/useShowCloner';
import { useDateRanges } from './hooks/useDateRanges';
import { groupShowsByDate, getShowsInRange } from './utils';
import './ShowClonerClient.css';

export const ShowClonerClient: React.FC = () => {
  const { setStepNav } = useStepNav();
  const {
    shows, loading, error: loadError, loadShows,
  } = useShows();
  const {
    sourceStartDate,
    sourceEndDate,
    targetStartDate,
    targetEndDate,
    setSourceStartDate,
    setSourceEndDate,
    setTargetStartDate,
  } = useDateRanges();
  const {
    cloning, error, successMessage, cloneShows, clearMessages,
  } = useShowCloner(
    shows,
    loadShows,
  );

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

  useEffect(() => {
    loadShows();
  }, [loadShows]);

  const selectedRangeShows = (sourceStartDate && sourceEndDate)
    ? getShowsInRange(shows, sourceStartDate, sourceEndDate)
    : [];

  const selectedRangeDateGroups = groupShowsByDate(selectedRangeShows);

  const handleClone = async () => {
    await cloneShows(sourceStartDate, sourceEndDate, targetStartDate);
  };

  const handleDateChange = (setter: (date: string) => void) => (date: string) => {
    setter(date);
    clearMessages();
  };

  if (loading) {
    return (
      <Gutter>
        <LoadingSpinner />
      </Gutter>
    );
  }

  return (
    <Gutter>
      <div className="show-cloner">
        <div className="show-cloner__header">
          <h1 className="show-cloner__title">Show Cloner</h1>
          <p className="show-cloner__description">
            Clone shows from a date range to another. Perfect for copying an entire week of
            programming to a new week.
          </p>
        </div>

        {(error || loadError) && <MessageBanner message={error || loadError || ''} type="error" />}
        {successMessage && <MessageBanner message={successMessage} type="success" />}

        {shows.length === 0 ? (
          <EmptyState message="No shows found. Create some shows first." />
        ) : (
          <>
            <SourceDateRangeSelector
              sourceStartDate={sourceStartDate}
              sourceEndDate={sourceEndDate}
              selectedRangeDateGroups={selectedRangeDateGroups}
              selectedRangeShows={selectedRangeShows.length}
              onStartDateChange={handleDateChange(setSourceStartDate)}
              onEndDateChange={handleDateChange(setSourceEndDate)}
            />

            <TargetDateSelector
              targetStartDate={targetStartDate}
              targetEndDate={targetEndDate}
              sourceStartDate={sourceStartDate}
              sourceEndDate={sourceEndDate}
              onTargetStartDateChange={handleDateChange(setTargetStartDate)}
            />

            <div className="show-cloner__footer">
              <CloneButton
                cloning={cloning}
                disabled={
                  cloning
                  || !sourceStartDate
                  || !sourceEndDate
                  || !targetStartDate
                  || selectedRangeShows.length === 0
                }
                showCount={selectedRangeShows.length}
                onClick={handleClone}
              />
            </div>
          </>
        )}
      </div>
    </Gutter>
  );
};
