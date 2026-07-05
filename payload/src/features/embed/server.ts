import type { FeatureProviderServer } from '@payloadcms/richtext-lexical';
import type { Block } from 'payload';
import { BlocksFeature } from '@payloadcms/richtext-lexical';

export type { EmbedType, EmbedInfo } from './utils';
export {
  detectEmbedType,
  extractYouTubeId,
  extractVimeoId,
  extractSpotifyInfo,
  extractSoundCloudInfo,
  extractMixcloudFeed,
} from './utils';

export const EmbedBlock: Block = {
  slug: 'embed',
  labels: { singular: 'Embed', plural: 'Embeds' },
  admin: { disableBlockName: true },
  fields: [
    {
      name: 'url',
      type: 'text',
      required: true,
      label: 'Embed URL',
      admin: {
        description:
          'Paste a URL: YouTube, Vimeo, Mixcloud, OpenDrive, Spotify, SoundCloud, or any iframe URL',
      },
    },
    {
      name: 'caption',
      type: 'text',
      label: 'Caption',
      admin: {
        description: 'Optional caption displayed below the embed',
      },
    },
    {
      name: 'hideCoverImage',
      type: 'checkbox',
      label: 'Hide cover image',
      defaultValue: true,
      admin: {
        description: 'Mixcloud only: hides the show cover art in the player. Uncheck to show it.',
        condition: (_data, siblingData) => typeof siblingData?.url === 'string' && siblingData.url.includes('mixcloud.com'),
      },
    },
  ],
};

export const EmbedFeature = (): FeatureProviderServer<any> => BlocksFeature({
  blocks: [EmbedBlock],
});
