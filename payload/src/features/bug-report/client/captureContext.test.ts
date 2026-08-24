import { describe, it, expect, beforeEach, vi } from 'vitest';

import { captureContext } from './captureContext';
import { clearLogs, recordLog } from './logBuffer';

describe('captureContext', () => {
  beforeEach(() => clearLogs());

  it('captures URL, browser, viewport, and buffered logs', () => {
    recordLog('error', 'earlier failure');
    const ctx = captureContext(window);

    expect(ctx.url).toBe(window.location.href);
    expect(ctx.pathname).toBe(window.location.pathname);
    expect(ctx.userAgent).toBe(window.navigator.userAgent);
    expect(ctx.viewport).toEqual({ width: window.innerWidth, height: window.innerHeight });
    expect(typeof ctx.timestamp).toBe('string');
    expect(ctx.logs).toHaveLength(1);
    expect(ctx.logs[0].message).toBe('earlier failure');
  });

  it('reads an app version from the public env var when present', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_VERSION', 'v9');
    expect(captureContext(window).appVersion).toBe('v9');
  });

  it('defaults app version to null', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_VERSION', '');
    expect(captureContext(window).appVersion).toBeNull();
  });
});
