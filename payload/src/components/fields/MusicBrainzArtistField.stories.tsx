/* eslint-disable import/no-extraneous-dependencies */
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { setMockFieldValue, setMockFormFields, resetMocks } from '@payloadcms/ui';
import { MusicBrainzArtistField } from './MusicBrainzArtistField';

const meta = {
  title: 'Payload/Fields/MusicBrainzArtistField',
  component: MusicBrainzArtistField,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
MusicBrainz Artist Field Component for Payload CMS.

This component provides an easy-to-use interface for linking artists to MusicBrainz IDs. 
The field automatically reads the artist name from the form's "name" field and pre-populates the search.

**Workflow:**
1. Enter artist name in the form
2. Click "Search MusicBrainz" button
3. Select the correct artist from the dropdown results
4. Done! The MusicBrainz ID is saved

**Features:**
- Auto-populates search with artist name from form
- One-click search with "Search MusicBrainz" button
- Displays artist type, disambiguation, and active years
- Shows match scores to help select the correct artist
- Selected state shows MBID with link to MusicBrainz and clear button
        `,
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => {
      resetMocks();
      return (
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
          <Story />
        </div>
      );
    },
  ],
} satisfies Meta<typeof MusicBrainzArtistField>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default empty state.
 *
 * In this state, content managers see a prompt to search MusicBrainz.
 * When integrated into Payload, the artist name will auto-populate from the form,
 * making it as simple as clicking "Search MusicBrainz" and selecting a result.
 */
export const Empty: Story = {
  args: {
    path: 'musicbrainzId',
  },
  decorators: [
    (Story) => {
      setMockFormFields({ name: { value: 'Radiohead' } });
      return <Story />;
    },
  ],
};

/**
 * With existing artist selected - Radiohead.
 *
 * When an artist is already linked, the component displays:
 * - Artist name and type (Person, Group, etc.)
 * - Disambiguation info (if available)
 * - Active years (if available)
 * - The MusicBrainz ID
 * - "View on MusicBrainz" link
 * - "Clear" button to unlink
 *
 * This example uses Radiohead's MBID: a74b1b7f-71a5-4011-9441-d0b5e4122711
 */
export const WithSelectedArtist: Story = {
  args: {
    path: 'musicbrainzId',
  },
  decorators: [
    (Story) => {
      setMockFieldValue('a74b1b7f-71a5-4011-9441-d0b5e4122711'); // Radiohead
      setMockFormFields({ name: { value: 'Radiohead' } });
      return <Story />;
    },
  ],
  parameters: {
    docs: {
      description: {
        story:
          'This story shows the field with Radiohead already linked. The component displays a green success card with all the artist details and action buttons.',
      },
    },
  },
};
