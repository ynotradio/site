import type { Meta, StoryObj } from '@storybook/react';
import { CdOfTheWeekWizardClient } from './CdOfTheWeekWizardClient';

const mockArtistsResponse = {
  docs: [
    { id: 1, name: 'Radiohead' },
    { id: 2, name: 'Radio Moscow' },
    { id: 3, name: 'Radio Dept.' },
  ],
  totalDocs: 3,
};

const mockPeopleResponse = {
  docs: [
    { id: 10, name: 'Alice Smith' },
    { id: 11, name: 'Bob Jones' },
  ],
  totalDocs: 2,
};

const meta = {
  title: 'Features/CD of the Week Wizard/CdOfTheWeekWizardClient',
  component: CdOfTheWeekWizardClient,
  parameters: {
    layout: 'fullscreen',
    mockData: [
      {
        url: '/api/artists?where[name][contains]=radio&limit=10&sort=name',
        method: 'GET',
        status: 200,
        response: mockArtistsResponse,
      },
      {
        url: '/api/people?where[name][contains]=alice&limit=10&sort=name',
        method: 'GET',
        status: 200,
        response: mockPeopleResponse,
      },
    ],
  },
  tags: ['autodocs'],
} satisfies Meta<typeof CdOfTheWeekWizardClient>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
