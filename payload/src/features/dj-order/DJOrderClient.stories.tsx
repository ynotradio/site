import type { Meta, StoryObj } from '@storybook/react';
import { DJOrderClient } from './DJOrderClient';

const meta = {
  title: 'Features/DJ Order/DJOrderClient',
  component: DJOrderClient,
  parameters: {
    layout: 'fullscreen',
    mockData: [
      {
        url: '/api/djs?limit=100&sort=sortOrder&where[onAir][equals]=true',
        method: 'GET',
        status: 200,
        response: {
          docs: [
            {
              id: '1',
              displayName: 'DJ Alpha',
              sortOrder: 0,
              onAir: true,
            },
            {
              id: '2',
              displayName: 'DJ Beta',
              sortOrder: 1,
              onAir: true,
            },
            {
              id: '3',
              displayName: 'DJ Gamma',
              sortOrder: 2,
              onAir: false,
            },
          ],
          totalDocs: 3,
          limit: 100,
          totalPages: 1,
          page: 1,
        },
      },
    ],
  },
  tags: ['autodocs'],
} satisfies Meta<typeof DJOrderClient>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithManyDJs: Story = {
  parameters: {
    mockData: [
      {
        url: '/api/djs?limit=100&sort=sortOrder&where[onAir][equals]=true',
        method: 'GET',
        status: 200,
        response: {
          docs: Array.from({ length: 10 }, (_, i) => ({
            id: String(i + 1),
            displayName: `DJ ${String.fromCharCode(65 + i)}`,
            sortOrder: i,
            onAir: i % 3 !== 0, // Every 3rd DJ is off air
          })),
          totalDocs: 10,
          limit: 100,
          totalPages: 1,
          page: 1,
        },
      },
    ],
  },
};

export const EmptyState: Story = {
  parameters: {
    mockData: [
      {
        url: '/api/djs?limit=100&sort=sortOrder&where[onAir][equals]=true',
        method: 'GET',
        status: 200,
        response: {
          docs: [],
          totalDocs: 0,
          limit: 100,
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
        url: '/api/djs?limit=100&sort=sortOrder&where[onAir][equals]=true',
        method: 'GET',
        status: 500,
        response: {
          error: 'Internal Server Error',
        },
      },
    ],
  },
};
