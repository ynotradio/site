'use client';

import React, { useState } from 'react';

interface Props {
  valueRef: React.MutableRefObject<unknown>;
}

/**
 * Simple review text field for the CD of the Week wizard.
 * Uses a basic textarea to avoid Payload rich text infrastructure issues.
 * The parent reads values via `valueRef`.
 */
export const CdotwReviewField: React.FC<Props> = ({ valueRef }) => {
  const [reviewText, setReviewText] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setReviewText(text);
    // eslint-disable-next-line no-param-reassign
    valueRef.current = text;
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        minHeight: '200px',
      }}
    >
      <textarea
        value={reviewText}
        onChange={handleChange}
        placeholder="Enter the review text…"
        style={{
          flex: 1,
          padding: '12px',
          border: '1px solid #ddd',
          borderRadius: '4px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontSize: '14px',
          lineHeight: '1.5',
          minHeight: '160px',
          resize: 'vertical',
        }}
      />
      <div style={{ fontSize: '12px', color: '#666' }}>The review text shown on the website.</div>
    </div>
  );
};
