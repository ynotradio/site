# Enhanced HTML-to-Lexical Converter

**Date:** 2026-01-11  
**Status:** ✅ Complete (Core Functionality)  
**Tests:** 36/36 Passing ✅

## Problem Solved

**Issue:** Custom Texts imported from MySQL contain complex HTML (headings, lists, images, iframes, tables) that the basic `convertHtmlToLexical()` function doesn't handle. This results in raw HTML tags appearing in the Payload CMS rich text editor and on the frontend.

**Solution:** Created `convertHtmlToLexicalEnhanced()` - a comprehensive HTML-to-Lexical converter that properly handles all common HTML structures and converts them to valid Lexical JSON nodes.

## Supported HTML Elements

### Block Elements
- ✅ **Headings** (`<h1>` through `<h6>`) → Lexical HeadingNode
- ✅ **Paragraphs** (`<p>`) → Lexical ParagraphNode
- ✅ **Block Quotes** (`<blockquote>`) → Lexical QuoteNode
- ✅ **Horizontal Rules** (`<hr>`) → Lexical HorizontalRuleNode
- ✅ **Divs/Sections** (`<div>`, `<section>`, `<article>`) → Unwrapped, children processed
- ✅ **Center tags** (`<center>`) → Stripped, content preserved

### Lists
- ✅ **Unordered Lists** (`<ul>`) → Lexical ListNode (bullet)
- ✅ **Ordered Lists** (`<ol>`) → Lexical ListNode (number)
- ✅ **List Items** (`<li>`) → Lexical ListItemNode
- ✅ **Nested formatting in lists** (bold, italic, links within list items)

### Inline Formatting
- ✅ **Bold** (`<b>`, `<strong>`) → format: 1
- ✅ **Italic** (`<em>`, `<i>`) → format: 2
- ✅ **Strikethrough** (`<s>`, `<strike>`) → format: 4
- ✅ **Underline** (`<u>`) → format: 8
- ✅ **Code** (`<code>`) → format: 16
- ✅ **Links** (`<a href="">`) → Lexical LinkNode with URL, title, and rel attributes
- ✅ **Combined formatting** (e.g., bold + italic)

### Media
- ✅ **Images** (`<img>`) → Lexical UploadNode with src, alt, width, height
  - Preserves all image attributes
  - Ready for integration with Payload media collection
  - Maintains dimensions if specified

### Embeds
- ✅ **YouTube iframes** → Detected and converted to YouTube URL text
  - Handles: `youtube.com/embed/VIDEO_ID`
  - Handles: `youtube.com/watch?v=VIDEO_ID`
  - Handles: `youtu.be/VIDEO_ID`
- ✅ **Generic iframes** → Converted to placeholder text with source URL
  - Preserves embed URL for manual handling

### Complex Structures
- ✅ **Tables** → Simplified to structured text format
  - Converts to `[Table]\nRow 1 | Data\nRow 2 | Data`
  - Preserves content, loses visual layout
  - Can be enhanced later for proper table nodes

## Safety Features

### HTML Sanitization (DOMPurify)
```typescript
ALLOWED_TAGS: ['p', 'br', 'div', 'h1-h6', 'ul', 'ol', 'li', 'a', 'b', 'strong', 
               'i', 'em', 'u', 's', 'img', 'blockquote', 'pre', 'code', 'hr', 
               'table', 'iframe', 'center']

ALLOWED_ATTR: ['href', 'title', 'target', 'rel', 'src', 'alt', 'width', 'height', 
               'class', 'id', 'data-*']

✗ BLOCKS: <script>, <style>, onclick, onerror, javascript: URLs
✓ KEEPS: Safe content, semantic HTML
```

### URL Validation
- Validates all URLs in links, images, and iframes
- Blocks dangerous protocols (javascript:, data: with executable content)
- Preserves only safe URL schemes (http, https, mailto, tel)

### Attribute Whitelisting
- Only safe attributes are preserved
- Strips event handlers (onclick, onload, etc.)
- Maintains semantic attributes (href, alt, title)
- Preserves layout hints (width, height, class, id)

## Usage

### Basic Import
```typescript
import { convertHtmlToLexicalEnhanced } from './shared/enhancedHtmlToLexical';

const html = `
  <h1>Main Title</h1>
  <p>Paragraph with <strong>bold</strong> and <a href="#">link</a></p>
  <ul>
    <li>Item 1</li>
    <li>Item 2</li>
  </ul>
`;

const lexicalJson = convertHtmlToLexicalEnhanced(html);
// Use in Payload create/update operations
```

### In Import Scripts
```typescript
import { convertHtmlToLexicalEnhanced } from './shared/enhancedHtmlToLexical';
import { convertHtmlToLexical } from './shared/importUtils'; // old version

// For Custom Texts (complex HTML)
const contentEnhanced = convertHtmlToLexicalEnhanced(customText.html);

// For Stories (simple HTML) - can still use old converter
const contentSimple = convertHtmlToLexical(story.content);
```

## Testing

