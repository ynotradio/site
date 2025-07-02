import { defineCliConfig } from 'sanity/cli';

export default defineCliConfig({
  studioHost: 'ynotradio',

  api: {
    projectId: 'otcmx0q6',
    dataset: 'production',
  },
  /**
   * Enable auto-updates for studios.
   * Learn more at https://www.sanity.io/docs/cli#auto-updates
   */
  autoUpdates: true,
});
