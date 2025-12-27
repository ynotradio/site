import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['**/*.test.ts', '**/*.test.tsx'],
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['bin/migrations/shared/**/*.ts', 'studio/plugins/**/*.tsx'],
      exclude: [
        '**/*.test.ts',
        '**/*.test.tsx',
        'studio/plugins/artist-cleanup.tsx',
        'studio/plugins/dj-order/index.tsx',
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
