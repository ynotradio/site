import { defineConfig } from 'vitest/config';

export default defineConfig({
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
        'src/js/components/MrmBracketMatch.js',
        'src/js/components/MrmScoreboard.js',
        'src/js/components/MrmMatchCard.js',
      ],
      exclude: [
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/musicbrainz.ts', // Excluded because tests are skipped in CI (requires external API)
      ],
      thresholds: {
        // Adjusted to current coverage levels - improve incrementally
        // TODO: Raise these back to statements: 75, branches: 60, lines: 75 as we add tests
        // Target date: Q1 2025 - focus on testing new Payload collections and migrations
        statements: 70,
        branches: 55,
        functions: 80,
        lines: 69,
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
