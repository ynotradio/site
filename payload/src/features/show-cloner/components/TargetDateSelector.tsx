import React from 'react';
import { formatDate, formatDateRange } from '../utils';
import './TargetDateSelector.css';

interface TargetDateSelectorProps {
  targetStartDate: string;
  targetEndDate: string;
  sourceStartDate: string;
  sourceEndDate: string;
  onTargetStartDateChange: (date: string) => void;
}

export const TargetDateSelector: React.FC<TargetDateSelectorProps> = ({
  targetStartDate,
  targetEndDate,
  sourceStartDate,
  sourceEndDate,
  onTargetStartDateChange,
}) => (
  <div className="target-date-selector">
    <div className="target-date-selector__heading">Target Date Range (copy to)</div>

    <div className="target-date-selector__row">
      <div className="target-date-selector__field">
        <label htmlFor="target-start-date" className="target-date-selector__label">
          Target Start Date
        </label>
        <input
          id="target-start-date"
          type="date"
          value={targetStartDate}
          onChange={(e) => onTargetStartDateChange(e.target.value)}
          className="target-date-selector__input"
        />
      </div>
      {targetEndDate && (
        <div className="target-date-selector__field">
          <div className="target-date-selector__calculated-label">
            Target End Date (calculated)
          </div>
          <div className="target-date-selector__calculated-value">
            {formatDate(targetEndDate)}
          </div>
        </div>
      )}
    </div>

    {targetStartDate && sourceStartDate && sourceEndDate && (
      <div className="target-date-selector__summary">
        Shows will be cloned from{' '}
        <strong>{formatDateRange(sourceStartDate, sourceEndDate)}</strong> to{' '}
        <strong>{formatDateRange(targetStartDate, targetEndDate)}</strong>
      </div>
    )}
  </div>
);
