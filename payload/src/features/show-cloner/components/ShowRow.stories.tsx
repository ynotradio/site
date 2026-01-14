import type { Meta, StoryObj } from '@storybook/react';
import { ShowRow } from './ShowRow';

const meta = {
  title: 'Features/ShowCloner/ShowRow',
  component: ShowRow,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ShowRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    show: {
      id: '1',
      name: 'The Morning Show',
      hostName: 'John Smith',
      startTime: '09:00:00',
      endTime: '11:00:00',
    },
  },
};

export const AfternoonShow: Story = {
  args: {
    show: {
      id: '2',
      name: 'Afternoon Vibes',
      hostName: 'Sarah Johnson',
      startTime: '14:30:00',
      endTime: '16:30:00',
    },
  },
};

export const EveningShow: Story = {
  args: {
    show: {
      id: '3',
      name: 'Night Grooves',
      hostName: 'Mike Davis',
      startTime: '20:00:00',
      endTime: '23:00:00',
    },
  },
};

export const LateNightShow: Story = {
  args: {
    show: {
      id: '4',
      name: 'Midnight Sessions',
      hostName: 'Alex Taylor',
      startTime: '00:00:00',
      endTime: '02:00:00',
    },
  },
};

export const NoHostName: Story = {
  args: {
    show: {
      id: '5',
      name: 'Solo Show',
      hostName: '',
      startTime: '15:00:00',
      endTime: '17:00:00',
    },
  },
};

export const NoShowName: Story = {
  args: {
    show: {
      id: '6',
      name: '',
      hostName: 'Anonymous Host',
      startTime: '12:00:00',
      endTime: '14:00:00',
    },
  },
};

export const UntitledShow: Story = {
  args: {
    show: {
      id: '7',
      name: '',
      hostName: '',
      startTime: '10:00:00',
      endTime: '12:00:00',
    },
  },
};
