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

/**
 * Simulates how the icon looks inside Payload's step-nav breadcrumb (18×18px container).
 */
export const InNavContext: Story = {
  decorators: [
    (Story) => (
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontFamily: 'sans-serif',
          fontSize: 14,
        }}
      >
        <span style={{ width: 'auto', height: 18, display: 'inline-flex' }}>
          <Story />
        </span>
        <span>/</span>
        <span>Dashboard</span>
      </nav>
    ),
  ],
};

/**
 * Shows the branding icon at a larger size to illustrate how the logo could appear
 * in hero-style UI surfaces.
 */
export const Large: Story = {
  args: {
    size: 'large',
  },
};
