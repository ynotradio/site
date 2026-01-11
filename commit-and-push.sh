#!/bin/bash
cd /Users/tjnicolaides/Sites/ynotradio/site

git add -A

git commit -m "Fix link node validation - correct Payload lexical structure

Problem:
- 560/781 stories failing to import (28% success rate)
- Error: 'link node failed to validate: url field invalid'
- Link nodes had incorrect structure for Payload's lexical editor

Root Cause:
- Payload requires link nodes with fields object:
  - fields.linkType: 'custom' | 'internal'
  - fields.url: string
  - fields.newTab: boolean
- Our converters had url/rel/target at root level (wrong structure)

Solution:
- Updated importUtils.ts link structure
- Updated enhancedHtmlToLexical.ts link structure
- Fixed tests to match new structure
- Added comprehensive documentation

Expected Impact:
- Should fix ~560 failed imports
- Success rate should jump from 28% to ~83%
- 646/781 non-deleted stories should now import successfully

Files Changed:
- bin/migrations/shared/importUtils.ts - Fixed link node structure
- bin/migrations/shared/enhancedHtmlToLexical.ts - Fixed link node structure
- bin/migrations/shared/enhancedHtmlToLexical.test.ts - Updated tests
- LINK_VALIDATION_FIX.md - Documentation
- Created debug/investigation scripts"

git push origin copilot/improve-songs-and-records-dropdown

echo "✅ Changes committed and pushed!"
