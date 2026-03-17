/* eslint-disable no-console */
/**
 * Shared types and utilities for content integrity check scripts.
 *
 * Separated from the per-check scripts so tests can import without pulling in
 * Payload CMS / @payload-config dependencies.
 */

import fs from 'node:fs';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CheckName = 'display-names' | 'slugs' | 'musicbrainz' | 'record-metadata' | 'ondemand-source' | 'publish-status';

export interface CliOptions {
  checks: CheckName[] | 'all';
  fix: boolean;
  limit: number;
  output: string;
  verbose: boolean;
}

export interface CheckResult {
  id: string | number;
  collection: string;
  identifier: string;
  field: string;
  status: 'ok' | 'missing' | 'mismatch' | 'fixed' | 'fix-failed' | 'skipped';
  currentValue?: string;
  expectedValue?: string;
  detail?: string;
}

export interface CheckReport {
  check: CheckName;
  label: string;
  total: number;
  ok: number;
  missing: number;
  mismatch: number;
  fixed: number;
  fixFailed: number;
  skipped: number;
  results: CheckResult[];
  durationMs: number;
}

export interface IntegrityReport {
  checks: CheckReport[];
  generatedAt: string;
  mode: 'check' | 'fix';
}

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

const VALID_CHECKS: CheckName[] = ['display-names', 'slugs', 'musicbrainz', 'record-metadata', 'ondemand-source', 'publish-status'];

export function parseArgs(argv: string[]): CliOptions {
  const args = argv.slice(2);
  const options: CliOptions = {
    checks: 'all',
    fix: false,
    limit: 0,
    output: '',
    verbose: false,
  };

  const checks: CheckName[] = [];

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--check':
        i++;
        if (!args[i] || (!VALID_CHECKS.includes(args[i] as CheckName) && args[i] !== 'all')) {
          throw new Error(
            `Invalid check "${args[i]}". Must be one of: ${VALID_CHECKS.join(', ')}, all`,
          );
        }
        if (args[i] === 'all') {
          // Reset to 'all' — any previously collected checks are discarded
          checks.length = 0;
        } else {
          checks.push(args[i] as CheckName);
        }
        break;
      case '--fix':
        options.fix = true;
        break;
      case '--limit':
        i++;
        options.limit = parseInt(args[i], 10);
        if (Number.isNaN(options.limit) || options.limit < 1) {
          throw new Error(`Invalid limit "${args[i]}". Must be a positive number`);
        }
        break;
      case '--output':
        i++;
        if (!args[i]) {
          throw new Error('--output requires a file path');
        }
        options.output = args[i];
        break;
      case '--verbose':
        options.verbose = true;
        break;
      case '--help':
        console.log(`
Content Integrity Check — verify and fix content data issues

Options:
  --check <name>  Which check to run (repeatable). Values:
                  ${VALID_CHECKS.join(', ')}, all  [default: all]
  --fix           Apply fixes (default is dry-run / check-only)
  --limit <N>     Process at most N records per collection
  --output <file> Write markdown report to file
  --verbose       Show detailed logging
  --help          Show this help message
`);
        process.exit(0);
        break;
      default:
        // Allow --from <value> (used by MySQL-backed scripts), skip it
        if (args[i] === '--from') {
          i++; // skip the value too
          break;
        }
        throw new Error(`Unknown argument: ${args[i]}. Use --help for usage.`);
    }
  }

  if (checks.length > 0) {
    options.checks = checks;
  }

  return options;
}

// ---------------------------------------------------------------------------
// Report helpers
// ---------------------------------------------------------------------------

export function emptyReport(check: CheckName, label: string): CheckReport {
  return {
    check,
    label,
    total: 0,
    ok: 0,
    missing: 0,
    mismatch: 0,
    fixed: 0,
    fixFailed: 0,
    skipped: 0,
    results: [],
    durationMs: 0,
  };
}

