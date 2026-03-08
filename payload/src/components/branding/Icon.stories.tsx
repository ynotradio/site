import type { Meta, StoryObj } from '@storybook/react';
import { Icon } from './Icon';

const meta: Meta<typeof Icon> = {
  title: 'Components/Branding/Icon',
  component: Icon,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Icon>;

/**
 * The Y-Not Radio oval logo icon shown in the Payload admin navigation bar.
 */
export const Default: Story = {};
