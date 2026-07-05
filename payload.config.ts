import path from 'path';
import { fileURLToPath } from 'url';

import dotenv from 'dotenv';
import { buildConfig } from 'payload';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage';

import { Media } from './payload/src/collections/Media';
import { cloudinaryAdapter } from './payload/src/cloudinary/adapter';
import { cloudinaryGenerateFileURL } from './payload/src/cloudinary/generateFileURL';
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
import { YearEndPolls } from './payload/src/collections/YearEndPolls';
import { YearEndPollCategories } from './payload/src/collections/YearEndPollCategories';
import { YearEndPollVotes } from './payload/src/collections/YearEndPollVotes';
import { YearEndPollResults } from './payload/src/collections/YearEndPollResults';
import { Top11Contests } from './payload/src/collections/Top11Contests';
import { Top11Votes } from './payload/src/collections/Top11Votes';
import { Top11WriteIns } from './payload/src/collections/Top11WriteIns';
import { Top11Contestants } from './payload/src/collections/Top11Contestants';
import { Top11WinnerDraws } from './payload/src/collections/Top11WinnerDraws';
import { ModernRockMadnessTournaments } from './payload/src/collections/MadnessTournaments';
import { ModernRockMadnessGroups } from './payload/src/collections/MadnessBands';
import { ModernRockMadnessMatches } from './payload/src/collections/MadnessMatches';
import { ModernRockMadnessVotes } from './payload/src/collections/MadnessVotes';
import { ModernRockMadnessMatchEvents } from './payload/src/collections/MadnessMatchEvents';
import { DEPLOY_ORIGIN } from './payload/generated/deploy-origin';

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

// Netlify's per-deploy origin (https://my-branch--site.netlify.app) is only
// available during the build, not at function runtime where this config runs.
// scripts/netlify-bake-deploy-origin.sh freezes DEPLOY_PRIME_URL into
// DEPLOY_ORIGIN at build time. Payload's CSRF check is an exact string match
// (no globs), so this origin must be in the allowlist or cookie auth is
// rejected on Server Actions (the wizard's form-state POST).
const withDeployOrigin = (origins: string[]): string[] => {
  if (!DEPLOY_ORIGIN || origins.includes(DEPLOY_ORIGIN)) {
    return origins;
  }
  return [...origins, DEPLOY_ORIGIN];
};

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
  queryPresets: {
    access: {
      create: ({ req }) => Boolean(req.user),
      read: ({ req }) => Boolean(req.user),
      update: ({ req }) => Boolean(req.user),
      delete: ({ req }) => Boolean(req.user),
    },
    // No custom constraints — use Payload's built-in defaults:
    // "Only Me", "Everyone", and "Specific Users"
    constraints: {},
  },
  admin: {
    dateFormat: 'EEEE, MMMM do, yyyy',
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
      graphics: {
        Logo: '/payload/src/components/branding/Logo#Logo',
        Icon: '/payload/src/components/branding/Icon#Icon',
      },
      providers: ['/payload/src/components/providers/NavDefaultClosed#NavDefaultClosed'],
      beforeDashboard: [],
      afterDashboard: ['/payload/src/components/dashboard/CustomDashboard#CustomDashboard'],
      afterNavLinks: ['/payload/src/features/shared/RadioToolsNavLinks#RadioToolsNavLinks'],
      views: {
        DJOrder: {
          Component: '/payload/src/features/dj-order#DJOrderTool',
          path: '/dj-order',
          exact: true,
          meta: {
            title: 'DJ Order',
          },
        },
        StoryOrder: {
          Component: '/payload/src/features/story-order#StoryOrderTool',
          path: '/story-order',
          exact: true,
          meta: {
            title: 'Story Order',
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
        CdOfTheWeekWizard: {
          Component: '/payload/src/features/cd-of-the-week-wizard#CdOfTheWeekWizardTool',
          path: '/cd-of-the-week-wizard',
          exact: true,
          meta: {
            title: 'New CD of the Week + Album',
          },
        },
        MRMLive: {
          Component: '/payload/src/features/mrm-live#LiveMatchTool',
          path: '/mrm-live',
          exact: true,
          meta: {
            title: 'Live Match Dashboard',
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
  cors: withDeployOrigin(
    coerceList(
      process.env.PAYLOAD_CORS
        ?? 'http://localhost:3000,http://localhost:3002,http://localhost:5173,http://127.0.0.1:5173',
    ),
  ),
  // CSRF: Protect against CSRF attacks (set PAYLOAD_CSRF env var in production)
  csrf: withDeployOrigin(
    coerceList(process.env.PAYLOAD_CSRF ?? 'http://localhost:3000,http://localhost:3002'),
  ),
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
    YearEndPolls,
    YearEndPollCategories,
    YearEndPollVotes,
    Top11Contests,
    Top11Votes,
    Top11WriteIns,
    Top11Contestants,
    Top11WinnerDraws,
    ModernRockMadnessTournaments,
    ModernRockMadnessGroups,
    ModernRockMadnessMatches,
    ModernRockMadnessVotes,
    ModernRockMadnessMatchEvents,
  ],
  plugins: [
    cloudStoragePlugin({
      collections: {
        media: {
          adapter: cloudinaryAdapter,
          disableLocalStorage: true,
          disablePayloadAccessControl: true,
          generateFileURL: cloudinaryGenerateFileURL,
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
