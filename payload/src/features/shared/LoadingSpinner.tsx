'use client';

// Loading spinner component
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react';

export const LoadingSpinner = () => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px',
      height: '100%',
    }}
  >
    <div
      style={{
        width: '32px',
        height: '32px',
        border: '3px solid #e0e0e0',
        borderTopColor: '#3182ce',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }}
    />
    <style>
      {`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}
    </style>
  </div>
);

export default LoadingSpinner;
