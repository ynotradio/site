import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('cloudinary', () => ({
  v2: {
    config: vi.fn(),
    uploader: {
      upload_stream: vi.fn(),
      destroy: vi.fn(),
    },
    url: vi.fn(),
  },
}));

const { v2: cloudinaryMock } = await import('cloudinary');

describe('cloudinaryAdapter', () => {
  let adapterFactory: typeof import('./adapter').cloudinaryAdapter;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Re-import to get fresh module state
    const mod = await import('./adapter');
    adapterFactory = mod.cloudinaryAdapter;
  });

  describe('adapter factory', () => {
    it('returns an adapter with the expected interface', () => {
      const adapter = adapterFactory({ prefix: 'test-prefix' } as any);

      expect(adapter.name).toBe('cloudinary');
      expect(typeof adapter.handleUpload).toBe('function');
      expect(typeof adapter.handleDelete).toBe('function');
      expect(typeof adapter.staticHandler).toBe('function');
    });
  });

  describe('handleUpload', () => {
    it('returns empty object when cloudinaryPublicId is already set (sized variant skip)', async () => {
      const adapter = adapterFactory({} as any);

      const result = await adapter.handleUpload({
        data: { cloudinaryPublicId: 'existing/public-id' } as any,
        file: { buffer: Buffer.from('test') } as any,
        collection: {} as any,
        req: {} as any,
      });

      expect(result).toEqual({});
      expect(cloudinaryMock.uploader.upload_stream).not.toHaveBeenCalled();
    });

    it('uploads file and returns public_id when no cloudinaryPublicId is set', async () => {
      vi.mocked(cloudinaryMock.uploader.upload_stream).mockImplementation(
        (_options: any, callback: any) => ({
          end: () => callback(null, { public_id: 'dev/uploads/1234-abcd' }),
        }),
      );

      const adapter = adapterFactory({} as any);
      const data: any = {};

      const result = await adapter.handleUpload({
        data,
        file: { buffer: Buffer.from('image data') } as any,
        collection: {} as any,
        req: {} as any,
      });

      expect(result).toEqual({
        filename: 'dev/uploads/1234-abcd',
        cloudinaryPublicId: 'dev/uploads/1234-abcd',
      });
      expect(data.cloudinaryPublicId).toBe('dev/uploads/1234-abcd');
      expect(data.filename).toBe('dev/uploads/1234-abcd');
    });

    it('propagates the public_id to all sized variants', async () => {
      vi.mocked(cloudinaryMock.uploader.upload_stream).mockImplementation(
        (_options: any, callback: any) => ({
          end: () => callback(null, { public_id: 'dev/uploads/1234-abcd' }),
        }),
      );

      const adapter = adapterFactory({} as any);
      const thumbnail: any = { filename: 'old-thumb' };
      const card: any = { filename: 'old-card' };
      const data: any = { sizes: { thumbnail, card } };

      await adapter.handleUpload({
        data,
        file: { buffer: Buffer.from('image') } as any,
        collection: {} as any,
        req: {} as any,
      });

      expect(thumbnail.filename).toBe('dev/uploads/1234-abcd');
      expect(card.filename).toBe('dev/uploads/1234-abcd');
    });

    it('skips null size entries in sizes object', async () => {
      vi.mocked(cloudinaryMock.uploader.upload_stream).mockImplementation(
        (_options: any, callback: any) => ({
          end: () => callback(null, { public_id: 'dev/uploads/1234-abcd' }),
        }),
      );

      const adapter = adapterFactory({} as any);
      const card: any = { filename: 'old-card' };
      const data: any = { sizes: { thumbnail: null, card } };

      await adapter.handleUpload({
        data,
        file: { buffer: Buffer.from('image') } as any,
        collection: {} as any,
        req: {} as any,
      });

      expect(card.filename).toBe('dev/uploads/1234-abcd');
    });

    it('uses prod/uploads folder when NODE_ENV is production', async () => {
      const originalEnv = process.env.NODE_ENV;
      vi.resetModules();
      process.env.NODE_ENV = 'production';

      try {
        const { cloudinaryAdapter: prodAdapter } = await import('./adapter');
        vi.mocked(cloudinaryMock.uploader.upload_stream).mockImplementation(
          (_options: any, callback: any) => ({
            end: () => callback(null, { public_id: 'prod/uploads/1234-abcd' }),
          }),
        );

        const adapter = prodAdapter({} as any);
        const data: any = {};

        await adapter.handleUpload({
          data,
          file: { buffer: Buffer.from('image') } as any,
          collection: {} as any,
          req: {} as any,
        });

        expect(cloudinaryMock.uploader.upload_stream).toHaveBeenCalledWith(
          expect.objectContaining({ folder: 'prod/uploads' }),
          expect.any(Function),
        );
      } finally {
        process.env.NODE_ENV = originalEnv;
        vi.resetModules();
      }
    });

    it('rejects when cloudinary upload returns an error', async () => {
      const uploadError = new Error('Cloudinary upload failed');
      vi.mocked(cloudinaryMock.uploader.upload_stream).mockImplementation(
        (_options: any, callback: any) => ({
          end: () => callback(uploadError, undefined),
        }),
      );

      const adapter = adapterFactory({} as any);

      await expect(
        adapter.handleUpload({
          data: {} as any,
          file: { buffer: Buffer.from('image') } as any,
          collection: {} as any,
          req: {} as any,
        }),
      ).rejects.toThrow('Cloudinary upload failed');
    });

    it('rejects when cloudinary returns neither error nor result', async () => {
      vi.mocked(cloudinaryMock.uploader.upload_stream).mockImplementation(
        (_options: any, callback: any) => ({
          end: () => callback(undefined, undefined),
        }),
      );

      const adapter = adapterFactory({} as any);

      await expect(
        adapter.handleUpload({
          data: {} as any,
          file: { buffer: Buffer.from('image') } as any,
          collection: {} as any,
          req: {} as any,
        }),
      ).rejects.toThrow('Upload failed without error');
    });
  });

  describe('handleDelete', () => {
    it('deletes using cloudinaryPublicId when available', async () => {
      vi.mocked(cloudinaryMock.uploader.destroy).mockResolvedValue({ result: 'ok' } as any);

      const adapter = adapterFactory({} as any);

      await adapter.handleDelete({
        doc: { cloudinaryPublicId: 'prod/uploads/1234-abcd' } as any,
        filename: 'fallback-filename',
        collection: {} as any,
        req: {} as any,
      });

      expect(cloudinaryMock.uploader.destroy).toHaveBeenCalledWith('prod/uploads/1234-abcd');
    });

    it('falls back to filename when cloudinaryPublicId is not set', async () => {
      vi.mocked(cloudinaryMock.uploader.destroy).mockResolvedValue({ result: 'ok' } as any);

      const adapter = adapterFactory({} as any);

      await adapter.handleDelete({
        doc: {} as any,
        filename: 'dev/uploads/fallback-file',
        collection: {} as any,
        req: {} as any,
      });

      expect(cloudinaryMock.uploader.destroy).toHaveBeenCalledWith('dev/uploads/fallback-file');
    });

    it('does not throw when cloudinary destroy fails', async () => {
      vi.mocked(cloudinaryMock.uploader.destroy).mockRejectedValue(new Error('Not found'));

      const adapter = adapterFactory({} as any);

      await expect(
        adapter.handleDelete({
          doc: {} as any,
          filename: 'test-file',
          collection: {} as any,
          req: {} as any,
        }),
      ).resolves.toBeUndefined();
    });
  });

  describe('staticHandler', () => {
    it('returns a redirect to the Cloudinary URL', async () => {
      vi.mocked(cloudinaryMock.url).mockReturnValue('https://res.cloudinary.com/demo/image/upload/test/file');

      const adapter = adapterFactory({} as any);

      const response = await adapter.staticHandler({} as any, {
        params: { filename: 'test/file', collection: 'media' },
      } as any);

      expect(response.status).toBe(302);
      expect(response.headers.get('location')).toBe(
        'https://res.cloudinary.com/demo/image/upload/test/file',
      );
    });

    it('prepends the collection prefix to simple filenames (no slash)', async () => {
      vi.mocked(cloudinaryMock.url).mockReturnValue('https://res.cloudinary.com/demo/image/upload/dev/uploads/simple-file');

      const adapter = adapterFactory({} as any);

      await adapter.staticHandler({} as any, {
        params: { filename: 'simple-file', collection: 'media' },
      } as any);

      // The publicId passed to cloudinary.url should include the prefix
      expect(cloudinaryMock.url).toHaveBeenCalledWith(
        expect.stringContaining('simple-file'),
        expect.any(Object),
      );
    });

    it('uses the filename as-is when it contains a slash', async () => {
      vi.mocked(cloudinaryMock.url).mockReturnValue('https://res.cloudinary.com/demo/image/upload/custom/path/file');

      const adapter = adapterFactory({} as any);

      await adapter.staticHandler({} as any, {
        params: { filename: 'custom/path/file', collection: 'media' },
      } as any);

      expect(cloudinaryMock.url).toHaveBeenCalledWith('custom/path/file', expect.any(Object));
    });
  });
});
