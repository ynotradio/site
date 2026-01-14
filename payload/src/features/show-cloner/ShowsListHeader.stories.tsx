import type { Meta, StoryObj } from '@storybook/react';
import { ShowsListHeader } from './ShowsListHeader';

const meta = {
  title: 'Features/Show Cloner/ShowsListHeader',
  component: ShowsListHeader,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ShowsListHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const InContext: Story = {
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
