import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['bin/migrations/shared/**/*.ts'],
      exclude: ['**/*.test.ts'],
      thresholds: {
        // Set realistic thresholds - some functions require SanityClient mocking
        statements: 60,
        branches: 60,
        functions: 80,
        lines: 60,
      },
    },
  },
});
