import type { Meta, StoryObj } from '@storybook/react';
import { MatchesListHeader } from './MatchesListHeader';

const meta: Meta<typeof MatchesListHeader> = {
  title: 'Features/MRM Live/MatchesListHeader',
  component: MatchesListHeader,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof MatchesListHeader>;

export const Default: Story = {};
