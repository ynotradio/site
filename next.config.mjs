import { withPayload } from '@payloadcms/next/withPayload';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Experimental features required by Payload
  experimental: {
    reactCompiler: false,
  },
  // Use build-specific tsconfig that excludes bin directory
  typescript: {
    tsconfigPath: './tsconfig.build.json',
  },
  // Redirect root to admin dashboard
  async redirects() {
    return [
      {
        source: '/',
        destination: '/admin',
        permanent: true,
      },
    ];
  },
};

export default withPayload(nextConfig);
