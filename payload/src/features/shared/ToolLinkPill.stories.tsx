import type { Meta, StoryObj } from '@storybook/react';
import { ToolLinkPill } from './ToolLinkPill';

const meta = {
  title: 'Features/Shared/ToolLinkPill',
  component: ToolLinkPill,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ToolLinkPill>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    href: '/admin/dj-order',
    label: 'DJ Sort Order',
  },
};

export const InContext: Story = {
  args: {
    href: '/admin/show-cloner',
    label: 'Show Cloner',
  },
  decorators: [
    (Story) => (
      <div style={{ backgroundColor: '#f5f5f5', padding: '20px' }}>
        <div style={{ backgroundColor: 'white', padding: '10px', borderRadius: '4px' }}>
          <Story />
          <div style={{ marginTop: '16px', padding: '16px', border: '1px solid #ddd' }}>
            <p style={{ margin: 0, color: '#666' }}>Shows collection list would appear here...</p>
          </div>
        </div>
      </div>
    ),
  ],
};
