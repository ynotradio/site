import type { Meta, StoryObj } from '@storybook/react';
import { SourceDateRangeSelector } from './SourceDateRangeSelector';

const meta = {
  title: 'Features/Show Cloner/SourceDateRangeSelector',
  component: SourceDateRangeSelector,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SourceDateRangeSelector>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: {
    sourceStartDate: '',
    sourceEndDate: '',
    selectedRangeDateGroups: [],
    selectedRangeShows: 0,
    onStartDateChange: () => {},
    onEndDateChange: () => {},
  },
};

export const WithDatesNoShows: Story = {
  args: {
    sourceStartDate: '2024-01-15',
    sourceEndDate: '2024-01-21',
    selectedRangeDateGroups: [],
    selectedRangeShows: 0,
    onStartDateChange: () => {},
    onEndDateChange: () => {},
  },
};

export const WithShows: Story = {
  args: {
    sourceStartDate: '2024-01-15',
    sourceEndDate: '2024-01-21',
    selectedRangeDateGroups: [
      {
        date: '2024-01-15',
        formattedDate: 'Monday, Jan 15, 2024',
        dayName: 'Monday',
        shows: [
          {
            id: '1',
            date: '2024-01-15',
            startTime: '10:00:00',
            endTime: '12:00:00',
            name: 'Morning Show',
            hostName: 'DJ Alpha',
          },
        ],
      },
      {
        date: '2024-01-16',
        formattedDate: 'Tuesday, Jan 16, 2024',
        dayName: 'Tuesday',
        shows: [
          {
            id: '2',
            date: '2024-01-16',
            startTime: '14:00:00',
            endTime: '16:00:00',
            name: 'Afternoon Show',
            hostName: 'DJ Beta',
          },
          {
            id: '3',
            date: '2024-01-16',
            startTime: '20:00:00',
            endTime: '22:00:00',
            name: 'Evening Show',
            hostName: 'DJ Gamma',
          },
        ],
      },
    ],
    selectedRangeShows: 3,
    onStartDateChange: () => {},
    onEndDateChange: () => {},
  },
};
