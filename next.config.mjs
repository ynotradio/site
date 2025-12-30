import { withPayload } from '@payloadcms/next/withPayload';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Experimental features required by Payload
  experimental: {
    reactCompiler: false,
    // Enable instrumentation for better error tracking
    instrumentationHook: true,
  },
  
  // Enable verbose logging in production for debugging
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

export default withPayload(nextConfig);
