import path from 'path';
import { fileURLToPath } from 'url';

import dotenv from 'dotenv';
import { buildConfig } from 'payload';
import { postgresAdapter } from '@payloadcms/db-postgres';

import { Media } from './payload/src/collections/Media';
import { Users } from './payload/src/collections/Users';
import { People } from './payload/src/collections/People';
import { DJs } from './payload/src/collections/DJs';
import { Artists } from './payload/src/collections/Artists';
import { Venues } from './payload/src/collections/Venues';
import { Ads } from './payload/src/collections/Ads';
import { Songs } from './payload/src/collections/Songs';
import { Records } from './payload/src/collections/Records';
import { Concerts } from './payload/src/collections/Concerts';
import { OnDemand } from './payload/src/collections/OnDemand';
import { Shows } from './payload/src/collections/Shows';
import { Posts } from './payload/src/collections/Posts';
import { CdOfTheWeek } from './payload/src/collections/CdOfTheWeek';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

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

if (!databaseUri) {
  throw new Error(
    'DATABASE_URI (or NEON_DEV_DATABASE_URL) is not defined. Update your .env.local file.',
  );
}

const disableSSL = process.env.DATABASE_SSL === 'disable';
const isProduction = process.env.NODE_ENV === 'production';
const isBuild = process.env.NEXT_PHASE === 'phase-production-build';
const payloadSecret = process.env.PAYLOAD_SECRET;

// Validate required secrets in production runtime (not during build)
if (isProduction && !isBuild && !payloadSecret) {
  throw new Error('PAYLOAD_SECRET environment variable must be set in production.');
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
  collections: [
    Users,
    Media,
    People,
    DJs,
    Artists,
    Venues,
    Ads,
    Songs,
    Records,
    Concerts,
    OnDemand,
    Shows,
    Posts,
    CdOfTheWeek,
  ],
  typescript: {
    outputFile: path.resolve(dirname, 'payload/types/payload-types.ts'),
  },
  graphQL: {
    schemaOutputFile: path.resolve(dirname, 'payload/types/generated-schema.graphql'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: databaseUri,
      ssl: disableSSL ? undefined : { rejectUnauthorized: true },
    },
  }),
});
