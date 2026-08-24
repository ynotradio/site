import { describe, it, expect, vi, beforeEach } from 'vitest';

import { uploadScreenshot } from './uploadScreenshot';

const configureEnv = (): void => {
  vi.stubEnv('CLOUDINARY_CLOUD_NAME', 'demo');
  vi.stubEnv('CLOUDINARY_API_KEY', 'key');
  vi.stubEnv('CLOUDINARY_API_SECRET', 'secret');
};

describe('uploadScreenshot', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns null for a null or non-image input', async () => {
    configureEnv();
    const uploader = { upload: vi.fn() } as never;
    expect(await uploadScreenshot(null, uploader)).toBeNull();
    expect(await uploadScreenshot('not-a-data-url', uploader)).toBeNull();
  });

  it('returns null when Cloudinary is not configured', async () => {
    const uploader = { upload: vi.fn() } as never;
    expect(await uploadScreenshot('data:image/png;base64,AAAA', uploader)).toBeNull();
  });

  it('uploads a data URL and returns the secure URL', async () => {
    configureEnv();
    const upload = vi.fn().mockResolvedValue({ secure_url: 'https://cdn/x.png' });
    const result = await uploadScreenshot('data:image/png;base64,AAAA', { upload } as never);
    expect(result).toBe('https://cdn/x.png');
    expect(upload).toHaveBeenCalledWith(
      'data:image/png;base64,AAAA',
      expect.objectContaining({ resource_type: 'image' }),
    );
  });

  it('returns null when the upload throws', async () => {
    configureEnv();
    const upload = vi.fn().mockRejectedValue(new Error('network'));
    expect(await uploadScreenshot('data:image/png;base64,AAAA', { upload } as never)).toBeNull();
  });
});
