import React from 'react';
import './MessageBanner.css';

interface MessageBannerProps {
  message: string;
  type: 'error' | 'success';
}

export const MessageBanner: React.FC<MessageBannerProps> = ({ message, type }) => (
  <div className={`message-banner message-banner--${type}`}>{message}</div>
);
