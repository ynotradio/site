import type { Meta, StoryObj } from '@storybook/react';
import { setMockFieldValue, resetMocks } from '@payloadcms/ui';
import { TimePickerField } from './TimePickerField';

const meta: Meta<typeof TimePickerField> = {
  title: 'Components/Fields/TimePickerField',
  component: TimePickerField,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  decorators: [
    (Story, ctx) => {
      resetMocks();
      setMockFieldValue(
        ctx.args.path === 'startTime' ? (ctx.parameters.initialValue ?? '09:00') : '',
      );
      return <Story />;
    },
  ],
};

export default meta;
type Story = StoryObj<typeof TimePickerField>;

export const MorningTime: Story = {
  name: '9:00 AM',
  args: { path: 'startTime' },
  parameters: { initialValue: '09:00' },
};

export const AfternoonTime: Story = {
  name: '2:30 PM',
  args: { path: 'startTime' },
  parameters: { initialValue: '14:30' },
};

export const Noon: Story = {
  name: '12:00 PM (noon)',
  args: { path: 'startTime' },
  parameters: { initialValue: '12:00' },
};

export const Midnight: Story = {
  name: '12:00 AM (midnight)',
  args: { path: 'startTime' },
  parameters: { initialValue: '00:00' },
};

export const Empty: Story = {
  name: 'Empty value',
  args: { path: 'startTime' },
  parameters: { initialValue: '' },
};
