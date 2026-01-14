/* eslint-disable import/no-extraneous-dependencies */
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { EmptyState } from './EmptyState';

const meta = {
  title: 'Payload/Features/Shared/EmptyState',
  component: EmptyState,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
An empty state component for displaying when no items are found.

Used throughout the admin interface to provide helpful messages when lists are empty.

**Features:**
- Default message: "No items found."
- Customizable message via \`message\` prop
- Muted styling that doesn't distract from the main content
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    message: {
      control: 'text',
      description: 'The message to display',
    },
  },
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default empty state.
 *
 * Shows the default "No items found." message.
 */
export const Default: Story = {};

/**
 * With custom message.
 *
 * Shows a customized empty state message.
 */
export const WithCustomMessage: Story = {
  args: {
    message: 'No shows found. Create some shows first.',
  },
};

/**
 * Empty DJs state.
 *
 * Example used in the DJ Order tool.
 */
export const NoDJs: Story = {
  args: {
    message: 'No DJs found. Create some DJs first.',
  },
};
