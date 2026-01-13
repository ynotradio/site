#!/usr/bin/env tsx
/**
 * Pre-commit hook to check for missing test/story files
 * Run with: tsx bin/check-test-story-files.mts
 * 
 * Validates that:
 * - All component files (.tsx) have matching .test.tsx and .stories.tsx files
 * - All utility files (.ts) have matching .test.ts files
 * - Migration scripts have test files
 * 
 * Usage:
 *   tsx bin/check-test-story-files.mts              # Check staged files (git pre-commit)
 *   tsx bin/check-test-story-files.mts --all        # Check all files in repo
 *   tsx bin/check-test-story-files.mts --skip-check # Skip validation (emergency)
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface ValidationResult {
  file: string;
  missingTest?: boolean;
  missingStory?: boolean;
}

/**
 * Get list of staged TypeScript/TSX files
 */
function getStagedFiles(): string[] {
  try {
    const output = require('child_process')
      .execSync('git diff --cached --name-only --diff-filter=ACM', { encoding: 'utf8' });
    return output
      .split('\n')
      .filter((file) => file.match(/\.(ts|tsx)$/) && !file.match(/\.test\.(ts|tsx)$/) && !file.match(/\.stories\.tsx$/))
      .filter((file) => file.trim() !== '');
  } catch {
    // If we can't get staged files, check all files (for initial setup)
    return [];
  }
}

Now let's create the custom check script:

<function_calls>
<invoke name="create">
<parameter name="file_text">#!/usr/bin/env tsx
/**
 * Pre-commit hook to check for missing test/story files
 * Run with: tsx bin/check-test-story-files.mts [--all] [--skip-check]
 * 
 * This script enforces the test-story coupling pattern:
 * - All .tsx components must have matching .test.tsx and .stories.tsx files
 * - All .ts utilities must have matching .test.ts files
 * - Migration scripts in bin/migrations/ must have test files
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface ValidationResult {
  file: string;
  missingTest?: boolean;
  missingStory?: boolean;
  type: 'component' | 'utility' | 'migration';
}

const args = process.argv.slice(2);
const skipCheck = args.includes('--skip-check');
const checkAll = args.includes('--all');

if (skipCheck) {
  console.log('⏭️  Skipping test/story file check (--skip-check flag provided)');
  process.exit(0);
}

/**
 * Get staged .ts and .tsx files
 */
function getStagedFiles(): string[] {
  try {
    const output = execSync('git diff --cached --name-only --diff-filter=ACM', {
      encoding: 'utf-8',
    });
    return output
      .split('\n')
      .filter((file: string) => file.match(/\.(ts|tsx)$/) && !file.includes('.test.') && !file.includes('.stories.'))
      .filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * Get all .ts and .tsx files in the repo
 */
function getAllFiles(): string[] {
  try {
    const output = execSync('git ls-files "*.ts" "*.tsx"', {
      encoding: 'utf-8',
    });
    return output
      .split('\n')
      .filter((file: string) => !file.includes('.test.') && !file.includes('.stories.'))
      .filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * Check if a file exists
 */
function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

/**
 * Check for missing test/story files
 */
function checkFiles(files: string[]): ValidationResult[] {
  const results: ValidationResult[] = [];

  for (const file of files) {
    const ext = path.extname(file);
    const baseName = path.basename(file, ext);
    const dir = path.dirname(file);

    // Skip config files, type definitions, and index files
    if (
      file.includes('/index.') ||
      file.endsWith('.d.ts') ||
      file.endsWith('.config.ts') ||
      file.endsWith('.config.mjs') ||
      file.includes('next-env.d.ts') ||
      file.includes('vitest.config.ts') ||
      file.includes('payload.config.ts')
    ) {
      continue;
    }

    // Skip Next.js app router files
    if (file.includes('/app/') && (baseName === 'page' || baseName === 'layout' || baseName === 'loading' || baseName === 'error' || baseName === 'not-found' || baseName === 'route')) {
      continue;
    }

    const isComponent = ext === '.tsx' && file.includes('/components/');
    const isUtility = ext === '.ts';
    const isMigration = file.startsWith('bin/migrations/') && ext === '.ts';

    // Check test file
    const testFile = path.join(dir, `${baseName}.test${ext}`);
    const missingTest = !fileExists(testFile);

    // Check story file (only for user-facing components)
    let missingStory = false;
    if (isComponent) {
      const storyFile = path.join(dir, `${baseName}.stories.tsx`);
      missingStory = !fileExists(storyFile);
    }

    if (missingTest || missingStory) {
      results.push({
        file,
        missingTest,
        missingStory,
        type: isComponent ? 'component' : isMigration ? 'migration' : 'utility',
      });
    }
  }

  return results;
}

/**
 * Main function
 */
async function main(): Promise<void> {
  const files = checkAll ? getAllFiles() : getStagedFiles();

  if (files.length === 0) {
    console.log('No files to check.');
    process.exit(0);
  }

  console.log(`Checking ${files.length} file(s) for test/story coupling...`);

  const violations = checkFiles(files);

  if (violations.length === 0) {
    console.log('✅ All test/story file requirements met!');
    process.exit(0);
  }

  console.error('\n❌ Test/Story file coupling violations found:\n');

  for (const violation of violations) {
    console.error(`File: ${violation.file}`);
    if (violation.missingTest) {
      const ext = path.extname(violation.file);
      const baseName = path.basename(violation.file, ext);
      console.error(`  - Missing: ${baseName}.test${ext}`);
    }
    if (violation.missingStory) {
      const baseName = path.basename(violation.file, '.tsx');
      console.error(`  - Missing: ${baseName}.stories.tsx`);
    }
    console.error('');
  }

  console.error(`Total violations: ${violations.length}`);
  console.error('\nTo bypass this check (emergency commits only): --skip-check');
  console.error('For more info, see: .claude/skills/test-story-coupling/SKILL.md\n');

  process.exit(1);
}

main().catch((error) => {
  console.error('Error checking test/story files:', error);
  process.exit(1);
});
