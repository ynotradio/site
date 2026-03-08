import type { Meta, StoryObj } from '@storybook/react';
import { Logo } from './Logo';

const meta: Meta<typeof Logo> = {
  title: 'Components/Branding/Logo',
  component: Logo,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Logo>;

/**
 * The Y-Not Radio oval logo shown on the Payload admin login screen and header.
 */
export const Default: Story = {};

/**
 * Logo on a dark background, as seen in the Payload dark theme admin panel.
 */
export const OnDark: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
  },
};
