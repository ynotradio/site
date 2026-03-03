import React from 'react';

interface MessageBannerProps {
  message: string;
  type: 'error' | 'success';
}

export const MessageBanner: React.FC<MessageBannerProps> = ({ message, type }) => {
  const isError = type === 'error';

  return (
    <div
      style={{
        padding: '12px 16px',
        marginBottom: '16px',
        backgroundColor: isError ? '#fee' : '#e6ffed',
        border: `1px solid ${isError ? '#fcc' : '#a3d9a5'}`,
        borderRadius: '4px',
        color: isError ? '#c00' : '#22863a',
        fontSize: '14px',
      }}
    >
      {message}
    </div>
  );
};
