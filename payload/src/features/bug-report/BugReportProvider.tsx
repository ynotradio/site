'use client';

import React, { useEffect } from 'react';

import { installLogCapture } from './client/installLogCapture';
import { BugReportWidget } from './BugReportWidget';

/**
 * Admin provider that (1) installs client-side log capture as early as possible
 * so the buffer is populated before a user hits a bug, and (2) mounts the
 * floating bug-report widget on every admin page.
 *
 * Registered via `admin.components.providers` in payload.config.ts.
 */
export const BugReportProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }
    const uninstall = installLogCapture();
    return uninstall;
  }, []);

  return (
    <>
      {children}
      <BugReportWidget />
    </>
  );
};

export default BugReportProvider;
