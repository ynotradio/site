/**
 * Unit tests for importCustomTexts migration script
 *
 * Focuses on the donate page scenario described in GitHub issue:
 * "Donate page is blank in Postgres version" — the root cause was that
 * the 'donate' custom_text was not present in the Postgres posts table.
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
    };
  });

  describe('importCustomText', () => {
    it('should import donate custom_text with slug "donate"', async () => {
      const { importCustomText } = await import('./importCustomTexts');

      (mockPayload.find as Mock).mockResolvedValue({ totalDocs: 0, docs: [] });
      (mockPayload.create as Mock).mockResolvedValue({ id: 'post-donate' });

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
          collection: 'posts',
          data: expect.objectContaining({
            slug: 'donate',
            headline: 'Support Y-Not Radio',
            showOnFrontPage: false,
            startDate: '2000-01-01T00:00:00.000Z',
            endDate: '2099-12-31T23:59:59.999Z',
          }),
        }),
      );
    });

    it('should use permalink as slug for custom_text import', async () => {
      const { importCustomText } = await import('./importCustomTexts');

      (mockPayload.find as Mock).mockResolvedValue({ totalDocs: 0, docs: [] });
      (mockPayload.create as Mock).mockResolvedValue({ id: 'post-about' });

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

    it('should skip already imported custom_text', async () => {
      const { importCustomText } = await import('./importCustomTexts');

      (mockPayload.find as Mock).mockResolvedValue({
        totalDocs: 1,
        docs: [{ id: 'existing' }],
      });

      const customText: CustomText = {
        id: 5,
        title: 'Support Y-Not Radio',
        html: '<p>Already imported</p>',
        permalink: 'donate',
        status: 'active',
      };

      const result = await importCustomText(mockPayload as Payload, customText);

      expect(result).toBe('skipped');
      expect(mockPayload.create).not.toHaveBeenCalled();
    });

    it('should set showOnFrontPage to false for custom text pages', async () => {
      const { importCustomText } = await import('./importCustomTexts');

      (mockPayload.find as Mock).mockResolvedValue({ totalDocs: 0, docs: [] });
      (mockPayload.create as Mock).mockResolvedValue({ id: 'post-id' });

      const customText: CustomText = {
        id: 7,
        title: 'Contests',
        html: '<p>Enter our contests!</p>',
        permalink: 'contests',
        status: 'active',
      };

      await importCustomText(mockPayload as Payload, customText);

      expect(mockPayload.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ showOnFrontPage: false }),
        }),
      );
    });

    it('should apply legacyId offset of 10000 to avoid collision with story IDs', async () => {
      const { importCustomText } = await import('./importCustomTexts');

      (mockPayload.find as Mock).mockResolvedValue({ totalDocs: 0, docs: [] });
      (mockPayload.create as Mock).mockResolvedValue({ id: 'post-id' });

      const customText: CustomText = {
        id: 5,
        title: 'Support Y-Not Radio',
        html: '<p>Donate!</p>',
        permalink: 'donate',
        status: 'active',
      };

      await importCustomText(mockPayload as Payload, customText);

      // Verify the find call used legacyId = 5 + 10000 = 10005
      expect(mockPayload.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { legacyId: { equals: 10005 } },
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
