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
} from './utils';

export const EmbedBlock: Block = {
  slug: 'embed',
  labels: { singular: 'Embed', plural: 'Embeds' },
  fields: [
    {
      name: 'url',
      type: 'text',
      required: true,
      label: 'Embed URL',
      admin: {
        description: 'YouTube, Vimeo, Spotify, SoundCloud, or any iframe URL',
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
  ],
};

export const EmbedFeature = (): FeatureProviderServer<any> => BlocksFeature({
  blocks: [EmbedBlock],
});
