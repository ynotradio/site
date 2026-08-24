import type { BugReportContext } from '../types';
import { getLogs } from './logBuffer';

/**
 * Gather the technical context for a bug report from the current browser
 * environment. Pure with respect to the DOM globals it reads, so it can be
 * exercised in jsdom with stubbed values.
 */
export const captureContext = (win: Window & typeof globalThis = window): BugReportContext => {
  const { navigator, location, screen } = win;
  const appVersion = process.env.NEXT_PUBLIC_APP_VERSION || null;

  return {
    url: location.href,
    pathname: location.pathname,
    referrer: win.document.referrer,
    userAgent: navigator.userAgent,
    platform: navigator.platform ?? '',
    language: navigator.language ?? '',
    viewport: {
      width: win.innerWidth,
      height: win.innerHeight,
    },
    screen: {
      width: screen?.width ?? 0,
      height: screen?.height ?? 0,
    },
    timestamp: new Date().toISOString(),
    appVersion,
    logs: getLogs(),
  };
};
