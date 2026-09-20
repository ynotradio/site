import { UploadFeature } from '@payloadcms/richtext-lexical';
import type { FeatureProviderProviderServer } from '@payloadcms/richtext-lexical';

/**
 * Legacy custom-text pages float inline images beside text via
 * `<img align="left|right">` (donate, future-friday, y100-rocks, etc).
 * Payload's default UploadFeature has no alignment field, so it's configured
 * here with one and rendered in both PHP (ConvertsLexicalToHtml's
 * `lexical-image--{alignment}` class) and any React frontend that reads the
 * same `fields.alignment` value.
 */
export const IMAGE_ALIGNMENT_OPTIONS = [
  { label: 'Full width', value: 'full' },
  { label: 'Float left', value: 'left' },
  { label: 'Float right', value: 'right' },
  { label: 'Centered', value: 'center' },
] as const;

/** Preset rendered widths for inline images, as `lexical-image--{value}` classes. */
export const IMAGE_SIZE_OPTIONS = [
  { label: 'Natural', value: 'natural' },
  { label: 'Small (100px)', value: 'sm' },
  { label: 'Medium (300px)', value: 'md' },
] as const;

type ImageAlignmentFeature = FeatureProviderProviderServer<any, any, any>;

export const ImageAlignmentUploadFeature = (): ImageAlignmentFeature => UploadFeature({
  collections: {
    media: {
      fields: [
        {
          name: 'alignment',
          type: 'select',
          label: 'Image alignment',
          defaultValue: 'full',
          options: [...IMAGE_ALIGNMENT_OPTIONS],
        },
        {
          name: 'size',
          type: 'select',
          label: 'Image size',
          defaultValue: 'natural',
          options: [...IMAGE_SIZE_OPTIONS],
        },
      ],
    },
  },
});
