import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  LogLevel,
  setLogLevel,
  debug,
  info,
  warn,
  error,
  createLogger,
  logProgress,
  logSummary,
  SkipReason,
  ErrorCategory,
  createExtendedStats,
  recordSuccess,
  recordSkipped,
  recordError,
  logExtendedSummary,
  generateStatsMarkdown,
} from './logger';

describe('logger', () => {
  let consoleSpy: {
    log: ReturnType<typeof vi.spyOn>;
    warn: ReturnType<typeof vi.spyOn>;
    error: ReturnType<typeof vi.spyOn>;
  };

  beforeEach(() => {
    consoleSpy = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    };
    // Reset to default log level
    setLogLevel(LogLevel.INFO);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('setLogLevel', () => {
    it('should set log level to DEBUG', () => {
      setLogLevel(LogLevel.DEBUG);
      debug('test message');
      expect(consoleSpy.log).toHaveBeenCalled();
    });

    it('should filter debug messages when level is INFO', () => {
      setLogLevel(LogLevel.INFO);
      debug('test message');
      expect(consoleSpy.log).not.toHaveBeenCalled();
    });

    it('should filter info messages when level is WARN', () => {
      setLogLevel(LogLevel.WARN);
      info('test message');
      expect(consoleSpy.log).not.toHaveBeenCalled();
    });

    it('should filter warn messages when level is ERROR', () => {
      setLogLevel(LogLevel.ERROR);
      warn('test message');
      expect(consoleSpy.warn).not.toHaveBeenCalled();
    });
  });

  describe('debug', () => {
    it('should log debug messages when level is DEBUG', () => {
      setLogLevel(LogLevel.DEBUG);
      debug('debug message');
      expect(consoleSpy.log).toHaveBeenCalledWith(expect.stringContaining('[DEBUG]'));
      expect(consoleSpy.log).toHaveBeenCalledWith(expect.stringContaining('debug message'));
    });

    it('should include context when provided', () => {
      setLogLevel(LogLevel.DEBUG);
      debug('debug message', 'TestContext');
      expect(consoleSpy.log).toHaveBeenCalledWith(expect.stringContaining('[TestContext]'));
    });
  });

  describe('info', () => {
    it('should log info messages', () => {
      info('info message');
      expect(consoleSpy.log).toHaveBeenCalledWith(expect.stringContaining('[INFO]'));
      expect(consoleSpy.log).toHaveBeenCalledWith(expect.stringContaining('info message'));
    });

    it('should include context when provided', () => {
      info('info message', 'TestContext');
      expect(consoleSpy.log).toHaveBeenCalledWith(expect.stringContaining('[TestContext]'));
    });
  });

  describe('warn', () => {
    it('should log warning messages', () => {
      warn('warning message');
      expect(consoleSpy.warn).toHaveBeenCalledWith(expect.stringContaining('[WARN]'));
      expect(consoleSpy.warn).toHaveBeenCalledWith(expect.stringContaining('warning message'));
    });
  });

  describe('error', () => {
    it('should log error messages', () => {
      error('error message');
      expect(consoleSpy.error).toHaveBeenCalledWith(expect.stringContaining('[ERROR]'));
      expect(consoleSpy.error).toHaveBeenCalledWith(expect.stringContaining('error message'));
    });

    it('should log error object when provided', () => {
      const testError = new Error('test error');
      error('error message', 'TestContext', testError);
      expect(consoleSpy.error).toHaveBeenCalledWith(testError);
    });
  });

  describe('createLogger', () => {
    it('should create a scoped logger', () => {
      const logger = createLogger('MyScope');
      logger.info('scoped message');
      expect(consoleSpy.log).toHaveBeenCalledWith(expect.stringContaining('[MyScope]'));
    });

    it('should have all log methods', () => {
      const logger = createLogger('MyScope');
      expect(logger.debug).toBeDefined();
      expect(logger.info).toBeDefined();
      expect(logger.warn).toBeDefined();
      expect(logger.error).toBeDefined();
    });

    it('should call debug with context', () => {
      setLogLevel(LogLevel.DEBUG);
      const logger = createLogger('DebugScope');
      logger.debug('debug message');
      expect(consoleSpy.log).toHaveBeenCalledWith(expect.stringContaining('[DebugScope]'));
    });

    it('should call warn with context', () => {
      const logger = createLogger('WarnScope');
      logger.warn('warning');
      expect(consoleSpy.warn).toHaveBeenCalledWith(expect.stringContaining('[WarnScope]'));
    });

    it('should call error with context', () => {
      const logger = createLogger('ErrorScope');
      logger.error('error');
      expect(consoleSpy.error).toHaveBeenCalledWith(expect.stringContaining('[ErrorScope]'));
    });
  });

  describe('logProgress', () => {
    it('should log progress with percentage', () => {
      logProgress(50, 100, 'Processing items');
      expect(consoleSpy.log).toHaveBeenCalledWith(expect.stringContaining('50/100'));
      expect(consoleSpy.log).toHaveBeenCalledWith(expect.stringContaining('50%'));
      expect(consoleSpy.log).toHaveBeenCalledWith(expect.stringContaining('Processing items'));
    });

    it('should round percentage', () => {
      logProgress(33, 100, 'Items');
      expect(consoleSpy.log).toHaveBeenCalledWith(expect.stringContaining('33%'));
    });
  });

  describe('logSummary', () => {
    it('should log migration summary', () => {
      logSummary({
        total: 100,
        success: 90,
        skipped: 5,
        errors: 5,
      });
      expect(consoleSpy.log).toHaveBeenCalledWith(expect.stringContaining('Migration Summary'));
      expect(consoleSpy.log).toHaveBeenCalledWith(expect.stringContaining('Total records: 100'));
      expect(consoleSpy.log).toHaveBeenCalledWith(expect.stringContaining('Successful: 90'));
      expect(consoleSpy.log).toHaveBeenCalledWith(expect.stringContaining('Skipped: 5'));
      expect(consoleSpy.log).toHaveBeenCalledWith(expect.stringContaining('Errors: 5'));
    });
  });

  describe('Extended Stats Tracking', () => {
    describe('createExtendedStats', () => {
      it('should create empty stats object', () => {
        const stats = createExtendedStats();

        expect(stats.total).toBe(0);
        expect(stats.success).toBe(0);
        expect(stats.skipped).toBe(0);
        expect(stats.errors).toBe(0);
        expect(stats.highestImportedId).toBe(0);
        expect(stats.results).toHaveLength(0);
      });

      it('should initialize all skip reason counts to zero', () => {
        const stats = createExtendedStats();

        expect(stats.skipReasonCounts[SkipReason.ALREADY_EXISTS]).toBe(0);
        expect(stats.skipReasonCounts[SkipReason.INVALID_DATA]).toBe(0);
        expect(stats.skipReasonCounts[SkipReason.MISSING_REQUIRED_FIELD]).toBe(0);
      });

      it('should initialize all error category counts to zero', () => {
        const stats = createExtendedStats();

        expect(stats.errorCategoryCounts[ErrorCategory.VALIDATION_ERROR]).toBe(0);
        expect(stats.errorCategoryCounts[ErrorCategory.DATABASE_ERROR]).toBe(0);
        expect(stats.errorCategoryCounts[ErrorCategory.NETWORK_ERROR]).toBe(0);
      });
    });

    describe('recordSuccess', () => {
      it('should increment success and total counts', () => {
        const stats = createExtendedStats();

        recordSuccess(stats, 1, 'Test Record', 'payload-123', 100);

        expect(stats.success).toBe(1);
        expect(stats.total).toBe(1);
      });

      it('should track highest imported ID', () => {
        const stats = createExtendedStats();

        recordSuccess(stats, 5, 'Record 5');
        recordSuccess(stats, 10, 'Record 10');
        recordSuccess(stats, 3, 'Record 3');

        expect(stats.highestImportedId).toBe(10);
      });

      it('should add result to results array', () => {
        const stats = createExtendedStats();

        recordSuccess(stats, 42, 'Test Post', 'payload-456', 250);

        expect(stats.results).toHaveLength(1);
        expect(stats.results[0]).toEqual({
          legacyId: 42,
          identifier: 'Test Post',
          status: 'success',
          payloadId: 'payload-456',
          processingTimeMs: 250,
        });
      });
    });

    describe('recordSkipped', () => {
      it('should increment skipped and total counts', () => {
        const stats = createExtendedStats();

        recordSkipped(stats, 1, 'Duplicate', SkipReason.ALREADY_EXISTS);

        expect(stats.skipped).toBe(1);
        expect(stats.total).toBe(1);
      });

      it('should increment skip reason count', () => {
        const stats = createExtendedStats();

        recordSkipped(stats, 1, 'Duplicate 1', SkipReason.ALREADY_EXISTS);
        recordSkipped(stats, 2, 'Duplicate 2', SkipReason.ALREADY_EXISTS);
        recordSkipped(stats, 3, 'Invalid', SkipReason.INVALID_DATA);

        expect(stats.skipReasonCounts[SkipReason.ALREADY_EXISTS]).toBe(2);
        expect(stats.skipReasonCounts[SkipReason.INVALID_DATA]).toBe(1);
      });

      it('should add result with skip details', () => {
        const stats = createExtendedStats();

        recordSkipped(
          stats,
          123,
          'Bad Record',
          SkipReason.MISSING_REQUIRED_FIELD,
          'Missing headline',
        );

        expect(stats.results[0]).toEqual({
          legacyId: 123,
          identifier: 'Bad Record',
          status: 'skipped',
          skipReason: SkipReason.MISSING_REQUIRED_FIELD,
          skipDetails: 'Missing headline',
        });
      });
    });

    describe('recordError', () => {
      it('should increment errors and total counts', () => {
        const stats = createExtendedStats();

        recordError(stats, 1, 'Failed Record', ErrorCategory.VALIDATION_ERROR, 'Invalid data');

        expect(stats.errors).toBe(1);
        expect(stats.total).toBe(1);
      });

      it('should increment error category count', () => {
        const stats = createExtendedStats();

        recordError(stats, 1, 'Error 1', ErrorCategory.VALIDATION_ERROR, 'Validation failed');
        recordError(stats, 2, 'Error 2', ErrorCategory.DATABASE_ERROR, 'DB connection lost');
        recordError(
          stats,
          3,
          'Error 3',
          ErrorCategory.VALIDATION_ERROR,
          'Another validation error',
        );

        expect(stats.errorCategoryCounts[ErrorCategory.VALIDATION_ERROR]).toBe(2);
        expect(stats.errorCategoryCounts[ErrorCategory.DATABASE_ERROR]).toBe(1);
      });

      it('should add result with error details', () => {
        const stats = createExtendedStats();

        recordError(stats, 456, 'Broken Record', ErrorCategory.NETWORK_ERROR, 'Connection timeout');

        expect(stats.results[0]).toEqual({
          legacyId: 456,
          identifier: 'Broken Record',
          status: 'error',
          errorCategory: ErrorCategory.NETWORK_ERROR,
          errorMessage: 'Connection timeout',
        });
      });
    });

    describe('logExtendedSummary', () => {
      it('should log summary with skip breakdown', () => {
        const stats = createExtendedStats();
        recordSuccess(stats, 1, 'Record 1');
        recordSkipped(stats, 2, 'Record 2', SkipReason.ALREADY_EXISTS);
        recordSkipped(stats, 3, 'Record 3', SkipReason.ALREADY_EXISTS);

        logExtendedSummary(stats, 'TestCollection');

        expect(consoleSpy.log).toHaveBeenCalledWith(
          expect.stringContaining('Extended Import Summary'),
        );
        expect(consoleSpy.log).toHaveBeenCalledWith(expect.stringContaining('Skipped: 2'));
        expect(consoleSpy.log).toHaveBeenCalledWith(expect.stringContaining('Skip Reasons:'));
        expect(consoleSpy.log).toHaveBeenCalledWith(expect.stringContaining('already_exists: 2'));
      });

      it('should log error breakdown when errors exist', () => {
        const stats = createExtendedStats();
        recordError(stats, 1, 'Error 1', ErrorCategory.VALIDATION_ERROR, 'Invalid data');

        logExtendedSummary(stats);

        expect(consoleSpy.log).toHaveBeenCalledWith(expect.stringContaining('Error Categories:'));
        expect(consoleSpy.log).toHaveBeenCalledWith(expect.stringContaining('validation_error: 1'));
      });

      it('should log highest imported ID', () => {
        const stats = createExtendedStats();
        recordSuccess(stats, 100, 'Record 100');

        logExtendedSummary(stats);

        expect(consoleSpy.log).toHaveBeenCalledWith(
          expect.stringContaining('Highest imported ID: 100'),
        );
      });
    });

    describe('generateStatsMarkdown', () => {
      it('should generate markdown summary table', () => {
        const stats = createExtendedStats();
        recordSuccess(stats, 1, 'Record 1');
        recordSuccess(stats, 2, 'Record 2');
        recordSkipped(stats, 3, 'Record 3', SkipReason.ALREADY_EXISTS);

        const markdown = generateStatsMarkdown(stats, 'Posts');

        expect(markdown).toContain('## Posts Import Results');
        expect(markdown).toContain('### Summary');
        expect(markdown).toContain('| Total Processed | 3 |');
        expect(markdown).toContain('| Successful | 2 |');
        expect(markdown).toContain('| Skipped | 1 |');
      });

      it('should include skip reasons section', () => {
        const stats = createExtendedStats();
        recordSkipped(stats, 1, 'Record 1', SkipReason.ALREADY_EXISTS);
        recordSkipped(stats, 2, 'Record 2', SkipReason.INVALID_DATA);

        const markdown = generateStatsMarkdown(stats, 'Songs');

        expect(markdown).toContain('### Skip Reasons');
        expect(markdown).toContain('| already_exists | 1 |');
        expect(markdown).toContain('| invalid_data | 1 |');
      });

      it('should include error details section', () => {
        const stats = createExtendedStats();
        recordError(stats, 1, 'Bad Post', ErrorCategory.VALIDATION_ERROR, 'Field missing');

        const markdown = generateStatsMarkdown(stats, 'Posts');

        expect(markdown).toContain('### Error Categories');
        expect(markdown).toContain('### Error Details');
        expect(markdown).toContain('| 1 | Bad Post | validation_error | Field missing |');
      });

      it('should escape pipe characters in error table', () => {
        const stats = createExtendedStats();
        recordError(
          stats,
          1,
          'Title with | pipe',
          ErrorCategory.VALIDATION_ERROR,
          'Error | message',
        );

        const markdown = generateStatsMarkdown(stats, 'Posts');

        expect(markdown).toContain('Title with \\| pipe');
      });
    });
  });
});
