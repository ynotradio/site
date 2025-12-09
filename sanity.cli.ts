import { defineCliConfig } from 'sanity/cli';

export default defineCliConfig({
  studioHost: 'ynotradio',

  api: {
    projectId: 'otcmx0q6',
    dataset: 'production',
  },

  deployment: {
    appId: 'rqvmfj3toaqe5zrka2vzt0jm',
    // Disable auto-updates in CI to allow offline builds
    autoUpdates: process.env.CI !== 'true',
  },
});
