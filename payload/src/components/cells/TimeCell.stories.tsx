import type { Meta, StoryObj } from '@storybook/react';
import { TimeCell } from './TimeCell';

const field = { name: 'startTime', type: 'text' as const };
const sharedArgs = { field, collectionSlug: 'shows' as const, rowData: {} };

const meta: Meta<typeof TimeCell> = {
  title: 'Components/Cells/TimeCell',
  component: TimeCell,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof TimeCell>;

export const Morning: Story = {
  name: '9:00 AM',
  args: { ...sharedArgs, cellData: '09:00' },
};

export const Afternoon: Story = {
  name: '2:30 PM',
  args: { ...sharedArgs, cellData: '14:30' },
};

export const Noon: Story = {
  name: '12:00 PM (noon)',
  args: { ...sharedArgs, cellData: '12:00' },
};

export const Midnight: Story = {
  name: '12:00 AM (midnight)',
  args: { ...sharedArgs, cellData: '00:00' },
};

export const WithSeconds: Story = {
  name: 'Seconds stripped (09:00:00)',
  args: { ...sharedArgs, cellData: '09:00:00' },
};

export const Empty: Story = {
  name: 'Empty — dash',
  args: { ...sharedArgs, cellData: null },
};
