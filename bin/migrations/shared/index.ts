/**
 * Shared migration utilities
 * Barrel export for all shared utilities
 */

// Logger utilities
export {
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

// Validation utilities - types
export type {
  ValidationError,
  ValidationResult,
} from './validation';

// Validation utilities - functions
export {
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

// Image uploader utilities - types
export type {
  ImageAssetReference,
  SanityImageValue,
  ImageUploadResult,
} from './imageUploader';

// Image uploader utilities - functions
export {
  createImageUploader,
  fixImagePath,
  isImgurUrl,
} from './imageUploader';

// Rich text converter utilities - types
export type {
  PortableTextBlock,
  PortableTextSpan,
  MarkDef,
} from './richTextConverter';

// Rich text converter utilities - functions
export {
  htmlToPortableText,
  createTextBlock,
  createLinkBlock,
} from './richTextConverter';

// Upsert utilities - types
export type {
  UpsertResult,
  DocumentWithLegacyId,
} from './upsert';

// Upsert utilities - functions
export {
  createUpsertHandler,
  generateDocumentId,
  createSlug,
} from './upsert';
