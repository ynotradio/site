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
      include: ['bin/migrations/shared/**/*.ts'],
      exclude: [
        '**/*.test.ts',
        '**/*.test.tsx',
      ],
      thresholds: {
        // Set realistic thresholds for tested code
        statements: 75,
        branches: 60,
        functions: 80,
        lines: 75,
      },
    },
  },
});
