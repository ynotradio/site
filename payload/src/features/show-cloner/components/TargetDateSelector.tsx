'use client';

import React from 'react';
import { formatDate, formatDateRange } from '../utils';

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
          onChange={(e) => onTargetStartDateChange(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            fontSize: '14px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            backgroundColor: '#fff',
            color: '#333',
            colorScheme: 'light',
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
        <strong>{formatDateRange(sourceStartDate, sourceEndDate)}</strong> to{' '}
        <strong>{formatDateRange(targetStartDate, targetEndDate)}</strong>
      </div>
    )}
  </div>
);
