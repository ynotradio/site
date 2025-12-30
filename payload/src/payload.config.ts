import path from 'path';

import dotenv from 'dotenv';
import { buildConfig } from 'payload';
import { postgresAdapter } from '@payloadcms/db-postgres';

import { Media } from './collections/Media';
import { Users } from './collections/Users';

const envFile = process.env.NODE_ENV === 'production' ? '.env' : '.env.local';
dotenv.config({
  path: path.resolve(process.cwd(), envFile),
  override: false,
});

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
console.log('[Payload Config] Environment:', {
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PHASE: process.env.NEXT_PHASE,
  isBuild,
  hasDatabaseUri: !!databaseUri,
  hasPayloadSecret: !!payloadSecret,
  DATABASE_SSL: process.env.DATABASE_SSL,
  PAYLOAD_PUBLIC_SERVER_URL: process.env.PAYLOAD_PUBLIC_SERVER_URL,
});

// Skip validation during build - only validate in actual runtime
if (!isBuild) {
  if (!databaseUri) {
    // eslint-disable-next-line no-console
    console.error('[Payload Config] DATABASE_URI is missing. Environment:', {
      DATABASE_URI: process.env.DATABASE_URI ? 'SET (hidden)' : 'NOT SET',
      NEON_DEV_DATABASE_URL: process.env.NEON_DEV_DATABASE_URL ? 'SET (hidden)' : 'NOT SET',
      allEnvKeys: Object.keys(process.env).filter((k) => k.includes('DATABASE')),
    });
    throw new Error(
      'DATABASE_URI (or NEON_DEV_DATABASE_URL) is not defined. Check Netlify environment variables.',
    );
  }

  // Validate required secrets in production runtime
  if (isProduction && !payloadSecret) {
    // eslint-disable-next-line no-console
    console.error('[Payload Config] PAYLOAD_SECRET is missing');
    throw new Error('PAYLOAD_SECRET environment variable must be set in production.');
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
    outputFile: path.resolve(__dirname, '../types/payload-types.ts'),
  },
  graphQL: {
    schemaOutputFile: path.resolve(__dirname, '../types/generated-schema.graphql'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: databaseUri,
      ssl: disableSSL ? undefined : { rejectUnauthorized: true },
    },
  }),
});
