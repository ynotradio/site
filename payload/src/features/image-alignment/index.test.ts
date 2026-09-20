import { describe, it, expect, vi } from 'vitest';
import { ImageAlignmentUploadFeature, IMAGE_ALIGNMENT_OPTIONS, IMAGE_SIZE_OPTIONS } from './index';

vi.mock('@payloadcms/richtext-lexical', () => ({
  UploadFeature: vi.fn((config) => ({ _type: 'upload', ...config })),
}));

describe('ImageAlignmentUploadFeature', () => {
  it('configures alignment, size, and linkUrl fields on the media collection', () => {
    const feature = ImageAlignmentUploadFeature() as any;

    const mediaFields = feature.collections.media.fields;
    expect(mediaFields).toHaveLength(3);
    expect(mediaFields[0]).toMatchObject({
      name: 'alignment',
      type: 'select',
      defaultValue: 'full',
    });
    expect(mediaFields[1]).toMatchObject({
      name: 'size',
      type: 'select',
      defaultValue: 'natural',
    });
    expect(mediaFields[2]).toMatchObject({
      name: 'linkUrl',
      type: 'text',
    });
  });

  it('offers left, right, center, and full-width options', () => {
    const values = IMAGE_ALIGNMENT_OPTIONS.map((o) => o.value);
    expect(values).toEqual(['full', 'left', 'right', 'center']);
  });

  it('offers natural, small, and medium size presets', () => {
    const values = IMAGE_SIZE_OPTIONS.map((o) => o.value);
    expect(values).toEqual(['natural', 'sm', 'md']);
  });
});
