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

/**
 * Skip reason codes for import operations
 */
export enum SkipReason {
  ALREADY_EXISTS = 'already_exists',
  INVALID_DATA = 'invalid_data',
  MISSING_REQUIRED_FIELD = 'missing_required_field',
  MISSING_RELATIONSHIP = 'missing_relationship',
  DELETED_IN_SOURCE = 'deleted_in_source',
  DUPLICATE_SLUG = 'duplicate_slug',
  INVALID_DATE = 'invalid_date',
  INVALID_URL = 'invalid_url',
  EMPTY_CONTENT = 'empty_content',
  OTHER = 'other',
}

/**
 * Error category codes for import operations
 */
export enum ErrorCategory {
  VALIDATION_ERROR = 'validation_error',
  DATABASE_ERROR = 'database_error',
  NETWORK_ERROR = 'network_error',
  MEDIA_IMPORT_ERROR = 'media_import_error',
  RELATIONSHIP_ERROR = 'relationship_error',
  UNKNOWN_ERROR = 'unknown_error',
}

/**
 * Detailed result for a single import operation
 */
export interface ImportRecordResult {
  legacyId: number;
  identifier: string;
  status: 'success' | 'skipped' | 'error';
  skipReason?: SkipReason;
  skipDetails?: string;
  errorCategory?: ErrorCategory;
  errorMessage?: string;
  payloadId?: string | number;
  processingTimeMs?: number;
}

/**
 * Extended import stats with detailed tracking
 */
export interface ExtendedImportStats {
  total: number;
  success: number;
  skipped: number;
  errors: number;
  highestImportedId: number;
  skipReasonCounts: Record<SkipReason, number>;
  errorCategoryCounts: Record<ErrorCategory, number>;
  results: ImportRecordResult[];
}

/**
 * Create a new extended stats tracker
 */
export function createExtendedStats(): ExtendedImportStats {
  return {
    total: 0,
    success: 0,
    skipped: 0,
    errors: 0,
    highestImportedId: 0,
    skipReasonCounts: {
      [SkipReason.ALREADY_EXISTS]: 0,
      [SkipReason.INVALID_DATA]: 0,
      [SkipReason.MISSING_REQUIRED_FIELD]: 0,
      [SkipReason.MISSING_RELATIONSHIP]: 0,
      [SkipReason.DELETED_IN_SOURCE]: 0,
      [SkipReason.DUPLICATE_SLUG]: 0,
      [SkipReason.INVALID_DATE]: 0,
      [SkipReason.INVALID_URL]: 0,
      [SkipReason.EMPTY_CONTENT]: 0,
      [SkipReason.OTHER]: 0,
    },
    errorCategoryCounts: {
      [ErrorCategory.VALIDATION_ERROR]: 0,
      [ErrorCategory.DATABASE_ERROR]: 0,
      [ErrorCategory.NETWORK_ERROR]: 0,
      [ErrorCategory.MEDIA_IMPORT_ERROR]: 0,
      [ErrorCategory.RELATIONSHIP_ERROR]: 0,
      [ErrorCategory.UNKNOWN_ERROR]: 0,
    },
    results: [],
  };
}

/**
 * Record a successful import
 */
export function recordSuccess(
  stats: ExtendedImportStats,
  legacyId: number,
  identifier: string,
  payloadId?: string | number,
  processingTimeMs?: number,
): void {
  /* eslint-disable no-param-reassign */
  stats.success += 1;
  stats.total += 1;
  if (legacyId > stats.highestImportedId) {
    stats.highestImportedId = legacyId;
  }
  /* eslint-enable no-param-reassign */
  stats.results.push({
    legacyId,
    identifier,
    status: 'success',
    payloadId,
    processingTimeMs,
  });
}

/**
 * Record a skipped import
 */
export function recordSkipped(
  stats: ExtendedImportStats,
  legacyId: number,
  identifier: string,
  reason: SkipReason,
  details?: string,
): void {
  /* eslint-disable no-param-reassign */
  stats.skipped += 1;
  stats.total += 1;
  stats.skipReasonCounts[reason] += 1;
  /* eslint-enable no-param-reassign */
  stats.results.push({
    legacyId,
    identifier,
    status: 'skipped',
    skipReason: reason,
    skipDetails: details,
  });
}

/**
 * Record an import error
 */
