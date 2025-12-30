import { withPayload } from '@payloadcms/next/withPayload';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Experimental features required by Payload
  experimental: {
    reactCompiler: false,
    instrumentationHook: true,
  },
  // Ensure logs are visible in Netlify
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

export default withPayload(nextConfig);
