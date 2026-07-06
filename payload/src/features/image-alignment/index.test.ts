import { describe, it, expect, vi } from 'vitest';
import { ImageAlignmentUploadFeature, IMAGE_ALIGNMENT_OPTIONS } from './index';

vi.mock('@payloadcms/richtext-lexical', () => ({
  UploadFeature: vi.fn((config) => ({ _type: 'upload', ...config })),
}));

describe('ImageAlignmentUploadFeature', () => {
  it('configures an alignment select field on the media collection', () => {
    const feature = ImageAlignmentUploadFeature() as any;

    const mediaFields = feature.collections.media.fields;
    expect(mediaFields).toHaveLength(1);
    expect(mediaFields[0]).toMatchObject({
      name: 'alignment',
      type: 'select',
      defaultValue: 'full',
    });
  });

  it('offers left, right, center, and full-width options', () => {
    const values = IMAGE_ALIGNMENT_OPTIONS.map((o) => o.value);
    expect(values).toEqual(['full', 'left', 'right', 'center']);
  });
});
