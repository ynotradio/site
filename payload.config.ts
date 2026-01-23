import path from 'path';
import { fileURLToPath } from 'url';

import dotenv from 'dotenv';
import { buildConfig } from 'payload';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage';

import { Media } from './payload/src/collections/Media';
import { cloudinaryAdapter } from './payload/src/cloudinary/adapter';
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
import { YearEndPollResults } from './payload/src/collections/YearEndPollResults';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const envFile = process.env.NODE_ENV === 'production' ? '.env' : '.env.local';
dotenv.config({
  path: path.resolve(process.cwd(), envFile),
  override: false,
  quiet: true,
});

const coerceList = (value: string): string[] => value
  .split(',')
  .map((entry) => entry.trim())
  .filter(Boolean);

const isProduction = process.env.NODE_ENV === 'production';
const isBuild = process.env.NEXT_PHASE === 'phase-production-build';
const databaseUri = process.env.DATABASE_URI ?? process.env.NEON_DEV_DATABASE_URL;

// Only require DATABASE_URI when not during build phase
if (!databaseUri && !isBuild) {
  throw new Error(
    'DATABASE_URI (or NEON_DEV_DATABASE_URL) is not defined. Update your .env.local file.',
  );
}

const disableSSL = process.env.DATABASE_SSL === 'disable';
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
    // Auto-login for development: Pre-fills credentials but user must click login
    // https://payloadcms.com/docs/authentication/overview#auto-login
    autoLogin:
      process.env.NODE_ENV === 'development'
        ? {
          email: process.env.PAYLOAD_DEV_EMAIL || 'admin@ynotradio.net',
          password: process.env.PAYLOAD_DEV_PASSWORD || 'password',
          prefillOnly: true,
        }
        : false,
    components: {
      beforeDashboard: [],
      afterDashboard: ['/payload/src/components/dashboard/CustomDashboard#CustomDashboard'],
      views: {
        DJOrder: {
          Component: '/payload/src/features/dj-order#DJOrderTool',
          path: '/dj-order',
          exact: true,
          meta: {
            title: 'DJ Order',
          },
        },
        ShowCloner: {
          Component: '/payload/src/features/show-cloner#ShowClonerTool',
          path: '/show-cloner',
          exact: true,
          meta: {
            title: 'Show Cloner',
          },
        },
      },
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: ' | Y-Not Radio',
    },
  },
  // CORS: Allow requests from these origins (set PAYLOAD_CORS env var in production)
  cors: coerceList(
    process.env.PAYLOAD_CORS ?? 'http://localhost:3000,http://localhost:5173,http://127.0.0.1:5173',
  ),
  // CSRF: Protect against CSRF attacks (set PAYLOAD_CSRF env var in production)
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
    YearEndPollResults,
  ],
  plugins: [
    cloudStoragePlugin({
      collections: {
        media: {
          adapter: cloudinaryAdapter,
          disableLocalStorage: true,
          disablePayloadAccessControl: true,
          generateFileURL: ({ filename: publicId }) => {
            // publicId contains the Cloudinary public_id (e.g., "dev/uploads/my-image")
            // Construct the full Cloudinary URL
            const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
            return `https://res.cloudinary.com/${cloudName}/image/upload/${publicId}`;
          },
        },
      },
    }),
  ],
  typescript: {
    outputFile: path.resolve(dirname, 'payload/types/payload-types.ts'),
  },
  graphQL: {
    schemaOutputFile: path.resolve(dirname, 'payload/types/generated-schema.graphql'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: databaseUri || 'postgresql://localhost:5432/placeholder',
      ssl: disableSSL ? undefined : { rejectUnauthorized: true },
    },
    migrationDir: path.resolve(dirname, 'payload/migrations'),
  }),
});
