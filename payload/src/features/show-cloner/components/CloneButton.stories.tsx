import type { Meta, StoryObj } from '@storybook/react';
import { CloneButton } from './CloneButton';

const meta = {
  title: 'Features/Show Cloner/CloneButton',
  component: CloneButton,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    cloning: { control: 'boolean' },
    disabled: { control: 'boolean' },
    showCount: { control: 'number' },
  },
} satisfies Meta<typeof CloneButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    cloning: false,
    disabled: false,
    showCount: 7,
    onClick: () => {},
  },
};

export const SingleShow: Story = {
  args: {
    cloning: false,
    disabled: false,
    showCount: 1,
    onClick: () => {},
  },
};

export const Cloning: Story = {
  args: {
    cloning: true,
    disabled: true,
    showCount: 7,
    onClick: () => {},
  },
};

export const Disabled: Story = {
  args: {
    cloning: false,
    disabled: true,
    showCount: 0,
    onClick: () => {},
  },
};
