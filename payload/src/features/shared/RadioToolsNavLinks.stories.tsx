/* eslint-disable import/no-extraneous-dependencies */
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { RadioToolsNavLinks } from './RadioToolsNavLinks';

const meta = {
  title: 'Payload/Features/Shared/RadioToolsNavLinks',
  component: RadioToolsNavLinks,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
Navigation links for Radio Tools in the Payload admin sidebar.

Provides quick access to:
- **DJ Order** - Drag-and-drop DJ reordering tool
- **Story Order** - Drag-and-drop front-page story reordering tool
- **Show Cloner** - Clone shows from one date range to another

**Usage:**
This component is registered in the Payload admin config to appear in the sidebar navigation.
        `,
      },
    },
    nextjs: {
      appDirectory: true,
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div
        style={{
          width: '250px',
          backgroundColor: '#f5f5f5',
          borderRadius: '8px',
        }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof RadioToolsNavLinks>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default navigation links.
 *
 * Shows the Radio Tools navigation section with links to DJ Order and Show Cloner.
 */
export const Default: Story = {};
