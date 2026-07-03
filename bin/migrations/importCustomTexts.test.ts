/**
 * Unit tests for importCustomTexts migration script
 *
 * Covers the import of custom_texts from MySQL into the dedicated `pages`
 * Payload collection (distinct from `posts` / stories).
 */

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import type { Payload } from 'payload';
import type { CustomText } from './database';

// Mock modules
vi.mock('./database', () => ({
  connectToDatabase: vi.fn(),
}));

vi.mock('./shared/payloadClient', () => ({
  getPayloadClient: vi.fn(),
}));

vi.mock('./shared/enhancedHtmlToLexical', () => ({
  convertHtmlToLexicalEnhanced: vi.fn((html: string) => ({
    root: {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [{ type: 'text', text: html, format: 0 }],
        },
      ],
    },
  })),
}));

vi.mock('./shared/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
  logProgress: vi.fn(),
  logSummary: vi.fn(),
}));

describe('importCustomTexts', () => {
  let mockPayload: Partial<Payload>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockPayload = {
      find: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    };
  });

  describe('importCustomText', () => {
    it('should import donate custom_text into the pages collection with slug "donate"', async () => {
      const { importCustomText } = await import('./importCustomTexts');

      (mockPayload.find as Mock).mockResolvedValue({ totalDocs: 0, docs: [] });
      (mockPayload.create as Mock).mockResolvedValue({ id: 'page-donate' });

      const donateCustomText: CustomText = {
        id: 5,
        title: 'Support Y-Not Radio',
        html: '<p>Donate to keep the music going!</p>',
        permalink: 'donate',
        status: 'active',
      };

      const result = await importCustomText(mockPayload as Payload, donateCustomText);

      expect(result).toBe('success');
      expect(mockPayload.create).toHaveBeenCalledWith(
        expect.objectContaining({
          collection: 'pages',
          data: expect.objectContaining({
            slug: 'donate',
            title: 'Support Y-Not Radio',
            _status: 'published',
          }),
        }),
      );
    });

    it('should use permalink as slug for custom_text import', async () => {
      const { importCustomText } = await import('./importCustomTexts');

      (mockPayload.find as Mock).mockResolvedValue({ totalDocs: 0, docs: [] });
      (mockPayload.create as Mock).mockResolvedValue({ id: 'page-about' });

      const aboutCustomText: CustomText = {
        id: 10,
        title: 'About Us',
        html: '<p>About Y-Not Radio</p>',
        permalink: 'about-us',
        status: 'active',
      };

      await importCustomText(mockPayload as Payload, aboutCustomText);

      expect(mockPayload.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ slug: 'about-us' }),
        }),
      );
    });

    it('should update (not recreate) an already-imported custom_text', async () => {
      const { importCustomText } = await import('./importCustomTexts');

      (mockPayload.find as Mock).mockResolvedValue({
        totalDocs: 1,
        docs: [{ id: 'existing' }],
      });
      (mockPayload.update as Mock).mockResolvedValue({ id: 'existing' });

      const customText: CustomText = {
        id: 5,
        title: 'Support Y-Not Radio',
        html: '<p>Already imported</p>',
        permalink: 'donate',
        status: 'active',
      };

      const result = await importCustomText(mockPayload as Payload, customText);

      // Upsert: existing docs are refreshed in place, not skipped or duplicated.
      expect(result).toBe('success');
      expect(mockPayload.update).toHaveBeenCalledWith(
        expect.objectContaining({ collection: 'pages', id: 'existing' }),
      );
      expect(mockPayload.create).not.toHaveBeenCalled();
    });

    it('should not include Posts-specific fields (startDate, endDate, showOnFrontPage)', async () => {
      const { importCustomText } = await import('./importCustomTexts');

      (mockPayload.find as Mock).mockResolvedValue({ totalDocs: 0, docs: [] });
      (mockPayload.create as Mock).mockResolvedValue({ id: 'page-id' });

      const customText: CustomText = {
        id: 7,
        title: 'Contests',
        html: '<p>Enter our contests!</p>',
        permalink: 'contests',
        status: 'active',
      };

      await importCustomText(mockPayload as Payload, customText);

      const callData = (mockPayload.create as Mock).mock.calls[0][0].data;
      expect(callData).not.toHaveProperty('showOnFrontPage');
      expect(callData).not.toHaveProperty('startDate');
      expect(callData).not.toHaveProperty('endDate');
      expect(callData).not.toHaveProperty('priority');
    });

    it('should use the raw MySQL id as legacyId (no offset needed in pages collection)', async () => {
      const { importCustomText } = await import('./importCustomTexts');

      (mockPayload.find as Mock).mockResolvedValue({ totalDocs: 0, docs: [] });
      (mockPayload.create as Mock).mockResolvedValue({ id: 'page-id' });

      const customText: CustomText = {
        id: 5,
        title: 'Support Y-Not Radio',
        html: '<p>Donate!</p>',
        permalink: 'donate',
        status: 'active',
      };

      await importCustomText(mockPayload as Payload, customText);

      // Find uses the raw MySQL id (no +10000 offset; pages has no story ID collisions)
      expect(mockPayload.find).toHaveBeenCalledWith(
        expect.objectContaining({
          collection: 'pages',
          where: { legacyId: { equals: 5 } },
        }),
      );
    });

    it('should return error when payload.create throws', async () => {
      const { importCustomText } = await import('./importCustomTexts');

      (mockPayload.find as Mock).mockResolvedValue({ totalDocs: 0, docs: [] });
      (mockPayload.create as Mock).mockRejectedValue(new Error('Database error'));

      const customText: CustomText = {
        id: 5,
        title: 'Support Y-Not Radio',
        html: '<p>Donate!</p>',
        permalink: 'donate',
        status: 'active',
      };

      const result = await importCustomText(mockPayload as Payload, customText);

      expect(result).toBe('error');
    });
  });
});

