import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { MusicBrainzReleaseField } from './MusicBrainzReleaseField';

const meta = {
  title: 'Payload/Fields/MusicBrainzReleaseField',
  component: MusicBrainzReleaseField,
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
} satisfies Meta<typeof MusicBrainzReleaseField>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default empty state - ready for searching releases
 */
export const Empty: Story = {
  args: {
    path: 'musicbrainzId',
  },
};

/**
 * With existing release selected (pre-populated MBID)
 */
export const WithSelectedRelease: Story = {
  args: {
    path: 'musicbrainzId',
  },
};
