import { withPayload } from '@payloadcms/next/withPayload';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Payload does not support the React Compiler yet
  reactCompiler: false,
  // Stop `next dev` from writing an agent-rules block into AGENTS.md
  agentRules: false,
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
