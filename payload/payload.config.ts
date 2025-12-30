import path from 'path';
import { fileURLToPath } from 'url';

import { buildConfig } from 'payload';
import { postgresAdapter } from '@payloadcms/db-postgres';

import { Media } from './src/collections/Media';
import { Users } from './src/collections/Users';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const coerceList = (value: string): string[] => (
  value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
);

const databaseUri = process.env.DATABASE_URI ?? process.env.NEON_DEV_DATABASE_URL;
const disableSSL = process.env.DATABASE_SSL === 'disable';
const isProduction = process.env.NODE_ENV === 'production';
const isBuild = process.env.NEXT_PHASE === 'phase-production-build';
const payloadSecret = process.env.PAYLOAD_SECRET;

// Log environment info for debugging
// eslint-disable-next-line no-console
console.log('[Payload Config Root] Environment:', {
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PHASE: process.env.NEXT_PHASE,
  isBuild,
  hasDatabaseUri: !!databaseUri,
  hasPayloadSecret: !!payloadSecret,
  DATABASE_SSL: process.env.DATABASE_SSL,
  PAYLOAD_PUBLIC_SERVER_URL: process.env.PAYLOAD_PUBLIC_SERVER_URL,
});

// Skip validation during build - only validate in actual runtime
if (!isBuild && isProduction) {
  if (!payloadSecret) {
    // eslint-disable-next-line no-console
    console.error('[Payload Config Root] PAYLOAD_SECRET is missing');
    throw new Error('PAYLOAD_SECRET environment variable must be set in production.');
  }
  if (!databaseUri) {
    // eslint-disable-next-line no-console
    console.error('[Payload Config Root] DATABASE_URI is missing. Environment:', {
      DATABASE_URI: process.env.DATABASE_URI ? 'SET (hidden)' : 'NOT SET',
      NEON_DEV_DATABASE_URL: process.env.NEON_DEV_DATABASE_URL ? 'SET (hidden)' : 'NOT SET',
      allEnvKeys: Object.keys(process.env).filter((k) => k.includes('DATABASE')),
    });
    throw new Error('Database connection string is not set. Please define DATABASE_URI or NEON_DEV_DATABASE_URL.');
  }
}

export default buildConfig({
  secret: payloadSecret || 'development-secret',
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000',
  admin: {
    user: Users.slug,
    components: {
      beforeDashboard: [],
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: ' | Y-Not Radio',
    },
  },
  cors: coerceList(
    process.env.PAYLOAD_CORS ?? 'http://localhost:3000,http://localhost:5173,http://127.0.0.1:5173',
  ),
  csrf: coerceList(process.env.PAYLOAD_CSRF ?? 'http://localhost:3000'),
  collections: [Users, Media],
  typescript: {
    outputFile: path.resolve(dirname, 'types/payload-types.ts'),
  },
  graphQL: {
    schemaOutputFile: path.resolve(dirname, 'types/generated-schema.graphql'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: databaseUri,
      ssl: disableSSL ? undefined : { rejectUnauthorized: true },
    },
  }),
});
