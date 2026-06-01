import React from 'react';
import './CloneButton.css';

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
    className={`clone-button${cloning ? ' clone-button--cloning' : ''}`}
  >
    {cloning
      ? 'Cloning...'
      : `Clone ${showCount} Show${showCount !== 1 ? 's' : ''}`}
  </button>
);
