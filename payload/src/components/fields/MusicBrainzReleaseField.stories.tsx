/* eslint-disable import/no-extraneous-dependencies */
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { setMockFieldValue, setMockFormFields, resetMocks } from '@/.storybook/mocks/@payloadcms/ui';
import { MusicBrainzReleaseField } from './MusicBrainzReleaseField';

const meta = {
  title: 'Payload/Fields/MusicBrainzReleaseField',
  component: MusicBrainzReleaseField,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
MusicBrainz Release Field Component for Payload CMS.

This component provides an easy-to-use interface for linking albums/releases to MusicBrainz IDs.
The field automatically reads the album title from the form's "title" field and pre-populates the search.

**Workflow:**
1. Enter album title in the form
2. Click "Search MusicBrainz" button
3. Select the correct release from the dropdown results
4. Done! The MusicBrainz ID is saved

**Features:**
- Auto-populates search with album title from form
- One-click search with "Search MusicBrainz" button
- Displays release artist, type (Album, EP, etc.), and date
- Shows match scores to help select the correct release
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
} satisfies Meta<typeof MusicBrainzReleaseField>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default empty state.
 *
 * In this state, content managers see a prompt to search MusicBrainz.
 * When integrated into Payload, the album title will auto-populate from the form,
 * making it as simple as clicking "Search MusicBrainz" and selecting a result.
 */
export const Empty: Story = {
  args: {
    path: 'musicbrainzId',
  },
  decorators: [
    (Story) => {
      setMockFormFields({ title: { value: 'OK Computer' } });
      return <Story />;
    },
  ],
};

/**
 * With existing release selected - "OK Computer" by Radiohead.
 *
 * When a release is already linked, the component displays:
 * - Release title and type
 * - Artist credits
 * - Release date
 * - Disambiguation info (if available)
 * - The MusicBrainz ID
 * - "View on MusicBrainz" link
 * - "Clear" button to unlink
 *
 * This example uses "OK Computer" MBID: 2d9231c1-2279-4f96-a171-1df6b9a5b9f9
 */
export const WithSelectedRelease: Story = {
  args: {
    path: 'musicbrainzId',
  },
  decorators: [
    (Story) => {
      setMockFieldValue('2d9231c1-2279-4f96-a171-1df6b9a5b9f9'); // OK Computer
      setMockFormFields({ title: { value: 'OK Computer' } });
      return <Story />;
    },
  ],
  parameters: {
    docs: {
      description: {
        story: 'This story shows the field with "OK Computer" by Radiohead already linked. The component displays a green success card with all the release details and action buttons.',
      },
    },
  },
};
