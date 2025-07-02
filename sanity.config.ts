import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import schemaTypes from './studio/schemaTypes';
import deskStructure from './studio/deskStructure';
import DJOrderTool from './studio/plugins/dj-order';
import { DJ_ORDER_TOOL_NAME } from './studio/constants';

export default defineConfig({
  name: 'default',
  title: 'Y-Not Radio',

  projectId: 'otcmx0q6',
  dataset: 'production',
  basePath: '/sanity',

  plugins: [
    structureTool({
      structure: deskStructure, // Use our custom desk structure
    }),
    visionTool(),
  ],

  tools: [
    {
      name: DJ_ORDER_TOOL_NAME,
      title: 'DJ Order',
      icon: () => '🎧',
      component: DJOrderTool,
    },
  ],

  schema: {
    types: schemaTypes,
  },
});
