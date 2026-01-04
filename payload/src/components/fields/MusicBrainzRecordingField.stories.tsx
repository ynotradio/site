import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { MusicBrainzRecordingField } from './MusicBrainzRecordingField';

const meta = {
  title: 'Payload/Fields/MusicBrainzRecordingField',
  component: MusicBrainzRecordingField,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MusicBrainzRecordingField>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default empty state - ready for searching recordings
 */
export const Empty: Story = {
  args: {
    path: 'musicbrainzId',
  },
};

/**
 * With existing recording selected (pre-populated MBID)
 */
export const WithSelectedRecording: Story = {
  args: {
    path: 'musicbrainzId',
  },
};
