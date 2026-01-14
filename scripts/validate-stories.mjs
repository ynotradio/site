#!/usr/bin/env node

/**
 * Storybook Story Validation Script
 * 
 * Checks all .stories.tsx files for common issues that cause rendering problems.
 * Run before committing new stories to catch issues early.
 * 
 * Usage: node scripts/validate-stories.mjs
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

// Known Payload UI exports that must be mocked
const REQUIRED_PAYLOAD_MOCKS = [
  'useField',
  'useFormFields',
  'Gutter',
  'useStepNav',
];

// Payload UI imports that are allowed (must be mocked)
const ALLOWED_PAYLOAD_IMPORTS = [
  'useField',
  'useFormFields',
  'Gutter',
  'useStepNav',
];

let totalIssues = 0;
let storiesChecked = 0;

/**
 * Find all .stories.tsx files recursively
 */
function findStoryFiles(dir, fileList = []) {
  const files = readdirSync(dir);

  files.forEach((file) => {
    const filePath = join(dir, file);
    const stat = statSync(filePath);

    if (stat.isDirectory() && !file.includes('node_modules') && !file.startsWith('.')) {
      findStoryFiles(filePath, fileList);
    } else if (file.endsWith('.stories.tsx')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

/**
 * Check if story file has required structure
 */
function validateStoryStructure(filePath, content) {
  const issues = [];
  const relativePath = filePath.replace(rootDir, '');

  // Check for meta export
  if (!content.includes('const meta') && !content.includes('export const meta')) {
    issues.push(`❌ Missing 'const meta' definition`);
  }

  // Check for default export
  if (!content.includes('export default meta')) {
    issues.push(`❌ Missing 'export default meta'`);
  }

  // Check for at least one story
  const storyExports = (content.match(/export const \w+: Story/g) || []).length;
  if (storyExports === 0) {
    issues.push(`❌ No story exports found (should have at least one 'export const StoryName: Story')`);
  }

  // Check for component import
  const componentFileName = filePath
    .split('/')
    .pop()
    .replace('.stories.tsx', '');
  
  if (!content.includes(`from './${componentFileName}'`) && 
      !content.includes(`from "./${componentFileName}"`)) {
    issues.push(`⚠️  Component import might be incorrect (expected: from './${componentFileName}')`);
  }

  return issues;
}

/**
 * Check for unmocked Payload UI imports
 */
function checkPayloadUIImports(filePath, content) {
  const issues = [];
  const relativePath = filePath.replace(rootDir, '');

  // Find all Payload UI imports
  const payloadImportRegex = /import\s+{([^}]+)}\s+from\s+['"]@payloadcms\/ui['"]/g;
  const matches = [...content.matchAll(payloadImportRegex)];

  if (matches.length > 0) {
    matches.forEach((match) => {
      const imports = match[1]
        .split(',')
        .map((i) => i.trim())
        .filter(Boolean);

      imports.forEach((importName) => {
        if (!ALLOWED_PAYLOAD_IMPORTS.includes(importName)) {
          issues.push(
            `❌ Unmocked Payload UI import: '${importName}' - Add to .storybook/mocks/@payloadcms/ui.tsx`
          );
        }
      });
    });
  }

  return issues;
}

/**
 * Check for proper provider wrapping (DndContext, etc.)
 */
function checkRequiredProviders(filePath, content) {
  const issues = [];

  // If component uses @dnd-kit, story should have DndContext
  if (content.includes('useSortable') && !content.includes('DndContext')) {
    issues.push(`⚠️  Component uses @dnd-kit but story missing <DndContext> wrapper`);
  }

  // If component uses SortableContext, check it's in decorator
  if (content.includes('SortableContext') && !content.includes('decorators:')) {
    issues.push(`⚠️  SortableContext found but no decorators defined`);
  }

  return issues;
}

/**
 * Check for fetch/API mocking
 */
function checkAPIMocking(filePath, content) {
  const issues = [];

  // If component content has fetch calls, story should mock it
  const componentPath = filePath.replace('.stories.tsx', '.tsx');
  try {
    const componentContent = readFileSync(componentPath, 'utf-8');
    
    if (componentContent.includes('fetch(') && 
        !content.includes('fetch') && 
        !content.includes('msw') &&
        !content.includes('mockData')) {
      issues.push(`⚠️  Component uses fetch() but story has no mocking (use decorator or MSW)`);
    }
  } catch (e) {
    // Component file not found, skip this check
  }

  return issues;
}

/**
 * Validate a single story file
 */
function validateStory(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const relativePath = filePath.replace(rootDir, '');
  
  console.log(`\n${colors.blue}Checking: ${relativePath}${colors.reset}`);

  const allIssues = [
    ...validateStoryStructure(filePath, content),
    ...checkPayloadUIImports(filePath, content),
    ...checkRequiredProviders(filePath, content),
    ...checkAPIMocking(filePath, content),
  ];

  if (allIssues.length === 0) {
    console.log(`  ${colors.green}✓ No issues found${colors.reset}`);
  } else {
    allIssues.forEach((issue) => {
      console.log(`  ${issue}`);
      totalIssues++;
    });
  }

  storiesChecked++;
}

/**
 * Check if Payload UI mock has all required exports
 */
function validatePayloadUIMock() {
  console.log(`\n${colors.blue}Validating Payload UI mock...${colors.reset}`);
  
  const mockPath = join(rootDir, '.storybook/mocks/@payloadcms/ui.tsx');
  
  try {
    const mockContent = readFileSync(mockPath, 'utf-8');
    const missing = [];

    REQUIRED_PAYLOAD_MOCKS.forEach((exportName) => {
      if (!mockContent.includes(`export const ${exportName}`) && 
          !mockContent.includes(`export function ${exportName}`)) {
        missing.push(exportName);
      }
    });

    if (missing.length > 0) {
      console.log(`  ${colors.red}❌ Missing required mocks: ${missing.join(', ')}${colors.reset}`);
      totalIssues += missing.length;
    } else {
      console.log(`  ${colors.green}✓ All required mocks present${colors.reset}`);
    }
  } catch (e) {
    console.log(`  ${colors.red}❌ Payload UI mock file not found at: ${mockPath}${colors.reset}`);
    totalIssues++;
  }
}

/**
 * Main execution
 */
function main() {
  console.log(`${colors.blue}
╔═══════════════════════════════════════════════╗
║   Storybook Story Validation Script          ║
╚═══════════════════════════════════════════════╝${colors.reset}
  `);

  // Validate Payload UI mock first
  validatePayloadUIMock();

  // Find and validate all story files
  const payloadDir = join(rootDir, 'payload/src');
  const storyFiles = findStoryFiles(payloadDir);

  console.log(`\nFound ${storyFiles.length} story files to validate...\n`);

  storyFiles.forEach(validateStory);

  // Print summary
  console.log(`\n${colors.blue}═══════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.blue}Summary:${colors.reset}`);
  console.log(`  Stories checked: ${storiesChecked}`);
  
  if (totalIssues === 0) {
    console.log(`  ${colors.green}✓ All stories validated successfully!${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`  ${colors.yellow}⚠  Total issues found: ${totalIssues}${colors.reset}\n`);
    console.log(`${colors.yellow}Please fix the issues above before committing.${colors.reset}`);
    console.log(`${colors.yellow}See docs/STORYBOOK_GUIDE.md for help.${colors.reset}\n`);
    process.exit(1);
  }
}

main();
