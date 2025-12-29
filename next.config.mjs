import { withPayload } from '@payloadcms/next/withPayload';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Experimental features required by Payload
  experimental: {
    reactCompiler: false,
  },
};

export default withPayload(nextConfig);
