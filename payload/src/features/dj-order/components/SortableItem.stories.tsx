import type { Meta, StoryObj } from '@storybook/react';
import { DndContext } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableItem } from './SortableItem';

const meta = {
  title: 'Features/DJ Order/SortableItem',
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

export const ActiveDJ: Story = {
  args: {
    id: '1',
    name: 'DJ Jazzy Jeff',
    isActive: true,
  },
};

export const InactiveDJ: Story = {
  args: {
    id: '2',
    name: 'DJ Retired',
    isActive: false,
  },
};

export const Multiple: Story = {
  args: {
    id: '1',
    name: 'DJ Fresh',
    isActive: true,
  },
  render: () => (
    <DndContext>
      <SortableContext items={['1', '2', '3', '4']} strategy={verticalListSortingStrategy}>
        <div style={{ maxWidth: '400px' }}>
          <SortableItem id="1" name="DJ Fresh" isActive={true} />
          <SortableItem id="2" name="DJ Smooth" isActive={true} />
          <SortableItem id="3" name="DJ Old School" isActive={false} />
          <SortableItem id="4" name="DJ Legend" isActive={false} />
        </div>
      </SortableContext>
    </DndContext>
  ),
};
