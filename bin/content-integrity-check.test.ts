import { describe, it, expect, vi } from 'vitest';
import {
  parseArgs,
  emptyReport,
  addResult,
  printCheckReport,
  generateMarkdownReport,
  type CheckResult,
  type IntegrityReport,
} from './content-integrity-utils';

describe('content-integrity-utils', () => {
  describe('parseArgs', () => {
    it('should return defaults with no arguments', () => {
      expect(parseArgs(['node', 'script'])).toEqual({
        checks: 'all',
        fix: false,
        limit: 0,
        output: '',
        verbose: false,
      });
    });

    it('should parse --fix flag', () => {
      expect(parseArgs(['node', 'script', '--fix']).fix).toBe(true);
    });

    it('should parse --verbose flag', () => {
      expect(parseArgs(['node', 'script', '--verbose']).verbose).toBe(true);
    });

    it('should parse a single --check', () => {
      expect(parseArgs(['node', 'script', '--check', 'slugs']).checks).toEqual(['slugs']);
    });

    it('should parse multiple --check flags', () => {
      const result = parseArgs(['node', 'script', '--check', 'display-names', '--check', 'slugs']);
      expect(result.checks).toEqual(['display-names', 'slugs']);
    });

    it('should parse --check all', () => {
      expect(parseArgs(['node', 'script', '--check', 'all']).checks).toBe('all');
    });

    it('should treat --check all after named checks as resetting to all', () => {
      const result = parseArgs(['node', 'script', '--check', 'slugs', '--check', 'all']);
      expect(result.checks).toBe('all');
    });

    it('should parse --limit with a valid number', () => {
      expect(parseArgs(['node', 'script', '--limit', '25']).limit).toBe(25);
    });

    it('should parse --output', () => {
      expect(parseArgs(['node', 'script', '--output', 'report.md']).output).toBe('report.md');
    });

    it('should parse combined flags', () => {
      const result = parseArgs([
        'node',
        'script',
        '--check',
        'musicbrainz',
        '--check',
        'record-metadata',
        '--fix',
        '--verbose',
        '--limit',
        '10',
        '--output',
        '/tmp/r.md',
      ]);
      expect(result).toEqual({
        checks: ['musicbrainz', 'record-metadata'],
        fix: true,
        limit: 10,
        output: '/tmp/r.md',
        verbose: true,
      });
    });

    it('should throw for invalid check name', () => {
      expect(() => parseArgs(['node', 'script', '--check', 'invalid'])).toThrow('Invalid check');
    });

    it('should throw for invalid limit values', () => {
      expect(() => parseArgs(['node', 'script', '--limit', 'abc'])).toThrow('Invalid limit');
      expect(() => parseArgs(['node', 'script', '--limit', '0'])).toThrow('Invalid limit');
      expect(() => parseArgs(['node', 'script', '--limit', '-5'])).toThrow('Invalid limit');
    });

    it('should throw for --output without a path', () => {
      expect(() => parseArgs(['node', 'script', '--output'])).toThrow('--output requires');
    });

    it('should throw for unknown arguments', () => {
      expect(() => parseArgs(['node', 'script', '--unknown'])).toThrow('Unknown argument');
    });

    it('should skip --from and its value without throwing', () => {
      const result = parseArgs(['node', 'script', '--from', 'prod-mysql', '--fix']);
      expect(result.fix).toBe(true);
    });

    it('should exit on --help', () => {
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      parseArgs(['node', 'script', '--help']);
      expect(exitSpy).toHaveBeenCalledWith(0);
      expect(logSpy).toHaveBeenCalled();
      exitSpy.mockRestore();
      logSpy.mockRestore();
    });
  });

  describe('emptyReport', () => {
    it('should return a zeroed report with the given check and label', () => {
      const report = emptyReport('slugs', 'Slug Validation');
      expect(report).toEqual({
        check: 'slugs',
        label: 'Slug Validation',
        total: 0,
        ok: 0,
        missing: 0,
        mismatch: 0,
        fixed: 0,
        fixFailed: 0,
        skipped: 0,
        results: [],
        durationMs: 0,
      });
    });

    it('should return independent objects on each call', () => {
      const a = emptyReport('slugs', 'A');
      const b = emptyReport('slugs', 'B');
      a.total = 5;
      expect(b.total).toBe(0);
    });
  });

  describe('addResult', () => {
    const makeResult = (status: CheckResult['status']): CheckResult => ({
      id: '1',
      collection: 'artists',
      identifier: 'Test Artist',
      field: 'displayName',
      status,
    });

    it.each([
      ['ok', 'ok'],
      ['missing', 'missing'],
      ['mismatch', 'mismatch'],
      ['fixed', 'fixed'],
      ['fix-failed', 'fixFailed'],
      ['skipped', 'skipped'],
    ] as const)('should increment %s counter', (status, key) => {
      const report = emptyReport('display-names', 'Display Names');
      addResult(report, makeResult(status as CheckResult['status']));
      expect(report.total).toBe(1);
      expect(report[key as keyof typeof report]).toBe(1);
    });

    it('should push the result to the results array', () => {
      const report = emptyReport('display-names', 'Display Names');
      const result = makeResult('ok');
      addResult(report, result);
      expect(report.results).toHaveLength(1);
      expect(report.results[0]).toBe(result);
    });

    it('should accumulate multiple results correctly', () => {
      const report = emptyReport('display-names', 'Display Names');
      addResult(report, makeResult('ok'));
      addResult(report, makeResult('ok'));
      addResult(report, makeResult('missing'));
      addResult(report, makeResult('fixed'));
      expect(report.total).toBe(4);
      expect(report.ok).toBe(2);
      expect(report.missing).toBe(1);
      expect(report.fixed).toBe(1);
    });
  });

  describe('printCheckReport', () => {
    it('should not throw for an empty report', () => {
      expect(() => printCheckReport(emptyReport('slugs', 'Slug Validation'))).not.toThrow();
    });

    it('should not throw for a report with issues', () => {
      const report = emptyReport('display-names', 'Display Names');
      addResult(report, {
        id: '1',
        collection: 'artists',
        identifier: 'Radiohead',
        field: 'displayName',
        status: 'missing',
        detail: 'No display name set',
      });
      addResult(report, {
        id: '2',
        collection: 'artists',
        identifier: 'Björk',
        field: 'displayName',
        status: 'mismatch',
        currentValue: 'Bjork',
        expectedValue: 'Björk',
      });
      expect(() => printCheckReport(report)).not.toThrow();
    });

    it('should log summary lines', () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const report = emptyReport('slugs', 'Slug Validation');
      addResult(report, {
        id: '1',
        collection: 'records',
        identifier: 'OK Computer',
        field: 'slug',
        status: 'ok',
      });
      printCheckReport(report);
      const output = logSpy.mock.calls.map((c) => c[0]).join('\n');
      expect(output).toContain('Slug Validation');
      expect(output).toContain('Total:');
      expect(output).toContain('OK:');
      logSpy.mockRestore();
    });
  });

  describe('generateMarkdownReport', () => {
    const buildReport = (): IntegrityReport => {
      const check1 = emptyReport('display-names', 'Display Names');
      addResult(check1, {
        id: '1',
        collection: 'artists',
        identifier: 'Radiohead',
        field: 'displayName',
        status: 'ok',
      });
      addResult(check1, {
        id: '2',
        collection: 'artists',
        identifier: 'Björk',
        field: 'displayName',
        status: 'mismatch',
        currentValue: 'Bjork',
        expectedValue: 'Björk',
      });
      check1.durationMs = 42;
      const check2 = emptyReport('slugs', 'Slugs');
      check2.durationMs = 10;
      return { checks: [check1, check2], generatedAt: '2025-01-15T12:00:00.000Z', mode: 'check' };
    };

    it('should contain heading, mode, and timestamp', () => {
      const md = generateMarkdownReport(buildReport());
      expect(md).toContain('# Content Integrity Report');
      expect(md).toContain('**Mode:** check');
      expect(md).toContain('**Generated:** 2025-01-15T12:00:00.000Z');
    });

    it('should contain the summary table with rows for each check', () => {
      const md = generateMarkdownReport(buildReport());
      expect(md).toContain('| Check | Total | OK | Missing | Mismatch | Fixed | Failed |');
      expect(md).toContain('| Display Names |');
      expect(md).toContain('| Slugs |');
    });

    it('should contain detail section headers', () => {
      const md = generateMarkdownReport(buildReport());
      expect(md).toContain('## Display Names');
      expect(md).toContain('## Slugs');
    });

    it('should show "No issues found." for clean checks', () => {
      const md = generateMarkdownReport(buildReport());
      const slugsSection = md.split('## Slugs')[1];
      expect(slugsSection).toContain('No issues found.');
    });

    it('should show issue details for checks with problems', () => {
      const md = generateMarkdownReport(buildReport());
      expect(md).toContain('Björk');
      expect(md).toContain('mismatch');
    });

    it('should handle an empty checks array', () => {
      const md = generateMarkdownReport({
        checks: [],
        generatedAt: '2025-01-01T00:00:00.000Z',
        mode: 'fix',
      });
      expect(md).toContain('# Content Integrity Report');
      expect(md).toContain('**Mode:** fix');
    });
  });
});
