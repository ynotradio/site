/**
 * Test script to verify relative URL conversion in HTML-to-Lexical converter
 * Tests with sample HTML that was causing validation failures
 */

import { convertHtmlToLexicalEnhanced } from './shared/enhancedHtmlToLexical';

// Sample HTML with relative URLs that was causing failures
const testCases = [
  {
    name: 'Relative URL (contests.php)',
    html: '<p>Check out our <a href="contests.php">contests page</a> for more info.</p>',
  },
  {
    name: 'Root-relative URL (/ondemand.php)',
    html: '<p>Listen to the <a href="/ondemand.php?id=176">on-demand show</a>.</p>',
  },
  {
    name: 'Multiple relative URLs',
    html: `<p>
      Visit our <a href="shows.php">shows</a>,
      <a href="schedule.php">schedule</a>,
      <a href="donate.php">donate</a>, or
      <a href="contact.php">contact</a> pages.
    </p>`,
  },
  {
    name: 'Absolute URL (should not change)',
    html: '<p>Visit <a href="https://google.com">Google</a> for more.</p>',
  },
];

console.log('Testing URL conversion in HTML-to-Lexical converter\n');
console.log('='.repeat(80));

for (const testCase of testCases) {
  console.log(`\n${testCase.name}`);
  console.log('-'.repeat(80));
  console.log('Input HTML:', testCase.html);

  const result = convertHtmlToLexicalEnhanced(testCase.html);

  // Extract all link nodes from the result
  const linkNodes: any[] = [];

  function findLinks(node: any): void {
    if (!node) return;

    if (node.type === 'link') {
      linkNodes.push(node);
    }

    if (node.children && Array.isArray(node.children)) {
      for (const child of node.children) {
        findLinks(child);
      }
    }
  }

  findLinks(result.root);

  if (linkNodes.length > 0) {
    console.log('Converted URLs:');
    for (const link of linkNodes) {
      console.log(`  - ${link.url}`);
    }
  } else {
    console.log('No links found!');
  }
}

console.log(`\n${'='.repeat(80)}`);
console.log('✅ URL conversion test completed\n');
