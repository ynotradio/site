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
const payloadSecret = process.env.PAYLOAD_SECRET;

// Validate required environment variables in production
if (isProduction) {
  if (!payloadSecret) {
    throw new Error('PAYLOAD_SECRET environment variable must be set in production.');
  }
  if (!databaseUri) {
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
