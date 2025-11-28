/**
 * Validation utilities for migration records
 */

import { createLogger } from './logger';

const logger = createLogger('Validation');

export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Create a successful validation result
 */
export function validResult(): ValidationResult {
  return { isValid: true, errors: [] };
}

/**
 * Create a failed validation result with errors
 */
export function invalidResult(errors: ValidationError[]): ValidationResult {
  return { isValid: false, errors };
}

/**
 * Add an error to a validation result
 */
export function addError(
  result: ValidationResult,
  field: string,
  message: string,
  value?: unknown,
): ValidationResult {
  return {
    isValid: false,
    errors: [...result.errors, { field, message, value }],
  };
}

/**
 * Merge multiple validation results
 */
export function mergeResults(...results: ValidationResult[]): ValidationResult {
  const allErrors = results.flatMap((r) => r.errors);
  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
  };
}

/**
 * Validate that a required field is not empty
 */
export function validateRequired(
  value: unknown,
  fieldName: string,
): ValidationResult {
  if (value === null || value === undefined || value === '') {
    return invalidResult([{
      field: fieldName,
      message: `${fieldName} is required`,
      value,
    }]);
  }
  return validResult();
}

/**
 * Validate that a string is a valid URL
 */
export function validateUrl(value: string | null | undefined, fieldName: string): ValidationResult {
  if (!value) {
    return validResult(); // Empty URLs are valid (not required)
  }

  try {
    // eslint-disable-next-line no-new
    new URL(value);
    return validResult();
  } catch {
    return invalidResult([{
      field: fieldName,
      message: `${fieldName} must be a valid URL`,
      value,
    }]);
  }
}

/**
 * Validate that a string is a valid date (ISO format or common formats)
 */
export function validateDate(
  value: string | null | undefined,
  fieldName: string,
): ValidationResult {
  if (!value) {
    return validResult(); // Empty dates are valid (not required)
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return invalidResult([{
      field: fieldName,
      message: `${fieldName} must be a valid date`,
      value,
    }]);
  }
  return validResult();
}

/**
 * Validate that a value is a number
 */
export function validateNumber(
  value: unknown,
  fieldName: string,
): ValidationResult {
  if (value === null || value === undefined || value === '') {
    return validResult(); // Empty numbers are valid (not required)
  }

  const num = Number(value);
  if (Number.isNaN(num)) {
    return invalidResult([{
      field: fieldName,
      message: `${fieldName} must be a valid number`,
      value,
    }]);
  }
  return validResult();
}

/**
 * Validate that a string does not exceed a maximum length
 */
export function validateMaxLength(
  value: string | null | undefined,
  fieldName: string,
  maxLength: number,
): ValidationResult {
  if (!value) {
    return validResult();
  }

  if (value.length > maxLength) {
    return invalidResult([{
      field: fieldName,
      message: `${fieldName} must not exceed ${maxLength} characters`,
      value: `${value.substring(0, 50)}...`,
    }]);
  }
  return validResult();
}

/**
 * Log validation errors for a record
 */
export function logValidationErrors(
  recordId: string | number,
  result: ValidationResult,
): void {
  if (result.isValid) return;

  logger.warn(`Validation failed for record ${recordId}:`);
  result.errors.forEach((err) => {
    logger.warn(`  - ${err.field}: ${err.message}`);
  });
}

/**
 * Validate a record against a schema of validators
 */
export function validateRecord<T extends Record<string, unknown>>(
  record: T,
  validators: Record<string, (value: unknown, field: string) => ValidationResult>,
): ValidationResult {
  const results: ValidationResult[] = [];

  Object.entries(validators).forEach(([field, validator]) => {
    const value = record[field];
    results.push(validator(value, field));
  });

  return mergeResults(...results);
}
