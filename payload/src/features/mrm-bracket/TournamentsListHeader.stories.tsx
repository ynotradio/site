import type { Meta, StoryObj } from '@storybook/react';
import { TournamentsListHeader } from './TournamentsListHeader';

const meta: Meta<typeof TournamentsListHeader> = {
  title: 'Features/MRM Bracket/TournamentsListHeader',
  component: TournamentsListHeader,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof TournamentsListHeader>;

export const Default: Story = {};
