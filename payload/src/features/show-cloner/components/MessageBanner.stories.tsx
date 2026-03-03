import type { Meta, StoryObj } from '@storybook/react';
import { MessageBanner } from './MessageBanner';

const meta = {
  title: 'Features/ShowCloner/MessageBanner',
  component: MessageBanner,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    type: { control: 'radio', options: ['error', 'success'] },
    message: { control: 'text' },
  },
} satisfies Meta<typeof MessageBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Error: Story = {
  args: {
    message: 'Error cloning shows. Please try again.',
    type: 'error',
  },
};

export const Success: Story = {
  args: {
    message: 'Successfully cloned 7 shows to Mon, Jan 22 - Sun, Jan 28, 2024.',
    type: 'success',
  },
};