### Test Coverage
```
✓ Basic Content (3 tests)
  - Empty strings, plain text, simple paragraphs

✓ Headings (2 tests)
  - All heading levels (h1-h6)

✓ Inline Formatting (6 tests)
  - Bold, italic, combined, links, strikethrough, underline

✓ Lists (3 tests)
  - Unordered, ordered, formatted list items

✓ Block Quotes (1 test)
  - Blockquote conversion

✓ Images (2 tests)
  - Images with alt text, dimensions

✓ Embeds and iframes (3 tests)
  - YouTube detection, generic iframes

✓ Tables (1 test)
  - Table simplification

✓ Horizontal Rules (1 test)
  - HR node creation

✓ Container Elements (3 tests)
  - Div unwrapping, nested divs, center tags

✓ Complex HTML (1 test)
  - Mixed content types

✓ Security and Sanitization (3 tests)
  - Script stripping, event handler removal, safe attributes

✓ Edge Cases (4 tests)
  - Null input, empty tags, malformed HTML, whitespace

✓ Lexical Structure Validation (3 tests)
  - Root, paragraph, text node structure validation

TOTAL: 36/36 tests passing ✅
```

### Run Tests
```bash
yarn test bin/migrations/shared/enhancedHtmlToLexical.test.ts
```

## Known Limitations & Future Enhancements

### Current Limitations
1. **Tables** - Simplified to text, not true table nodes
2. **Nested Lists** - Basic support, may need refinement
3. **Images** - Not yet integrated with Payload media collection upload
4. **Custom Classes** - Preserved but not semantically interpreted
5. **Inline Styles** - Stripped for safety

### Future Enhancements
1. **Media Integration**
   - Download images from URLs
   - Upload to Payload media collection
   - Link UploadNode to actual media IDs

2. **Advanced Embeds**
   - Create custom Lexical nodes for embeds
   - Support Vimeo, Spotify, Twitter embeds
   - Preview embeds in editor

3. **Table Support**
   - Implement proper Lexical TableNode
   - Preserve table structure
   - Support for table headers/footers

4. **Class Name Handling**
   - Map semantic classes to Lexical formats
   - Preserve alignment classes
   - Handle custom styling

5. **Nested List Support**
   - Better handling of multi-level lists
   - Preserve list hierarchy
   - Support mixed list types

## Migration Strategy

### Phase 1: Re-import Custom Texts (Current)
```bash
# Update importPosts.ts to use enhanced converter for custom texts
tsx bin/migrations/importPosts.ts --env dev
```

### Phase 2: Validate Content
```bash
# Check Payload admin to verify rich content renders correctly
# Review posts at http://localhost:3000/admin/collections/posts/
```

### Phase 3: Frontend Integration
```typescript
// In Next.js/React components
import { SerializedLexicalNode } from 'lexical';

function renderLexicalContent(content: SerializedLexicalNode) {
  // Use Payload's Lexical renderer or custom renderer
  // All HTML structures now properly converted
}
```

## Integration with Import Scripts

### Update importPosts.ts
```typescript
import { convertHtmlToLexicalEnhanced } from './shared/enhancedHtmlToLexical';

// Detect content type
if (post.source === 'custom_text') {
  // Use enhanced converter for complex HTML
  content = convertHtmlToLexicalEnhanced(post.content);
} else {
  // Use basic converter for simple stories
  content = convertHtmlToLexical(post.content);
}
```

### Benefits
- ✅ No raw HTML in rich text editor
- ✅ Content fully editable in Payload CMS
- ✅ Proper rendering on frontend
- ✅ SEO-friendly structured content
- ✅ Accessible markup

## Files Created

1. **`bin/migrations/shared/enhancedHtmlToLexical.ts`** (13.7 KB)
   - Main converter implementation
   - HTML sanitization
   - Lexical node generation

2. **`bin/migrations/shared/enhancedHtmlToLexical.test.ts`** (12.2 KB)
   - Comprehensive test suite
   - 36 test cases
   - Edge case coverage

3. **`docs/ENHANCED_HTML_TO_LEXICAL.md`** (This file)
   - Full documentation
   - Usage examples
   - Migration guide

## Dependencies Added

```json
{
  "jsdom": "^27.4.0",
  "dompurify": "^3.3.1",
  "@types/jsdom": "^27.0.0",
  "@types/dompurify": "^3.2.0"
}
```

## Success Metrics

- ✅ 36/36 tests passing
- ✅ Handles all common HTML structures
- ✅ XSS protection via DOMPurify
- ✅ Proper Lexical JSON output
- ✅ Backwards compatible (can co-exist with old converter)
- ✅ Ready for production use

## Next Steps

1. **Update importPosts.ts** to use enhanced converter for custom texts
2. **Re-import posts** with new converter
3. **Validate** in Payload admin (posts 251, 243, etc.)
4. **Test frontend** rendering
5. **Document** any edge cases found
6. **Consider** implementing media integration for images

---

**Ready to use!** The enhanced converter is production-ready for handling complex HTML in Custom Text imports. 🎉
