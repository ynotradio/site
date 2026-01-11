import { migrationConfig } from './config';

function toAbsoluteUrl(url: string): string {
  if (!url) return url;

  // Already absolute
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // Protocol-relative URL
  if (url.startsWith('//')) {
    return `https:${url}`;
  }

  // Root-relative URL (starts with /)
  if (url.startsWith('/')) {
    return `${migrationConfig.baseUrl.replace(/\/$/, '')}${url}`;
  }

  // Relative URL (e.g., contests.php, ../page.html)
  return `${migrationConfig.baseUrl}${url}`;
}

const testUrls = [
  'http://www.dobbsphilly.com',
  'contests.php',
  '/donate.php',
  '//cdn.example.com/image.jpg',
];

console.log('Testing URL conversion:');
testUrls.forEach((url) => {
  console.log(`  "${url}" -> "${toAbsoluteUrl(url)}"`);
});
