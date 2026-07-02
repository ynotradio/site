import type { Meta, StoryObj } from '@storybook/react';
import { EmbedComponent } from './client';

const meta = {
  title: 'Features/Embed/EmbedComponent',
  component: EmbedComponent,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof EmbedComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const YouTubeVideo: Story = {
  args: {
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    caption: 'Rick Astley - Never Gonna Give You Up',
  },
};

export const YouTubeShortURL: Story = {
  args: {
    url: 'https://youtu.be/dQw4w9WgXcQ',
    caption: 'YouTube short URL format',
  },
};

export const VimeoVideo: Story = {
  args: {
    url: 'https://vimeo.com/148751763',
    caption: 'Sample Vimeo video',
  },
};

export const SpotifyTrack: Story = {
  args: {
    url: 'https://open.spotify.com/track/3n3Ppam7vgaVa1iaRUc9Lp',
    caption: 'Spotify track embed',
  },
};

export const SpotifyAlbum: Story = {
  args: {
    url: 'https://open.spotify.com/album/1DFixLWuPkv3KT3TnV35m3',
    caption: 'Spotify album embed',
  },
};

export const SpotifyPlaylist: Story = {
  args: {
    url: 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M',
    caption: 'Spotify playlist embed',
  },
};

export const SoundCloudTrack: Story = {
  args: {
    url: 'https://soundcloud.com/example-artist/example-track',
    caption: 'SoundCloud track embed',
  },
};

export const MixcloudShow: Story = {
  args: {
    url: 'https://www.mixcloud.com/ynotradio/rodney-anonymous-tells-you-how-to-live-6526/',
    caption: 'Rodney Anonymous Tells You How To Live',
  },
};

export const OpenDrivePlayer: Story = {
  args: {
    url: 'https://www.opendrive.com/player/216190430_XqukK',
    caption: 'OpenDrive audio player',
  },
};

export const WithoutCaption: Story = {
  args: {
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  },
};

export const GenericEmbed: Story = {
  args: {
    url: 'https://example.com/embed/12345',
    caption: 'Generic iframe embed',
  },
};
