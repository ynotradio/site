// Preload script to fix @next/env ESM/CJS interop issue
// Usage: node --import tsx --import ./bin/preload-nextenv-fix.mjs bin/migrations/importMusic.ts

import * as nextEnv from '@next/env';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const Module = require('module');
const originalLoad = Module._load;

// Patch Module._load to return fixed @next/env module
Module._load = function(request, parent, isMain) {
  if (request === '@next/env') {
    // Return a module with both named exports and a default that works with Payload
    return {
      ...nextEnv,
      default: nextEnv
    };
  }
  return originalLoad.apply(this, arguments);
};

// Also patch for ESM dynamic imports
const originalDynamicImport = globalThis.import;
// Note: Can't easily patch dynamic imports, but the Module._load should handle CJS requires
