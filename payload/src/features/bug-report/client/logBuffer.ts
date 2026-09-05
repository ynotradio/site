import type { LogEntry, LogLevel } from '../types';

// A small rolling buffer of recent client-side console output, JS errors, and
// failed network calls. The bug reporter attaches a snapshot of this so a report
// carries the context that led up to it, without the user copying anything.

const MAX_ENTRIES = 100;
const MAX_MESSAGE_LENGTH = 2000;

let buffer: LogEntry[] = [];

const truncate = (value: string): string => (value.length > MAX_MESSAGE_LENGTH ? `${value.slice(0, MAX_MESSAGE_LENGTH)}…` : value);

export const serializeArg = (arg: unknown): string => {
  if (typeof arg === 'string') {
    return arg;
  }
  if (arg instanceof Error) {
    return `${arg.name}: ${arg.message}`;
  }
  try {
    return JSON.stringify(arg);
  } catch {
    return String(arg);
  }
};

export const recordLog = (level: LogLevel, message: string): void => {
  buffer.push({
    level,
    message: truncate(message),
    timestamp: new Date().toISOString(),
  });
  if (buffer.length > MAX_ENTRIES) {
    buffer = buffer.slice(-MAX_ENTRIES);
  }
};

export const recordArgs = (level: LogLevel, args: unknown[]): void => {
  recordLog(level, args.map(serializeArg).join(' '));
};

/** Return a copy of the current buffer (newest last). */
export const getLogs = (): LogEntry[] => [...buffer];

/** Clear the buffer — primarily for tests. */
export const clearLogs = (): void => {
  buffer = [];
};
