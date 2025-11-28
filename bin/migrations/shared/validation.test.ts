import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  validResult,
  invalidResult,
  addError,
  mergeResults,
  validateRequired,
  validateUrl,
  validateDate,
  validateNumber,
  validateMaxLength,
  logValidationErrors,
  validateRecord,
} from './validation';

describe('validation', () => {
  let consoleSpy: {
    log: ReturnType<typeof vi.spyOn>;
    warn: ReturnType<typeof vi.spyOn>;
  };

  beforeEach(() => {
    consoleSpy = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('validResult', () => {
    it('should return a valid result', () => {
      const result = validResult();
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });

  describe('invalidResult', () => {
    it('should return an invalid result with errors', () => {
      const errors = [{ field: 'name', message: 'Name is required' }];
      const result = invalidResult(errors);
      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(errors);
    });
  });

  describe('addError', () => {
    it('should add an error to a result', () => {
      const result = validResult();
      const newResult = addError(result, 'email', 'Email is invalid', 'bad@');
      expect(newResult.isValid).toBe(false);
      expect(newResult.errors).toHaveLength(1);
      expect(newResult.errors[0].field).toBe('email');
      expect(newResult.errors[0].message).toBe('Email is invalid');
      expect(newResult.errors[0].value).toBe('bad@');
    });

    it('should preserve existing errors', () => {
      const result = invalidResult([{ field: 'name', message: 'Required' }]);
      const newResult = addError(result, 'email', 'Invalid');
      expect(newResult.errors).toHaveLength(2);
    });
  });

  describe('mergeResults', () => {
    it('should merge valid results', () => {
      const result = mergeResults(validResult(), validResult());
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should merge invalid results', () => {
      const result = mergeResults(
        invalidResult([{ field: 'a', message: 'Error A' }]),
        invalidResult([{ field: 'b', message: 'Error B' }]),
      );
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
    });

    it('should be invalid if any result is invalid', () => {
      const result = mergeResults(
        validResult(),
        invalidResult([{ field: 'a', message: 'Error' }]),
      );
      expect(result.isValid).toBe(false);
    });
  });

  describe('validateRequired', () => {
    it('should return valid for non-empty string', () => {
      const result = validateRequired('value', 'field');
      expect(result.isValid).toBe(true);
    });

    it('should return invalid for empty string', () => {
      const result = validateRequired('', 'field');
      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toBe('field is required');
    });

    it('should return invalid for null', () => {
      const result = validateRequired(null, 'field');
      expect(result.isValid).toBe(false);
    });

    it('should return invalid for undefined', () => {
      const result = validateRequired(undefined, 'field');
      expect(result.isValid).toBe(false);
    });

    it('should return valid for number 0', () => {
      const result = validateRequired(0, 'field');
      expect(result.isValid).toBe(true);
    });

    it('should return valid for false', () => {
      const result = validateRequired(false, 'field');
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateUrl', () => {
    it('should return valid for valid URL', () => {
      const result = validateUrl('https://example.com', 'url');
      expect(result.isValid).toBe(true);
    });

    it('should return valid for empty value', () => {
      const result = validateUrl('', 'url');
      expect(result.isValid).toBe(true);
    });

    it('should return valid for null', () => {
      const result = validateUrl(null, 'url');
      expect(result.isValid).toBe(true);
    });

    it('should return invalid for invalid URL', () => {
      const result = validateUrl('not-a-url', 'url');
      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toBe('url must be a valid URL');
    });
  });

  describe('validateDate', () => {
    it('should return valid for valid date string', () => {
      const result = validateDate('2024-01-15', 'date');
      expect(result.isValid).toBe(true);
    });

    it('should return valid for ISO date string', () => {
      const result = validateDate('2024-01-15T10:30:00Z', 'date');
      expect(result.isValid).toBe(true);
    });

    it('should return valid for empty value', () => {
      const result = validateDate('', 'date');
      expect(result.isValid).toBe(true);
    });

    it('should return valid for null', () => {
      const result = validateDate(null, 'date');
      expect(result.isValid).toBe(true);
    });

    it('should return invalid for invalid date', () => {
      const result = validateDate('not-a-date', 'date');
      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toBe('date must be a valid date');
    });
  });

  describe('validateNumber', () => {
    it('should return valid for number', () => {
      const result = validateNumber(42, 'count');
      expect(result.isValid).toBe(true);
    });

    it('should return valid for numeric string', () => {
      const result = validateNumber('42', 'count');
      expect(result.isValid).toBe(true);
    });

    it('should return valid for zero', () => {
      const result = validateNumber(0, 'count');
      expect(result.isValid).toBe(true);
    });

    it('should return valid for empty string', () => {
      const result = validateNumber('', 'count');
      expect(result.isValid).toBe(true);
    });

    it('should return valid for null', () => {
      const result = validateNumber(null, 'count');
      expect(result.isValid).toBe(true);
    });

    it('should return invalid for non-numeric string', () => {
      const result = validateNumber('abc', 'count');
      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toBe('count must be a valid number');
    });
  });

  describe('validateMaxLength', () => {
    it('should return valid for string within limit', () => {
      const result = validateMaxLength('short', 'field', 10);
      expect(result.isValid).toBe(true);
    });

    it('should return valid for empty string', () => {
      const result = validateMaxLength('', 'field', 10);
      expect(result.isValid).toBe(true);
    });

    it('should return valid for null', () => {
      const result = validateMaxLength(null, 'field', 10);
      expect(result.isValid).toBe(true);
    });

    it('should return invalid for string exceeding limit', () => {
      const result = validateMaxLength('this is a very long string', 'field', 10);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toBe('field must not exceed 10 characters');
    });

    it('should truncate value in error message', () => {
      const longString = 'a'.repeat(100);
      const result = validateMaxLength(longString, 'field', 10);
      expect(result.errors[0].value).toBe('a'.repeat(50) + '...');
    });
  });

  describe('logValidationErrors', () => {
    it('should not log for valid result', () => {
      logValidationErrors('123', validResult());
      expect(consoleSpy.warn).not.toHaveBeenCalled();
    });

    it('should log errors for invalid result', () => {
      const result = invalidResult([
        { field: 'name', message: 'Name is required' },
        { field: 'email', message: 'Email is invalid' },
      ]);
      logValidationErrors('123', result);
      expect(consoleSpy.warn).toHaveBeenCalled();
    });
  });

  describe('validateRecord', () => {
    it('should validate record with multiple validators', () => {
      const record = { name: 'John', email: 'john@example.com' };
      const validators = {
        name: (value: unknown, field: string) => validateRequired(value, field),
        email: (value: unknown, field: string) => validateUrl(value as string, field),
      };
      const result = validateRecord(record, validators);
      expect(result.isValid).toBe(false); // email is not a URL
    });

    it('should return valid for valid record', () => {
      const record = { name: 'John', url: 'https://example.com' };
      const validators = {
        name: (value: unknown, field: string) => validateRequired(value, field),
        url: (value: unknown, field: string) => validateUrl(value as string, field),
      };
      const result = validateRecord(record, validators);
      expect(result.isValid).toBe(true);
    });

    it('should collect all validation errors', () => {
      const record = { name: '', url: 'invalid' };
      const validators = {
        name: (value: unknown, field: string) => validateRequired(value, field),
        url: (value: unknown, field: string) => validateUrl(value as string, field),
      };
      const result = validateRecord(record, validators);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
    });
  });
});