export function recordError(
  stats: ExtendedImportStats,
  legacyId: number,
  identifier: string,
  category: ErrorCategory,
  message: string,
): void {
  /* eslint-disable no-param-reassign */
  stats.errors += 1;
  stats.total += 1;
  stats.errorCategoryCounts[category] += 1;
  /* eslint-enable no-param-reassign */
  stats.results.push({
    legacyId,
    identifier,
    status: 'error',
    errorCategory: category,
    errorMessage: message,
  });
}

/**
 * Log extended summary with skip/error breakdown
 */
export function logExtendedSummary(stats: ExtendedImportStats, context?: string): void {
  const ctx = context ? `[${context}] ` : '';

  info('='.repeat(60));
  info(`${ctx}Extended Import Summary`);
  info('='.repeat(60));
  info(`Total processed: ${stats.total}`);
  info(`Successful: ${stats.success}`);
  info(`Skipped: ${stats.skipped}`);
  info(`Errors: ${stats.errors}`);

  if (stats.highestImportedId > 0) {
    info(`Highest imported ID: ${stats.highestImportedId}`);
  }

  // Log skip reasons breakdown
  if (stats.skipped > 0) {
    info('');
    info('Skip Reasons:');
    for (const [reason, count] of Object.entries(stats.skipReasonCounts)) {
      if (count > 0) {
        info(`  ${reason}: ${count}`);
      }
    }
  }

  // Log error categories breakdown
  if (stats.errors > 0) {
    info('');
    info('Error Categories:');
    for (const [category, count] of Object.entries(stats.errorCategoryCounts)) {
      if (count > 0) {
        info(`  ${category}: ${count}`);
      }
    }

    // Log sample errors (first 5)
    const errorResults = stats.results.filter((r) => r.status === 'error').slice(0, 5);
    if (errorResults.length > 0) {
      info('');
      info('Sample Errors:');
      for (const result of errorResults) {
        info(`  ID ${result.legacyId}: ${result.errorMessage}`);
      }
    }
  }

  info('='.repeat(60));
}

/**
 * Generate a markdown report from extended stats
 */
export function generateStatsMarkdown(stats: ExtendedImportStats, collectionName: string): string {
  const lines: string[] = [];

  lines.push(`## ${collectionName} Import Results`);
  lines.push('');
  lines.push('### Summary');
  lines.push('');
  lines.push('| Metric | Count |');
  lines.push('|--------|-------|');
  lines.push(`| Total Processed | ${stats.total} |`);
  lines.push(`| Successful | ${stats.success} |`);
  lines.push(`| Skipped | ${stats.skipped} |`);
  lines.push(`| Errors | ${stats.errors} |`);

  if (stats.highestImportedId > 0) {
    lines.push(`| Highest Imported ID | ${stats.highestImportedId} |`);
  }

  lines.push('');

  // Skip reasons
  if (stats.skipped > 0) {
    lines.push('### Skip Reasons');
    lines.push('');
    lines.push('| Reason | Count |');
    lines.push('|--------|-------|');
    for (const [reason, count] of Object.entries(stats.skipReasonCounts)) {
      if (count > 0) {
        lines.push(`| ${reason} | ${count} |`);
      }
    }
    lines.push('');
  }

  // Error categories
  if (stats.errors > 0) {
    lines.push('### Error Categories');
    lines.push('');
    lines.push('| Category | Count |');
    lines.push('|----------|-------|');
    for (const [category, count] of Object.entries(stats.errorCategoryCounts)) {
      if (count > 0) {
        lines.push(`| ${category} | ${count} |`);
      }
    }
    lines.push('');

    // Detailed error list
    const errorResults = stats.results.filter((r) => r.status === 'error');
    if (errorResults.length > 0) {
      lines.push('### Error Details');
      lines.push('');
      lines.push('| Legacy ID | Identifier | Category | Message |');
      lines.push('|-----------|------------|----------|---------|');
      for (const result of errorResults.slice(0, 20)) {
        const safeIdentifier = result.identifier.replace(/\|/g, '\\|').substring(0, 40);
        const safeMessage = (result.errorMessage || '').replace(/\|/g, '\\|').substring(0, 60);
        lines.push(
          `| ${result.legacyId} | ${safeIdentifier} | ${result.errorCategory} | ${safeMessage} |`,
        );
      }
      if (errorResults.length > 20) {
        lines.push(`| ... | *${errorResults.length - 20} more errors* | | |`);
      }
      lines.push('');
    }
  }

  return lines.join('\n');
}
