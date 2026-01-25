/**
 * Unit tests for Import Gap Report script
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { GapReport } from './importGapReport';

// Mock modules before importing the module under test
vi.mock('../../config/databases', () => ({
  getMySQLConfig: vi.fn().mockReturnValue({
    host: 'localhost',
    database: 'test_db',
    user: 'test_user',
    password: 'test_pass',
  }),
  parseFromToArgs: vi.fn().mockReturnValue({
    from: 'local-mysql',
    to: 'prod-neon',
  }),
}));

vi.mock('./shared/payloadClient', () => ({
  getPayloadClient: vi.fn(),
}));

vi.mock('./shared/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

describe('importGapReport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset process.argv for parseArgs tests
    process.argv = ['node', 'script.ts'];
  });

  describe('parseArgs', () => {
    it('should return default options', async () => {
      const { parseArgs } = await import('./importGapReport');

      process.argv = ['node', 'script.ts'];
      const options = parseArgs();

      expect(options.from).toBe('local-mysql');
      expect(options.to).toBe('prod-neon');
      expect(options.limit).toBe(50);
      expect(options.verbose).toBe(false);
      expect(options.outputFile).toBeUndefined();
      expect(options.collection).toBeUndefined();
    });

    it('should parse --output argument', async () => {
      const { parseArgs } = await import('./importGapReport');

      process.argv = ['node', 'script.ts', '--output', 'report.md'];
      const options = parseArgs();

      expect(options.outputFile).toBe('report.md');
    });

    it('should parse -o short argument', async () => {
      const { parseArgs } = await import('./importGapReport');

      process.argv = ['node', 'script.ts', '-o', 'report.md'];
      const options = parseArgs();

      expect(options.outputFile).toBe('report.md');
    });

    it('should parse --collection argument', async () => {
      const { parseArgs } = await import('./importGapReport');

      process.argv = ['node', 'script.ts', '--collection', 'posts'];
      const options = parseArgs();

      expect(options.collection).toBe('posts');
    });

    it('should parse --limit argument', async () => {
      const { parseArgs } = await import('./importGapReport');

      process.argv = ['node', 'script.ts', '--limit', '100'];
      const options = parseArgs();

      expect(options.limit).toBe(100);
    });

    it('should parse --verbose argument', async () => {
      const { parseArgs } = await import('./importGapReport');

      process.argv = ['node', 'script.ts', '--verbose'];
      const options = parseArgs();

      expect(options.verbose).toBe(true);
    });

    it('should parse -v short argument', async () => {
      const { parseArgs } = await import('./importGapReport');

      process.argv = ['node', 'script.ts', '-v'];
      const options = parseArgs();

      expect(options.verbose).toBe(true);
    });
  });

  describe('generateMarkdownReport', () => {
    it('should generate markdown with summary', async () => {
      const { generateMarkdownReport } = await import('./importGapReport');

      const report: GapReport = {
        generatedAt: '2025-01-25T00:00:00.000Z',
        mysqlSource: 'local-mysql',
        payloadTarget: 'prod-neon',
        summary: {
          totalMysqlRecords: 1000,
          totalPayloadRecords: 900,
          totalMissing: 100,
          overallPercentage: 90.0,
        },
        collections: [
          {
            collection: 'Posts',
            mysqlTable: 'stories',
            mysqlCount: 500,
            payloadCount: 450,
            missingCount: 50,
            percentage: 90.0,
            missingRecords: [
              { id: 1, identifier: 'Test Post', reason: 'Not imported' },
              { id: 2, identifier: 'Another Post', reason: 'Not imported' },
            ],
          },
        ],
      };

      const markdown = generateMarkdownReport(report);

      expect(markdown).toContain('# Import Gap Report');
      expect(markdown).toContain('**Generated:** 2025-01-25T00:00:00.000Z');
      expect(markdown).toContain('**MySQL Source:** local-mysql');
      expect(markdown).toContain('**Payload Target:** prod-neon');
      expect(markdown).toContain('## Summary');
      expect(markdown).toContain('| Total MySQL Records | 1,000 |');
      expect(markdown).toContain('| Total Payload Records | 900 |');
      expect(markdown).toContain('| Total Missing | 100 |');
      expect(markdown).toContain('| Overall Import Rate | 90.0% |');
    });

    it('should include collection status table', async () => {
      const { generateMarkdownReport } = await import('./importGapReport');

      const report = {
        generatedAt: '2025-01-25T00:00:00.000Z',
        mysqlSource: 'local-mysql',
        payloadTarget: 'prod-neon',
        summary: {
          totalMysqlRecords: 100,
          totalPayloadRecords: 100,
          totalMissing: 0,
          overallPercentage: 100.0,
        },
        collections: [
          {
            collection: 'Songs',
            mysqlTable: 'music',
            mysqlCount: 100,
            payloadCount: 100,
            missingCount: 0,
            percentage: 100.0,
            missingRecords: [],
          },
        ],
      };

      const markdown = generateMarkdownReport(report);

      expect(markdown).toContain('## Collection Status');
      expect(markdown).toContain('| Collection | MySQL | Payload | Missing | Import Rate |');
      expect(markdown).toContain('✅ Songs');
      expect(markdown).toContain('100.0%');
    });

    it('should show warning emoji for collections with 90-99% import rate', async () => {
      const { generateMarkdownReport } = await import('./importGapReport');

      const report = {
        generatedAt: '2025-01-25T00:00:00.000Z',
        mysqlSource: 'local-mysql',
        payloadTarget: 'prod-neon',
        summary: {
          totalMysqlRecords: 100,
          totalPayloadRecords: 95,
          totalMissing: 5,
          overallPercentage: 95.0,
        },
        collections: [
          {
            collection: 'Concerts',
            mysqlTable: 'concerts',
            mysqlCount: 100,
            payloadCount: 95,
            missingCount: 5,
            percentage: 95.0,
            missingRecords: [],
          },
        ],
      };

      const markdown = generateMarkdownReport(report);

      expect(markdown).toContain('🟡 Concerts');
    });

    it('should show error emoji for collections under 90% import rate', async () => {
      const { generateMarkdownReport } = await import('./importGapReport');

      const report = {
        generatedAt: '2025-01-25T00:00:00.000Z',
        mysqlSource: 'local-mysql',
        payloadTarget: 'prod-neon',
        summary: {
          totalMysqlRecords: 100,
          totalPayloadRecords: 50,
          totalMissing: 50,
          overallPercentage: 50.0,
        },
        collections: [
          {
            collection: 'DJs',
            mysqlTable: 'deejays',
            mysqlCount: 100,
            payloadCount: 50,
            missingCount: 50,
            percentage: 50.0,
            missingRecords: [],
          },
        ],
      };

      const markdown = generateMarkdownReport(report);

      expect(markdown).toContain('🔴 DJs');
    });

    it('should include missing records table', async () => {
      const { generateMarkdownReport } = await import('./importGapReport');

      const report = {
        generatedAt: '2025-01-25T00:00:00.000Z',
        mysqlSource: 'local-mysql',
        payloadTarget: 'prod-neon',
        summary: {
          totalMysqlRecords: 10,
          totalPayloadRecords: 8,
          totalMissing: 2,
          overallPercentage: 80.0,
        },
        collections: [
          {
            collection: 'Posts',
            mysqlTable: 'stories',
            mysqlCount: 10,
            payloadCount: 8,
            missingCount: 2,
            percentage: 80.0,
            missingRecords: [
              { id: 123, identifier: 'Missing Post 1', reason: 'Not imported' },
              { id: 456, identifier: 'Missing Post 2', reason: 'Not imported' },
            ],
          },
        ],
      };

      const markdown = generateMarkdownReport(report);

      expect(markdown).toContain('## Missing: Posts');
      expect(markdown).toContain('| Legacy ID | Identifier | Reason |');
      expect(markdown).toContain('| 123 | Missing Post 1 | Not imported |');
      expect(markdown).toContain('| 456 | Missing Post 2 | Not imported |');
    });

    it('should escape pipe characters in identifiers', async () => {
      const { generateMarkdownReport } = await import('./importGapReport');

      const report = {
        generatedAt: '2025-01-25T00:00:00.000Z',
        mysqlSource: 'local-mysql',
        payloadTarget: 'prod-neon',
        summary: {
          totalMysqlRecords: 1,
          totalPayloadRecords: 0,
          totalMissing: 1,
          overallPercentage: 0.0,
        },
        collections: [
          {
            collection: 'Posts',
            mysqlTable: 'stories',
            mysqlCount: 1,
            payloadCount: 0,
            missingCount: 1,
            percentage: 0.0,
            missingRecords: [
              { id: 1, identifier: 'Title with | pipe character', reason: 'Not imported' },
            ],
          },
        ],
      };

      const markdown = generateMarkdownReport(report);

      // Pipe should be escaped
      expect(markdown).toContain('Title with \\| pipe character');
    });

    it('should include next steps section', async () => {
      const { generateMarkdownReport } = await import('./importGapReport');

      const report = {
        generatedAt: '2025-01-25T00:00:00.000Z',
        mysqlSource: 'local-mysql',
        payloadTarget: 'prod-neon',
        summary: {
          totalMysqlRecords: 0,
          totalPayloadRecords: 0,
          totalMissing: 0,
          overallPercentage: 100.0,
        },
        collections: [],
      };

      const markdown = generateMarkdownReport(report);

      expect(markdown).toContain('## Next Steps');
      expect(markdown).toContain('tsx bin/incremental-import.ts');
    });
  });
});
