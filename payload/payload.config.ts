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

// Next.js will populate these from .env.local
const databaseUri = process.env.DATABASE_URI ?? process.env.NEON_DEV_DATABASE_URL ?? '';
const disableSSL = process.env.DATABASE_SSL === 'disable';

export default buildConfig({
  secret: process.env.PAYLOAD_SECRET || 'development-secret',
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
    outputFile: path.resolve(dirname, 'payload/types/payload-types.ts'),
  },
  graphQL: {
    schemaOutputFile: path.resolve(dirname, 'payload/types/generated-schema.graphql'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: databaseUri,
      ssl: disableSSL ? undefined : { rejectUnauthorized: false },
    },
  }),
});
