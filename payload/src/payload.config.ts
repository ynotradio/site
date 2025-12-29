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

// Skip validation during build - only validate in actual runtime
if (!isBuild) {
  if (!databaseUri) {
    console.error('DATABASE_URI is missing. Checked:', {
      DATABASE_URI: process.env.DATABASE_URI,
      NEON_DEV_DATABASE_URL: process.env.NEON_DEV_DATABASE_URL,
    });
    throw new Error(
      'DATABASE_URI (or NEON_DEV_DATABASE_URL) is not defined. Update your .env.local file.',
    );
  }
  
  // Validate required secrets in production runtime
  if (isProduction && !payloadSecret) {
    console.error('PAYLOAD_SECRET is missing:', process.env.PAYLOAD_SECRET);
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
