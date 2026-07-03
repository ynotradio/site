import type { Meta, StoryObj } from '@storybook/react';
import { TargetDateSelector } from './TargetDateSelector';

const meta = {
  title: 'Features/Show Cloner/TargetDateSelector',
  component: TargetDateSelector,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof TargetDateSelector>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithFullDateRange: Story = {
  args: {
    targetStartDate: '2024-01-22',
    targetEndDate: '2024-01-28',
    sourceStartDate: '2024-01-15',
    sourceEndDate: '2024-01-21',
    onTargetStartDateChange: () => {},
  },
};

export const NoTargetDate: Story = {
  args: {
    targetStartDate: '',
    targetEndDate: '',
    sourceStartDate: '2024-01-15',
    sourceEndDate: '2024-01-21',
    onTargetStartDateChange: () => {},
  },
};

export const NoSourceDates: Story = {
  args: {
    targetStartDate: '2024-01-22',
    targetEndDate: '',
    sourceStartDate: '',
    sourceEndDate: '',
    onTargetStartDateChange: () => {},
  },
};
