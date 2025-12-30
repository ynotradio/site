import config from '@payload-config';
import { generatePageMetadata, RootPage } from '@payloadcms/next/views';
import { importMap } from '../importMap';

type Args = {
  params: Promise<{
    segments: string[];
  }>;
  searchParams: Promise<{
    [key: string]: string | string[];
  }>;
};

export const generateMetadata = ({ params, searchParams }: Args) => (
  generatePageMetadata({ config, params, searchParams })
);

const Page = async ({ params, searchParams }: Args) => {
  try {
    console.log('[Admin Page] Rendering admin page');
    return RootPage({
      config, params, searchParams, importMap,
    });
  } catch (error) {
    console.error('[Admin Page] Error rendering:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      env: {
        hasDatabaseUri: !!(process.env.DATABASE_URI || process.env.NEON_DEV_DATABASE_URL),
        hasPayloadSecret: !!process.env.PAYLOAD_SECRET,
      },
    });
    throw error;
  }
};

export default Page;
