import { recordArgs, recordLog } from './logBuffer';

// Patches console methods and global error handlers to feed the log buffer.
// Idempotent: calling it more than once installs a single set of hooks and
// returns an uninstall function that restores the originals.

let installed = false;
let uninstall: (() => void) | null = null;

export const installLogCapture = (target: Window & typeof globalThis = window): (() => void) => {
  if (installed && uninstall) {
    return uninstall;
  }

  const cons = target.console;
  const originalError = cons.error;
  const originalWarn = cons.warn;

  const patchedError = (...args: unknown[]): void => {
    recordArgs('error', args);
    originalError.apply(cons, args as []);
  };
  const patchedWarn = (...args: unknown[]): void => {
    recordArgs('warn', args);
    originalWarn.apply(cons, args as []);
  };

  const onError = (event: ErrorEvent): void => {
    recordLog('error', `Uncaught: ${event.message} (${event.filename}:${event.lineno})`);
  };
  const onRejection = (event: PromiseRejectionEvent): void => {
    const reason = event.reason instanceof Error
      ? `${event.reason.name}: ${event.reason.message}`
      : String(event.reason);
    recordLog('error', `Unhandled rejection: ${reason}`);
  };

  cons.error = patchedError;
  cons.warn = patchedWarn;
  target.addEventListener('error', onError);
  target.addEventListener('unhandledrejection', onRejection);

  installed = true;
  uninstall = () => {
    cons.error = originalError;
    cons.warn = originalWarn;
    target.removeEventListener('error', onError);
    target.removeEventListener('unhandledrejection', onRejection);
    installed = false;
    uninstall = null;
  };

  return uninstall;
};
