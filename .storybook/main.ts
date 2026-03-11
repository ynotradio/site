import type { StorybookConfig } from '@storybook/nextjs-vite';
import { mergeConfig } from 'vite';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const config: StorybookConfig = {
  "stories": [
    "../app/**/*.mdx",
    "../app/**/*.stories.@(js|jsx|mjs|ts|tsx)",
    "../payload/**/*.mdx",
    "../payload/**/*.stories.@(js|jsx|mjs|ts|tsx)",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    "@chromatic-com/storybook",
    "@storybook/addon-vitest",
    "@storybook/addon-a11y",
    "@storybook/addon-docs",
    "@storybook/addon-onboarding"
  ],
  "framework": "@storybook/nextjs-vite",
  "staticDirs": [
    "../public"
  ],
  async viteFinal(config) {
    return mergeConfig(config, {
      resolve: {
        alias: {
          '@payloadcms/ui': resolve(__dirname, './mocks/@payloadcms/ui.tsx')
        }
      }
    });
  }
};
export default config;