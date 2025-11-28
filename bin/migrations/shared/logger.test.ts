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
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('[DEBUG]'),
      );
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('debug message'),
      );
    });

    it('should include context when provided', () => {
      setLogLevel(LogLevel.DEBUG);
      debug('debug message', 'TestContext');
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('[TestContext]'),
      );
    });
  });

  describe('info', () => {
    it('should log info messages', () => {
      info('info message');
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]'),
      );
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('info message'),
      );
    });

    it('should include context when provided', () => {
      info('info message', 'TestContext');
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('[TestContext]'),
      );
    });
  });

  describe('warn', () => {
    it('should log warning messages', () => {
      warn('warning message');
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining('[WARN]'),
      );
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining('warning message'),
      );
    });
  });

  describe('error', () => {
    it('should log error messages', () => {
      error('error message');
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR]'),
      );
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('error message'),
      );
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
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('[MyScope]'),
      );
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
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('[DebugScope]'),
      );
    });

    it('should call warn with context', () => {
      const logger = createLogger('WarnScope');
      logger.warn('warning');
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining('[WarnScope]'),
      );
    });

    it('should call error with context', () => {
      const logger = createLogger('ErrorScope');
      logger.error('error');
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('[ErrorScope]'),
      );
    });
  });

  describe('logProgress', () => {
    it('should log progress with percentage', () => {
      logProgress(50, 100, 'Processing items');
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('50/100'),
      );
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('50%'),
      );
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('Processing items'),
      );
    });

    it('should round percentage', () => {
      logProgress(33, 100, 'Items');
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('33%'),
      );
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
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('Migration Summary'),
      );
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('Total records: 100'),
      );
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('Successful: 90'),
      );
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('Skipped: 5'),
      );
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('Errors: 5'),
      );
    });
  });
});
