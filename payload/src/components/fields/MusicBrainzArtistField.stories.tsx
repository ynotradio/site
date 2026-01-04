import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { MusicBrainzArtistField } from './MusicBrainzArtistField';

const meta = {
  title: 'Payload/Fields/MusicBrainzArtistField',
  component: MusicBrainzArtistField,
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
} satisfies Meta<typeof MusicBrainzArtistField>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default empty state - ready for searching artists
 */
export const Empty: Story = {
  args: {
    path: 'musicbrainzId',
  },
};

/**
 * With existing artist selected (pre-populated MBID)
 */
export const WithSelectedArtist: Story = {
  args: {
    path: 'musicbrainzId',
  },
};
