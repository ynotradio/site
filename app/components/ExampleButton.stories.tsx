import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { ExampleButton } from './ExampleButton';

/**
 * Example story demonstrating how to create stories for components.
 * Stories should be colocated with their components (same directory).
 *
 * To create stories for your own components:
 * 1. Create a .stories.tsx file next to your component
 * 2. Import the component and type definitions from Storybook
 * 3. Define a meta object with component metadata
 * 4. Export story variations as named exports
 */
const meta = {
  title: 'Components/ExampleButton',
  component: ExampleButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    onClick: fn(),
  },
} satisfies Meta<typeof ExampleButton>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Primary button variant - default style
 */
export const Primary: Story = {
  args: {
    label: 'Primary Button',
    variant: 'primary',
  },
};

/**
 * Secondary button variant
 */
export const Secondary: Story = {
  args: {
    label: 'Secondary Button',
    variant: 'secondary',
  },
};

/**
 * Disabled state
 */
export const Disabled: Story = {
  args: {
    label: 'Disabled Button',
    disabled: true,
  },
};
