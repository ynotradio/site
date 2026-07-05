import { defineWorkspace } from 'vitest/config';

/**
 * Vitest workspace — registers both the unit-test and Storybook projects.
 *
 * The Storybook addon-vitest plugin (used by the "Test" panel in the Storybook
 * UI) discovers the storybook project via a filter named
 * `storybook:<configDir>` that is set by the storybookTest() plugin.  It
 * resolves that filter against ALL projects in the workspace, so without this
 * file the UI throws "No projects matched the filter storybook:/…/.storybook".
 *
 * CLI scripts are unaffected — they still pass `--config` explicitly:
 *   yarn test            → vitest run (picks up vitest.config.ts)
 *   yarn test:storybook  → vitest run --config vitest.storybook.config.ts
 */
export default defineWorkspace([
  // Unit tests (jsdom, coverage)
  './vitest.config.ts',
  // Story smoke-tests + axe-core a11y checks (Playwright/Chromium)
  './vitest.storybook.config.ts',
]);
