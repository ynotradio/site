'use client';

import React from 'react';
import './Icon.css';

const ICON_SIZES = {
  default: 18,
  large: 36,
} as const;

export type IconSize = keyof typeof ICON_SIZES;

interface IconProps {
  /** Selects the rendered icon size. */
  size?: IconSize;
  /** Additional class names for layout overrides. */
  className?: string;
}

/**
 * Y-Not Radio icon for the Payload admin navigation and favicon area.
 * Renders the oval Y-Not Radio logo at icon size.
 */
export const Icon: React.FC<IconProps> = ({ size = 'default', className }) => {
  const dimension = ICON_SIZES[size];
  const rootClasses = ['ynot-icon', className].filter(Boolean).join(' ');

  return (
    <div className={rootClasses} aria-label="Y-Not Radio">
      <img
        src="/ynot-logo.svg"
        alt="Y-Not Radio"
        className="ynot-icon__image"
        style={{ height: dimension }}
      />
    </div>
  );
};

export default Icon;
