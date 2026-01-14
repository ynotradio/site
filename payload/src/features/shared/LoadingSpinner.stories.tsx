/* eslint-disable import/no-extraneous-dependencies */
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { LoadingSpinner } from './LoadingSpinner';

const meta = {
  title: 'Payload/Features/Shared/LoadingSpinner',
  component: LoadingSpinner,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
A simple animated loading spinner component.

Used throughout the admin interface to indicate loading states.

**Features:**
- Animated spinning border
- Centered by default
- Consistent styling across the app
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof LoadingSpinner>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default loading spinner.
 *
 * Displays a centered spinning animation indicating that content is loading.
 */
export const Default: Story = {};

/**
 * Loading spinner in a container.
 *
 * Shows how the spinner centers itself within a parent container.
 */
export const InContainer: Story = {
  decorators: [
    (Story) => (
      <div style={{
        width: '300px',
        height: '200px',
        border: '1px solid #ddd',
        borderRadius: '8px',
      }}
      >
        <Story />
      </div>
    ),
  ],
};
