/* eslint-disable import/no-extraneous-dependencies */
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { setMockFieldValue, setMockFormFields, resetMocks } from '@payloadcms/ui';
import { MusicBrainzRecordingField } from './MusicBrainzRecordingField';

const meta = {
  title: 'Payload/Fields/MusicBrainzRecordingField',
  component: MusicBrainzRecordingField,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
MusicBrainz Recording Field Component for Payload CMS.

This component provides an easy-to-use interface for linking songs/recordings to MusicBrainz IDs.
The field automatically reads the song title from the form's "title" field and pre-populates the search.

**Workflow:**
1. Enter song title in the form
2. Click "Search MusicBrainz" button
3. Select the correct recording from the dropdown results
4. Done! The MusicBrainz ID is saved

**Features:**
- Auto-populates search with song title from form
- One-click search with "Search MusicBrainz" button
- Displays recording artist, duration, and disambiguation
- Shows match scores to help select the correct recording
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
} satisfies Meta<typeof MusicBrainzRecordingField>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default empty state.
 *
 * In this state, content managers see a prompt to search MusicBrainz.
 * When integrated into Payload, the song title will auto-populate from the form,
 * making it as simple as clicking "Search MusicBrainz" and selecting a result.
 */
export const Empty: Story = {
  args: {
    path: 'musicbrainzId',
  },
  decorators: [
    (Story) => {
      setMockFormFields({ title: { value: 'Karma Police' } });
      return <Story />;
    },
  ],
};

/**
 * With existing recording selected - "Karma Police" by Radiohead.
 *
 * When a recording is already linked, the component displays:
 * - Recording title and duration
 * - Artist credits
 * - Disambiguation info (if available)
 * - The MusicBrainz ID
 * - "View on MusicBrainz" link
 * - "Clear" button to unlink
 *
 * This example uses "Karma Police" MBID: 4f3b4bf6-c8e3-4b2e-a4e9-9e9f9c9b9c9c
 */
export const WithSelectedRecording: Story = {
  args: {
    path: 'musicbrainzId',
  },
  decorators: [
    (Story) => {
      setMockFieldValue('e0d2c2c2-8c7f-4e0f-8c7f-4e0f8c7f4e0f'); // Karma Police
      setMockFormFields({ title: { value: 'Karma Police' } });
      return <Story />;
    },
  ],
  parameters: {
    docs: {
      description: {
        story:
          'This story shows the field with "Karma Police" by Radiohead already linked. The component displays a green success card with all the recording details and action buttons.',
      },
    },
  },
};
