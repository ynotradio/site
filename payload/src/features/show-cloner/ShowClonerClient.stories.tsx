import type { Meta, StoryObj } from '@storybook/react';
import { ShowClonerClient } from './ShowClonerClient';

const mockShows = {
  docs: [
    {
      id: '1',
      date: '2024-01-15T05:00:00.000Z',
      startTime: '10:00',
      endTime: '12:00',
      name: 'Morning Show',
      host: { id: '10', displayName: 'DJ Alpha' },
    },
    {
      id: '2',
      date: '2024-01-16T05:00:00.000Z',
      startTime: '14:00',
      endTime: '16:00',
      name: 'Afternoon Vibes',
      host: { id: '11', displayName: 'DJ Beta' },
    },
    {
      id: '3',
      date: '2024-01-17T05:00:00.000Z',
      startTime: '20:00',
      endTime: '22:00',
      name: 'Night Grooves',
      host: { id: '12', displayName: 'DJ Gamma' },
    },
  ],
  totalDocs: 3,
  limit: 0,
  totalPages: 1,
  page: 1,
};

const meta = {
  title: 'Features/Show Cloner/ShowClonerClient',
  component: ShowClonerClient,
  parameters: {
    layout: 'fullscreen',
    mockData: [
      {
        url: '/api/shows?limit=0&sort=-date,startTime',
        method: 'GET',
        status: 200,
        response: mockShows,
      },
    ],
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ShowClonerClient>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const EmptyState: Story = {
  parameters: {
    mockData: [
      {
        url: '/api/shows?limit=0&sort=-date,startTime',
        method: 'GET',
        status: 200,
        response: {
          docs: [],
          totalDocs: 0,
          limit: 0,
          totalPages: 0,
          page: 1,
        },
      },
    ],
  },
};

export const LoadingError: Story = {
  parameters: {
    mockData: [
      {
        url: '/api/shows?limit=0&sort=-date,startTime',
        method: 'GET',
        status: 500,
        response: { error: 'Internal Server Error' },
      },
    ],
  },
};
