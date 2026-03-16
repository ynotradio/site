import { withPayload } from '@payloadcms/next/withPayload';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Experimental features required by Payload
  experimental: {
    reactCompiler: false,
  },
  // Use build-specific tsconfig that excludes bin directory.
  // ignoreBuildErrors: payload-types.ts is generated at runtime and may not
  // exist during Docker image builds. TypeScript is checked separately by CI.
  typescript: {
    tsconfigPath: './tsconfig.build.json',
    ignoreBuildErrors: true,
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
