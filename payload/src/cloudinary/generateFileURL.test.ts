import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { CollectionConfig, ImageSize } from 'payload';
import { cloudinaryGenerateFileURL } from './generateFileURL';

// Minimal collection stub – generateFileURL doesn't inspect the collection object
const stubCollection = {} as CollectionConfig;

describe('cloudinaryGenerateFileURL', () => {
  beforeEach(() => {
    vi.stubEnv('CLOUDINARY_CLOUD_NAME', 'demo');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  // ── Original image (no size) ──────────────────────────────────────────────

  it('returns the base Cloudinary URL for the original image', () => {
    const url = cloudinaryGenerateFileURL({
      collection: stubCollection,
      filename: 'dev/uploads/1704251928-a3f9c2d1',
    });

    expect(url).toBe(
      'https://res.cloudinary.com/demo/image/upload/dev/uploads/1704251928-a3f9c2d1',
    );
  });

  // ── Sized variants ────────────────────────────────────────────────────────

  it('returns a Cloudinary transform URL for the thumbnail size', () => {
    const size: ImageSize = { name: 'thumbnail', width: 320, height: 240, position: 'center' };

    const url = cloudinaryGenerateFileURL({
      collection: stubCollection,
      filename: 'dev/uploads/1704251928-a3f9c2d1',
      size,
    });

    expect(url).toBe(
      'https://res.cloudinary.com/demo/image/upload/c_fill,w_320,h_240/dev/uploads/1704251928-a3f9c2d1',
    );
  });

  it('returns a Cloudinary transform URL for the card size', () => {
    const size: ImageSize = { name: 'card', width: 768, height: 576, position: 'center' };

    const url = cloudinaryGenerateFileURL({
      collection: stubCollection,
      filename: 'prod/uploads/img-abcd1234',
      size,
    });

    expect(url).toBe(
      'https://res.cloudinary.com/demo/image/upload/c_fill,w_768,h_576/prod/uploads/img-abcd1234',
    );
  });

  it('returns a Cloudinary transform URL for the hero size', () => {
    const size: ImageSize = { name: 'hero', width: 1600, height: 900, position: 'center' };

    const url = cloudinaryGenerateFileURL({
      collection: stubCollection,
      filename: 'prod/uploads/hero-img',
      size,
    });

    expect(url).toBe(
      'https://res.cloudinary.com/demo/image/upload/c_fill,w_1600,h_900/prod/uploads/hero-img',
    );
  });

  // ── Edge cases ────────────────────────────────────────────────────────────

  it('returns empty string when filename is undefined', () => {
    const url = cloudinaryGenerateFileURL({
      collection: stubCollection,
      filename: undefined as unknown as string,
    });

    expect(url).toBe('');
  });

  it('returns empty string when filename is undefined even with a size', () => {
    const size: ImageSize = { name: 'thumbnail', width: 320, height: 240, position: 'center' };

    const url = cloudinaryGenerateFileURL({
      collection: stubCollection,
      filename: undefined as unknown as string,
      size,
    });

    expect(url).toBe('');
  });

  it('handles a size with only width (no height)', () => {
    const size: ImageSize = { name: 'wide', width: 800 };

    const url = cloudinaryGenerateFileURL({
      collection: stubCollection,
      filename: 'dev/uploads/test',
      size,
    });

    expect(url).toBe(
      'https://res.cloudinary.com/demo/image/upload/c_fill,w_800/dev/uploads/test',
    );
  });

  it('handles a size with only height (no width)', () => {
    const size: ImageSize = { name: 'tall', height: 600 };

    const url = cloudinaryGenerateFileURL({
      collection: stubCollection,
      filename: 'dev/uploads/test',
      size,
    });

    expect(url).toBe(
      'https://res.cloudinary.com/demo/image/upload/c_fill,h_600/dev/uploads/test',
    );
  });
});
