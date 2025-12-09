import { defineCliConfig } from 'sanity/cli';

export default defineCliConfig({
  studioHost: 'ynotradio',

  api: {
    projectId: 'otcmx0q6',
    dataset: 'production',
  },

  deployment: {
    appId: 'rqvmfj3toaqe5zrka2vzt0jm',
    autoUpdates: true,
  },
});
