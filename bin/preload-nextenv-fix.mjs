// WORKAROUND: @next/env ESM/CJS interop fix
// Tracking issue: https://github.com/ynotradio/site/issues/323
//
// Problem:
//   Payload's loadEnv.js does `import nextEnvImport from '@next/env'` (ESM default
//   import of a CJS module). tsx resolves the default import as undefined, so
//   `const { loadEnvConfig } = nextEnvImport` throws. Node's native ESM loader
//   handles this correctly, but tsx does not.
//
// Why this exists:
//   - @next/env ships CJS-only (no ESM exports field, even in v16.x)
//   - Payload 3.x uses a default import pattern that breaks under tsx
//   - Node 22 --experimental-strip-types can't replace tsx here because
//     Payload's CJS↔ESM bridge for loading payload.config.ts requires tsx
//
// When to remove:
//   This shim is no longer needed when ANY of these happen:
//   1. Payload changes `import nextEnvImport from '@next/env'` to
//      `import * as nextEnv from '@next/env'` (works in both tsx and native Node)
//   2. @next/env ships an ESM build (Next.js issue #68091)
//   3. tsx fixes CJS default-import interop to match Node's native behavior
//
// How to test if it's still needed:
//   Remove `--import ./bin/preload-nextenv-fix.mjs` from one payload:* script
//   in package.json, then run it. If it works, this file can be deleted.

import * as nextEnv from '@next/env';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const Module = require('module');
const originalLoad = Module._load;

Module._load = function(request, parent, isMain) {
  if (request === '@next/env') {
    return {
      ...nextEnv,
      default: nextEnv
    };
  }
  return originalLoad.apply(this, arguments);
};
