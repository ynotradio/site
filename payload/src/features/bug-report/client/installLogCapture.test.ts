/* eslint-disable no-console */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { installLogCapture } from './installLogCapture';
import { clearLogs, getLogs } from './logBuffer';

describe('installLogCapture', () => {
  let uninstall: (() => void) | null = null;

  beforeEach(() => clearLogs());
  afterEach(() => {
    uninstall?.();
    uninstall = null;
  });

  it('captures console.error and console.warn while still calling through', () => {
    const originalError = console.error;
    uninstall = installLogCapture(window);

    console.error('boom', { code: 1 });
    console.warn('careful');

    const logs = getLogs();
    expect(logs.some((l) => l.level === 'error' && l.message.includes('boom'))).toBe(true);
    expect(logs.some((l) => l.level === 'warn' && l.message.includes('careful'))).toBe(true);

    uninstall?.();
    uninstall = null;
    expect(console.error).toBe(originalError);
  });

  it('captures window error and unhandledrejection events', () => {
    uninstall = installLogCapture(window);

    window.dispatchEvent(
      new ErrorEvent('error', { message: 'kaboom', filename: 'a.js', lineno: 5 }),
    );
    window.dispatchEvent(
      new PromiseRejectionEvent('unhandledrejection', {
        promise: Promise.reject(new Error('rejected')).catch(() => {}),
        reason: new Error('rejected'),
      }),
    );

    const messages = getLogs().map((l) => l.message);
    expect(messages.some((m) => m.includes('Uncaught: kaboom'))).toBe(true);
    expect(messages.some((m) => m.includes('Unhandled rejection: Error: rejected'))).toBe(true);
  });

  it('is idempotent and returns the same uninstall function', () => {
    const first = installLogCapture(window);
    const second = installLogCapture(window);
    expect(first).toBe(second);
    uninstall = first;
  });
});
