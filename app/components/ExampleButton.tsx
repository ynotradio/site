import React from 'react';

export interface ExampleButtonProps {
  /** Button label */
  label: string;
  /** Button variant */
  variant?: 'primary' | 'secondary';
  /** Optional click handler */
  onClick?: () => void;
  /** Disabled state */
  disabled?: boolean;
}

/**
 * Example Button component demonstrating Storybook integration.
 * This serves as a template for creating stories for actual components.
 */
export function ExampleButton({
  label,
  variant = 'primary',
  onClick,
  disabled = false,
}: ExampleButtonProps) {
  const baseStyles = 'px-4 py-2 rounded font-medium transition-colors';
  const variantStyles = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 disabled:bg-gray-100',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variantStyles[variant]}`}
    >
      {label}
    </button>
  );
}
