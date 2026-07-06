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
    {
      name: 'layoutOverride',
      type: 'select',
      label: 'Layout override',
      options: [
        { label: 'Auto (detect from URL)', value: '' },
        { label: 'Video (responsive 16:9)', value: 'video' },
        { label: 'Audio / fixed height', value: 'audio' },
      ],
      defaultValue: '',
      admin: {
        description:
          'Most providers pick the right layout automatically. Override for things like a Google '
          + 'Form or Sheet, which need a taller fixed-height box rather than the audio-player default.',
      },
    },
    {
      name: 'heightOverride',
      type: 'number',
      label: 'Height override (px)',
      admin: {
        description:
          'Only applies to the "Audio / fixed height" layout — overrides the default height.',
        condition: (_, siblingData) => siblingData?.layoutOverride === 'audio',
      },
    },
  ],
};

export const EmbedFeature = (): FeatureProviderServer<any> => BlocksFeature({
  blocks: [EmbedBlock],
});
