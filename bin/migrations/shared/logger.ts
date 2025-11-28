/**
 * Consistent logging utility with timestamps for migration scripts
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

let currentLogLevel = LogLevel.INFO;

/**
 * Set the current log level
 */
export function setLogLevel(level: LogLevel): void {
  currentLogLevel = level;
}

/**
 * Get the current timestamp in ISO format
 */
function getTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Format a log message with timestamp and level
 */
function formatMessage(level: string, message: string, context?: string): string {
  const timestamp = getTimestamp();
  const contextStr = context ? ` [${context}]` : '';
  return `[${timestamp}] [${level}]${contextStr} ${message}`;
}

/**
 * Log a debug message
 */
export function debug(message: string, context?: string): void {
  if (currentLogLevel <= LogLevel.DEBUG) {
    console.log(formatMessage('DEBUG', message, context));
  }
}

/**
 * Log an info message
 */
export function info(message: string, context?: string): void {
  if (currentLogLevel <= LogLevel.INFO) {
    console.log(formatMessage('INFO', message, context));
  }
}

/**
 * Log a warning message
 */
export function warn(message: string, context?: string): void {
  if (currentLogLevel <= LogLevel.WARN) {
    console.warn(formatMessage('WARN', message, context));
  }
}

/**
 * Log an error message
 */
export function error(message: string, context?: string, err?: Error): void {
  if (currentLogLevel <= LogLevel.ERROR) {
    console.error(formatMessage('ERROR', message, context));
    if (err) {
      console.error(err);
    }
  }
}

/**
 * Create a scoped logger for a specific context
 */
export function createLogger(context: string) {
  return {
    debug: (message: string) => debug(message, context),
    info: (message: string) => info(message, context),
    warn: (message: string) => warn(message, context),
    error: (message: string, err?: Error) => error(message, context, err),
  };
}

/**
 * Log migration progress
 */
export function logProgress(current: number, total: number, label: string): void {
  const percent = Math.round((current / total) * 100);
  info(`Progress: ${current}/${total} (${percent}%) - ${label}`);
}

/**
 * Log migration summary
 */
export function logSummary(stats: {
  total: number;
  success: number;
  skipped: number;
  errors: number;
}): void {
  info('='.repeat(50));
  info('Migration Summary');
  info('='.repeat(50));
  info(`Total records: ${stats.total}`);
  info(`Successful: ${stats.success}`);
  info(`Skipped: ${stats.skipped}`);
  info(`Errors: ${stats.errors}`);
  info('='.repeat(50));
}
