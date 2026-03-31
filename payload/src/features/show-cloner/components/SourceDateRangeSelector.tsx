import React from 'react';
import { ShowRow } from './ShowRow';
import { formatDateShort } from '../utils';
import type { DateGroup } from '../types';
import './SourceDateRangeSelector.css';

interface SourceDateRangeSelectorProps {
  sourceStartDate: string;
  sourceEndDate: string;
  selectedRangeDateGroups: DateGroup[];
  selectedRangeShows: number;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
}

export const SourceDateRangeSelector: React.FC<SourceDateRangeSelectorProps> = ({
  sourceStartDate,
  sourceEndDate,
  selectedRangeDateGroups,
  selectedRangeShows,
  onStartDateChange,
  onEndDateChange,
}) => (
  <div className="date-range-selector">
    <div className="date-range-selector__heading">Source Date Range (copy from)</div>

    <div className="date-range-selector__row">
      <div className="date-range-selector__field">
        <label htmlFor="source-start-date" className="date-range-selector__label">
          Start Date
        </label>
        <input
          id="source-start-date"
          type="date"
          value={sourceStartDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          className="date-range-selector__input"
        />
      </div>
      <div className="date-range-selector__field">
        <label htmlFor="source-end-date" className="date-range-selector__label">
          End Date
        </label>
        <input
          id="source-end-date"
          type="date"
          value={sourceEndDate}
          onChange={(e) => onEndDateChange(e.target.value)}
          className="date-range-selector__input"
        />
      </div>
    </div>

    {selectedRangeDateGroups.length > 0 && (
      <div>
        <div className="date-range-selector__shows-heading">
          Shows in selected range ({selectedRangeShows} total):
        </div>
        <div className="date-range-selector__shows-list">
          {selectedRangeDateGroups.map((group) => (
            <div key={group.date}>
              <div className="date-range-selector__date-group-header">
                {group.dayName}, {formatDateShort(group.date)} ({group.shows.length} show
                {group.shows.length !== 1 ? 's' : ''})
              </div>
              <div className="date-range-selector__date-group-rows">
                {group.shows.map((show) => (
                  <ShowRow key={show.id} show={show} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )}

    {sourceStartDate && sourceEndDate && selectedRangeShows === 0 && (
      <div className="date-range-selector__empty">
        No shows found in the selected date range.
      </div>
    )}
  </div>
);
