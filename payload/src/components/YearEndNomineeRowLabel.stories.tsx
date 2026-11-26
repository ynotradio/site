/* eslint-disable import/no-extraneous-dependencies */
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, within } from 'storybook/test';
import { resetMocks, setMockRowLabel } from '@payloadcms/ui';
import YearEndNomineeRowLabel from './YearEndNomineeRowLabel';

const meta = {
  title: 'Components/YearEndNomineeRowLabel',
  component: YearEndNomineeRowLabel,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => {
      resetMocks();
      return <Story />;
    },
  ],
} satisfies Meta<typeof YearEndNomineeRowLabel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TextNomineeWithVotes: Story = {
  decorators: [
    (Story) => {
      setMockRowLabel({ data: { customLabel: 'Severance', voteCount: 42 }, rowNumber: 0 });
      return <Story />;
    },
  ],
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('Severance (42 votes)')).toBeInTheDocument();
  },
};

export const LinkedArtist: Story = {
  decorators: [
    (Story) => {
      setMockRowLabel({ data: { artist: { id: 7, name: 'Wet Leg' }, voteCount: 1 }, rowNumber: 3 });
      return <Story />;
    },
  ],
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('Wet Leg (1 vote)')).toBeInTheDocument();
  },
};

export const EmptyRow: Story = {
  decorators: [
    (Story) => {
      setMockRowLabel({ data: {}, rowNumber: 4 });
      return <Story />;
    },
  ],
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('Nominee 05')).toBeInTheDocument();
  },
};
