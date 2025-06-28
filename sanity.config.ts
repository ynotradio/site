import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import schemaTypes from './schemaTypes'
import deskStructure from './deskStructure.ts'
import DJOrderTool from './plugins/dj-order'

export default defineConfig({
  name: 'default',
  title: 'Y-Not Radio',

  projectId: 'otcmx0q6',
  dataset: 'production',
  basePath: '/sanity',

  plugins: [
    structureTool({
      structure: deskStructure // Use our custom desk structure
    }),
    visionTool(),
  ],
  
  tools: [
    // Add our custom DJ ordering tool as a standalone tool
    {
      name: 'dj-order-tool',
      title: 'DJ Order',
      icon: () => '🎧',
      component: DJOrderTool
    }
  ],

  schema: {
    types: schemaTypes,
  },
})
