import type { Meta, StoryObj } from '@storybook/react';
import { StoryOrderClient } from './StoryOrderClient';

const meta = {
  title: 'Features/Story Order/StoryOrderClient',
  component: StoryOrderClient,
  parameters: {
    layout: 'fullscreen',
    mockData: [
      {
        url: '/api/posts?limit=100&sort=priority&where[showOnFrontPage][equals]=true&where[_status][equals]=published',
        method: 'GET',
        status: 200,
        response: {
          docs: [
            {
              id: '1',
              headline: 'Station Wins Local Award',
              priority: 0,
              showOnFrontPage: true,
            },
            {
              id: '2',
              headline: 'New Show Launches Next Week',
              priority: 1,
              showOnFrontPage: true,
            },
            {
              id: '3',
              headline: 'Holiday Schedule Posted',
              priority: 2,
              showOnFrontPage: false,
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
} satisfies Meta<typeof StoryOrderClient>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithManyStories: Story = {
  parameters: {
    mockData: [
      {
        url: '/api/posts?limit=100&sort=priority&where[showOnFrontPage][equals]=true&where[_status][equals]=published',
        method: 'GET',
        status: 200,
        response: {
          docs: Array.from({ length: 10 }, (_, i) => ({
            id: String(i + 1),
            headline: `Front Page Story ${i + 1}`,
            priority: i,
            showOnFrontPage: true,
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
        url: '/api/posts?limit=100&sort=priority&where[showOnFrontPage][equals]=true&where[_status][equals]=published',
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
        url: '/api/posts?limit=100&sort=priority&where[showOnFrontPage][equals]=true&where[_status][equals]=published',
        method: 'GET',
        status: 500,
        response: {
          error: 'Internal Server Error',
        },
      },
    ],
  },
};
