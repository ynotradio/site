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
        'src/js/components/mrm-bracket-match.js',
        'src/js/components/mrm-scoreboard.js',
        'src/js/components/mrm-match-card.js',
        'payload/src/cloudinary/adapter.ts',
        'payload/src/cloudinary/generateFileURL.ts',
        'payload/src/utils/auth.ts',
        'payload/src/utils/createAdminView.tsx',
        'payload/src/utils/musicbrainz-api.ts',
        'payload/src/collections/hooks/**/*.ts',
        'payload/src/features/embed/utils.ts',
        'payload/src/features/mrm-bracket/bracketUtils.ts',
        'payload/src/features/mrm-live/matchControlsUtils.ts',
        'payload/src/features/mrm-live/useMatchActions.ts',
        'payload/src/features/show-cloner/utils.ts',
        'payload/src/features/show-cloner/hooks/useDateRanges.ts',
        'payload/src/features/show-cloner/hooks/useShowCloner.ts',
        'payload/src/features/show-cloner/hooks/useShows.ts',
        'payload/src/components/cells/**/*.tsx',
        'payload/src/components/branding/**/*.tsx',
        'payload/src/components/providers/**/*.tsx',
        'payload/src/components/dashboard/**/*.tsx',
        'payload/src/components/fields/**/*.{ts,tsx}',
        'payload/src/features/shared/**/*.tsx',
        'payload/src/features/dj-order/**/*.tsx',
        'payload/src/features/embed/client.tsx',
        'payload/src/features/mrm-bracket/**/*.tsx',
        'payload/src/features/mrm-live/**/*.tsx',
        'payload/src/features/mrm-shared/**/*.tsx',
        'payload/src/features/show-cloner/**/*.tsx',
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
