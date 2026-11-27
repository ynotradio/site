/* eslint-disable import/no-extraneous-dependencies */
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, within } from 'storybook/test';
import { resetMocks, setMockRowLabel } from '@payloadcms/ui';
import StaffPickRowLabel from './StaffPickRowLabel';

const meta = {
  title: 'Components/StaffPickRowLabel',
  component: StaffPickRowLabel,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => {
      resetMocks();
      return <Story />;
    },
  ],
} satisfies Meta<typeof StaffPickRowLabel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Pick: Story = {
  decorators: [
    (Story) => {
      setMockRowLabel({ data: { artist: 'Wet Leg', title: 'CPR' }, rowNumber: 0 });
      return <Story />;
    },
  ],
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('1. Wet Leg - CPR')).toBeInTheDocument();
  },
};

export const NewPick: Story = {
  decorators: [
    (Story) => {
      setMockRowLabel({ data: {}, rowNumber: 2 });
      return <Story />;
    },
  ],
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('3. New pick')).toBeInTheDocument();
  },
};
