'use client';

import React, { useEffect, useRef } from 'react';
import { useNav, usePreferences } from '@payloadcms/ui';

/**
 * Provider component that collapses the sidebar nav by default
 * when no user preference has been set yet. Once the user manually
 * toggles the nav, their preference is respected going forward.
 */
export const NavDefaultClosed: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { setNavOpen } = useNav();
  const { getPreference } = usePreferences();
  const hasChecked = useRef(false);

  useEffect(() => {
    if (hasChecked.current) return;
    hasChecked.current = true;

    const checkNavPreference = async () => {
      const navPrefs = await getPreference<{ open?: boolean }>('nav');
      // Only collapse if the user has never set a preference
      if (navPrefs === null || navPrefs === undefined) {
        setNavOpen(false);
      }
    };

    checkNavPreference();
  }, [getPreference, setNavOpen]);

  return <>{children}</>;
};
