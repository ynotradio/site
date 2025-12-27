import { defineCliConfig } from 'sanity/cli';

export default defineCliConfig({
  studioHost: 'ynotradio',

  api: {
    projectId: 'otcmx0q6',
    dataset: 'production',
  },

  deployment: {
    appId: 'rqvmfj3toaqe5zrka2vzt0jm',
    // Disable auto-updates to ensure schema changes are deployed
    autoUpdates: false,
  },
});
