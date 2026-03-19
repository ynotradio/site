import type { Meta, StoryObj } from '@storybook/react';
import {
  MusicBrainzArtistCell,
  MusicBrainzReleaseCell,
  MusicBrainzRecordingCell,
} from './MusicBrainzCell';

const sharedArgs = {
  field: { name: 'musicbrainzId', type: 'text' as const },
  collectionSlug: 'artists' as const,
  rowData: {},
};

// ── Artist Cell ──────────────────────────────────────────────────────────────

const artistMeta: Meta<typeof MusicBrainzArtistCell> = {
  title: 'Components/Cells/MusicBrainzCell',
  component: MusicBrainzArtistCell,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default artistMeta;
type ArtistStory = StoryObj<typeof MusicBrainzArtistCell>;

/**
 * Shows the orange MB badge/link when an artist has a MusicBrainz match.
 */
export const ArtistWithMatch: ArtistStory = {
  name: 'Artist — matched',
  args: {
    ...sharedArgs,
    cellData: 'f27ec8db-af05-4f36-916e-3d57f91ecf5e',
  },
};

/**
 * Shows a dash when no MusicBrainz ID has been assigned yet.
 */
export const ArtistNoMatch: ArtistStory = {
  name: 'Artist — no match',
  args: {
    ...sharedArgs,
    cellData: null,
  },
};

// ── Release Cell ─────────────────────────────────────────────────────────────

export const ReleaseWithMatch: StoryObj<typeof MusicBrainzReleaseCell> = {
  name: 'Release — matched',
  render: (args) => <MusicBrainzReleaseCell {...args} />,
  args: {
    ...sharedArgs,
    collectionSlug: 'records',
    cellData: 'b84ee12a-09ef-421b-82de-0441a926375b',
  },
};

export const ReleaseNoMatch: StoryObj<typeof MusicBrainzReleaseCell> = {
  name: 'Release — no match',
  render: (args) => <MusicBrainzReleaseCell {...args} />,
  args: {
    ...sharedArgs,
    collectionSlug: 'records',
    cellData: null,
  },
};

// ── Recording Cell ───────────────────────────────────────────────────────────

export const RecordingWithMatch: StoryObj<typeof MusicBrainzRecordingCell> = {
  name: 'Recording — matched',
  render: (args) => <MusicBrainzRecordingCell {...args} />,
  args: {
    ...sharedArgs,
    collectionSlug: 'songs',
    cellData: '5465ca86-3881-4349-81b2-6efbd3a59451',
  },
};

export const RecordingNoMatch: StoryObj<typeof MusicBrainzRecordingCell> = {
  name: 'Recording — no match',
  render: (args) => <MusicBrainzRecordingCell {...args} />,
  args: {
    ...sharedArgs,
    collectionSlug: 'songs',
    cellData: null,
  },
};
