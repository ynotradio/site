import { defineProject } from 'vitest/config';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';

/**
 * Vitest project configuration for Storybook component and accessibility tests.
 *
 * Run with: yarn test:storybook
 * This is kept separate from vitest.config.ts (unit tests) so the two suites can
 * be scheduled and scaled independently in CI.
 *
 * The storybookTest() plugin picks up .storybook/main.ts automatically and
 * transforms every story into a Vitest test that:
 *   1. Smoke-tests that the story renders without crashing.
 *   2. Runs any play() interaction tests.
 *   3. Runs axe-core accessibility checks (governed by parameters.a11y.test in preview.ts).
 *
 * Tests execute in real Chromium via Playwright browser mode for maximum accuracy.
 */
export default defineProject({
  plugins: [storybookTest()],
  test: {
    name: 'storybook',
    browser: {
      enabled: true,
      headless: true,
      provider: 'playwright',
      instances: [{ browser: 'chromium' }],
    },
    setupFiles: ['.storybook/vitest.setup.ts'],
  },
});
