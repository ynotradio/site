import React from 'react';

interface CloneButtonProps {
  cloning: boolean;
  disabled: boolean;
  showCount: number;
  onClick: () => void;
}

export const CloneButton: React.FC<CloneButtonProps> = ({
  cloning,
  disabled,
  showCount,
  onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    style={{
      padding: '10px 20px',
      fontSize: '14px',
      fontWeight: 500,
      color: '#fff',
      backgroundColor: cloning ? '#999' : '#3182ce',
      border: 'none',
      borderRadius: '4px',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
    }}
  >
    {cloning
      ? 'Cloning...'
      : `Clone ${showCount} Show${showCount !== 1 ? 's' : ''}`}
  </button>
);
