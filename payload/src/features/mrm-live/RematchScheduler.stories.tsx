import type { Meta, StoryObj } from '@storybook/react';
import { RematchScheduler } from './RematchScheduler';

const meta: Meta<typeof RematchScheduler> = {
  title: 'Features/MRM Live/RematchScheduler',
  component: RematchScheduler,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof RematchScheduler>;

export const Idle: Story = {
  args: {
    saving: false,
    onConfirm: async () => {},
  },
};

export const Saving: Story = {
  args: {
    saving: true,
    onConfirm: async () => {},
  },
};
