import type { Meta, StoryObj } from '@storybook/react';
import { Top11CloneButton } from './Top11CloneButton';

const meta: Meta<typeof Top11CloneButton> = {
  title: 'Features/Top 11/Top11CloneButton',
  component: Top11CloneButton,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Top11CloneButton>;

export const Default: Story = {};
