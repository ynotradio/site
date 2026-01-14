#!/usr/bin/env tsx
/**
 * Pre-commit hook to check for missing test/story files
 * Run with: tsx bin/check-test-story-files.mts [--all] [--skip-check]
 * 
 * This script enforces the test-story coupling pattern:
 * - All .tsx components must have a .stories.tsx file
 * - Components must have EITHER a .test.tsx file OR assertions in the .stories.tsx file
 * - All .ts utilities must have matching .test.ts files
 * - Migration scripts in bin/migrations/ must have test files
 * 
 * Story-based testing: https://storybook.js.org/docs/writing-tests/interaction-testing
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface ValidationResult {
  file: string;
  missingStory?: boolean;
  missingTestAndStoryAssertions?: boolean;
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
 * Check if a story file contains play functions (interaction tests)
 */
function storyFileHasAssertions(storyFilePath: string): boolean {
  if (!fileExists(storyFilePath)) {
    return false;
  }

  try {
    const content = fs.readFileSync(storyFilePath, 'utf-8');
    // Check for play function which indicates interaction testing
    // Look for: play: async ({ ... }) or play: ({ ... })
    const hasPlayFunction = /play\s*:\s*(async\s*)?\(\s*\{/.test(content);
    
    // Also check for common assertion patterns
    const hasAssertions = /expect\(/.test(content) || /@storybook\/test/.test(content);
    
    return hasPlayFunction && hasAssertions;
  } catch {
    return false;
  }
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

    // For components: check story file AND (test file OR story assertions)
    if (isComponent) {
      const storyFile = path.join(dir, `${baseName}.stories.tsx`);
      const testFile = path.join(dir, `${baseName}.test${ext}`);
      
      const hasStoryFile = fileExists(storyFile);
      const hasTestFile = fileExists(testFile);
      const hasStoryAssertions = storyFileHasAssertions(storyFile);
      
      // Component must have story file
      const missingStory = !hasStoryFile;
      
      // Component must have test file OR story assertions
      const missingTestAndStoryAssertions = !hasTestFile && !hasStoryAssertions;
      
      if (missingStory || missingTestAndStoryAssertions) {
        results.push({
          file,
          missingStory,
          missingTestAndStoryAssertions,
          type: 'component',
        });
      }
    }
    
    // For utilities and migrations: only check test file
    if (isUtility || isMigration) {
      const testFile = path.join(dir, `${baseName}.test${ext}`);
      const hasTestFile = fileExists(testFile);
      
      if (!hasTestFile) {
        results.push({
          file,
          missingTestAndStoryAssertions: true,
          type: isMigration ? 'migration' : 'utility',
        });
      }
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
    
    if (violation.missingStory) {
      const baseName = path.basename(violation.file, '.tsx');
      console.error(`  - Missing: ${baseName}.stories.tsx`);
    }
    
    if (violation.missingTestAndStoryAssertions) {
      if (violation.type === 'component') {
        const baseName = path.basename(violation.file, path.extname(violation.file));
        console.error(`  - Missing: ${baseName}.test.tsx OR assertions in ${baseName}.stories.tsx`);
        console.error(`    (Story files can contain tests using play functions)`);
        console.error(`    (See: https://storybook.js.org/docs/writing-tests/interaction-testing)`);
      } else {
        const ext = path.extname(violation.file);
        const baseName = path.basename(violation.file, ext);
        console.error(`  - Missing: ${baseName}.test${ext}`);
      }
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
