import type { Meta, StoryObj } from '@storybook/react';
import { DndContext } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableItem } from './SortableItem';

const meta = {
  title: 'Features/Story Order/SortableItem',
  component: SortableItem,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  decorators: [
    (Story, context) => (
      <DndContext>
        <SortableContext items={[context.args.id]} strategy={verticalListSortingStrategy}>
          <div style={{ maxWidth: '400px' }}>
            <Story />
          </div>
        </SortableContext>
      </DndContext>
    ),
  ],
} satisfies Meta<typeof SortableItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const VisibleStory: Story = {
  args: {
    id: '1',
    name: 'Station Wins Local Award',
    isActive: true,
  },
};

export const HiddenStory: Story = {
  args: {
    id: '2',
    name: 'Old Holiday Announcement',
    isActive: false,
  },
};

export const Multiple: Story = {
  args: {
    id: '1',
    name: 'Top Story',
    isActive: true,
  },
  render: () => (
    <DndContext>
      <SortableContext items={['1', '2', '3', '4']} strategy={verticalListSortingStrategy}>
        <div style={{ maxWidth: '400px' }}>
          <SortableItem id="1" name="Top Story" isActive={true} />
          <SortableItem id="2" name="Second Story" isActive={true} />
          <SortableItem id="3" name="Older Story" isActive={false} />
          <SortableItem id="4" name="Archived Story" isActive={false} />
        </div>
      </SortableContext>
    </DndContext>
  ),
};