export function addResult(report: CheckReport, result: CheckResult): void {
  const r = report; // alias to satisfy no-param-reassign
  r.results.push(result);
  r.total += 1;

  switch (result.status) {
    case 'ok':
      r.ok += 1;
      break;
    case 'missing':
      r.missing += 1;
      break;
    case 'mismatch':
      r.mismatch += 1;
      break;
    case 'fixed':
      r.fixed += 1;
      break;
    case 'fix-failed':
      r.fixFailed += 1;
      break;
    case 'skipped':
      r.skipped += 1;
      break;
    default:
      break;
  }
}

// ---------------------------------------------------------------------------
// Console reporting
// ---------------------------------------------------------------------------

export function printCheckReport(report: CheckReport): void {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  ${report.label}`);
  console.log(`${'='.repeat(60)}`);
  console.log(`  Total:      ${report.total}`);
  console.log(`  OK:         ${report.ok}`);
  console.log(`  Missing:    ${report.missing}`);
  console.log(`  Mismatch:   ${report.mismatch}`);
  console.log(`  Fixed:      ${report.fixed}`);
  console.log(`  Fix failed: ${report.fixFailed}`);
  console.log(`  Skipped:    ${report.skipped}`);
  console.log(`  Duration:   ${report.durationMs}ms`);

  const issues = report.results.filter((r) => r.status !== 'ok' && r.status !== 'skipped');

  if (issues.length > 0) {
    console.log('\n  Issues:');
    for (const r of issues) {
      let icon = '❌';
      if (r.status === 'fixed') icon = '✅';
      else if (r.status === 'mismatch') icon = '⚠️';
      else if (r.status === 'fix-failed') icon = '💥';

      console.log(`    ${icon} [${r.collection}] ${r.identifier} — ${r.field}: ${r.status}`);
      if (r.currentValue !== undefined) {
        console.log(`       Current:  ${r.currentValue}`);
      }
      if (r.expectedValue !== undefined) {
        console.log(`       Expected: ${r.expectedValue}`);
      }
      if (r.detail) {
        console.log(`       Detail:   ${r.detail}`);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Markdown reporting
// ---------------------------------------------------------------------------

export function generateMarkdownReport(report: IntegrityReport): string {
  const lines: string[] = [];

  lines.push('# Content Integrity Report');
  lines.push('');
  lines.push(`**Mode:** ${report.mode}`);
  lines.push(`**Generated:** ${report.generatedAt}`);
  lines.push('');

  // Summary table
  lines.push('## Summary');
  lines.push('');
  lines.push('| Check | Total | OK | Missing | Mismatch | Fixed | Failed |');
  lines.push('|-------|-------|----|---------|----------|-------|--------|');

  for (const check of report.checks) {
    lines.push(
      `| ${check.label} | ${check.total} | ${check.ok} | ${check.missing} | ${check.mismatch} | ${check.fixed} | ${check.fixFailed} |`,
    );
  }

  lines.push('');

  // Detail sections
  for (const check of report.checks) {
    lines.push(`## ${check.label}`);
    lines.push('');
    lines.push(`Duration: ${check.durationMs}ms`);
    lines.push('');

    const issues = check.results.filter((r) => r.status !== 'ok' && r.status !== 'skipped');

    if (issues.length === 0) {
      lines.push('No issues found.');
    } else {
      lines.push('| Collection | Identifier | Field | Status | Current | Expected |');
      lines.push('|------------|------------|-------|--------|---------|----------|');
      for (const r of issues) {
        lines.push(
          `| ${r.collection} | ${r.identifier} | ${r.field} | ${r.status} | ${r.currentValue ?? ''} | ${r.expectedValue ?? ''} |`,
        );
      }
    }

    lines.push('');
  }

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// File output
// ---------------------------------------------------------------------------

export function writeReport(report: IntegrityReport, outputPath: string): void {
  const markdown = generateMarkdownReport(report);
  fs.writeFileSync(outputPath, markdown, 'utf-8');
  console.log(`Report written to ${outputPath}`);
}
