import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@payload-config': path.resolve(import.meta.dirname, './payload.config.ts'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['**/*.test.ts', '**/*.test.tsx'],
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: [
        'bin/migrations/shared/**/*.ts',
        'src/js/countdown.js',
        'src/js/yr_end_poll.js',
        'src/js/admin-madness.js',
        'src/js/components/mrm-bracket-match.js',
        'src/js/components/mrm-scoreboard.js',
        'src/js/components/mrm-match-card.js',
        'payload/src/utils/auth.ts',
        'payload/src/features/embed/utils.ts',
        'payload/src/features/show-cloner/utils.ts',
        'payload/src/features/show-cloner/hooks/useDateRanges.ts',
        'payload/src/components/cells/**/*.tsx',
        'payload/src/components/branding/**/*.tsx',
        'payload/src/components/providers/**/*.tsx',
      ],
      exclude: [
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.stories.tsx',
        '**/musicbrainz.ts', // Excluded because tests are skipped in CI (requires external API)
      ],
      thresholds: {
        statements: 80,
        branches: 60,
        functions: 85,
        lines: 80,
      },
    },
    server: {
      deps: {
        // Force inline to avoid CSS import errors from dependencies
        inline: ['@payloadcms/ui'],
      },
    },
  },
});
