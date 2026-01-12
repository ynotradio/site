# Payload CMS Cutover - Executive Summary

**Date:** 2026-01-12  
**Status:** Ready for Implementation  
**Estimated Time:** 1-2 days  

## What This Is

Based on side-by-side comparison of dev (Payload/Postgres) vs prod (MySQL), we have **7 blocking issues** preventing cutover. All are fixable code issues, not architectural problems.

## The Bottom Line

**Good News:**
- ✅ Data migration is 100% complete (797 posts, 291 shows, 308 concerts, etc.)
- ✅ Payload CMS is working correctly
- ✅ Most Postgres read implementations exist and work
- ✅ No major architectural changes needed

**Issues:**
- ❌ 7 pages have code bugs preventing Postgres reads
- ❌ Estimated 9 hours to fix all issues
- ❌ Must be fixed before cutover

## Documents Created

| Document | Purpose | Audience |
|----------|---------|----------|
| **PAYLOAD_CUTOVER_PLAN.md** | Full strategy, context, rollback plan | Project leads, architects |
| **CUTOVER_CHECKLIST.md** | Step-by-step implementation guide | Developers implementing fixes |
| **QUICK_FIX_SNIPPETS.md** | Copy-paste code snippets | Developers (fastest reference) |
| **CUTOVER_SUMMARY.md** (this) | Executive overview | Stakeholders, management |

## The 7 Blocking Issues

### 🔴 Critical (Must Fix)

1. **Home Page (Front Page)** - Missing images, wrong story count/order
   - **Impact:** First impression broken, key content missing
   - **Fix Time:** 60 mins
   - **Complexity:** Medium (data investigation + potential re-import)

2. **OnDemand** - Fatal database error (missing JOIN)
   - **Impact:** Page crashes
   - **Fix Time:** 30 mins
   - **Complexity:** Low (add media table JOIN)

3. **CD of the Week** - Data not loading
   - **Impact:** Error message shown
   - **Fix Time:** 45 mins
   - **Complexity:** Low (create factory or enable flag)

4. **Schedule** - Raw JSON showing instead of formatted text
   - **Impact:** Unreadable content
   - **Fix Time:** 30 mins
   - **Complexity:** Medium (add Lexical→HTML converter)

5. **Top 11** - PHP warnings breaking layout
   - **Impact:** Login/voting broken
   - **Fix Time:** 45 mins
   - **Complexity:** Low (fix session_start order)

6. **Custom Texts** - No Postgres implementation exists
   - **Impact:** Legacy content not displaying
   - **Fix Time:** 60 mins
   - **Complexity:** Medium (create new class)

6. **DeeJays** - Incomplete roster data
   - **Impact:** Missing DJ profiles
   - **Fix Time:** 45 mins
   - **Complexity:** Low (debug query/flag)

**Total Fix Time:** 5.75 hours (plan for 8 with testing)

### 🟡 Non-Critical (Can Defer)

- New Music content is stale (operational issue - re-run import)
- Some 404 asset errors (cosmetic)
- Mixed-content warnings on prod (prod config issue)

## Risk Assessment

**Low Risk Issues:**
- OnDemand, Top 11, CD of the Week - Straightforward code fixes
- All have MySQL fallback if Postgres fails

**Medium Risk Issues:**
- Custom Texts - New implementation needed (but data exists)
- Schedule - Must not break existing MySQL fallback

**Mitigation:**
- All Postgres implementations are read-only (no write risk)
- Feature flags allow instant rollback
- MySQL fallback tested and working

## Timeline

### Aggressive (1 day)
- Morning: Fix issues #1-4 (2.5 hours)
- Afternoon: Fix issues #5-7 (3.5 hours)
- Evening: Test and verify (2 hours)
- Next day: Cutover

### Conservative (2 days)
- Day 1: Fix all 7 issues (7 hours)
- Day 1 EOD: Full test suite (2 hours)
- Day 2 AM: Final verification
- Day 2 PM: Cutover

**Recommended:** Conservative (2-day) approach

## What Success Looks Like

**Before:**
```
❌ Home - Missing images, wrong story count
❌ OnDemand - Fatal error: PDOException
❌ CD of the Week - "Error loading CD"
❌ Schedule - Raw JSON visible: {"root":{"children"...
❌ Top 11 - Warning: session_start() failed
❌ Custom Texts - No implementation found
❌ DeeJays - 12 DJs shown (should be 82)
```

**After:**
```
✅ Home - All images load, correct stories
✅ OnDemand - Loads with images
✅ CD of the Week - Review displays
✅ Schedule - Readable formatted text
✅ Top 11 - Clean page, voting works
✅ Custom Texts - Legacy content displays
✅ DeeJays - Full roster (82 DJs)
```

## Next Steps

1. **Review** this summary with team
2. **Assign** developer(s) to implementation
3. **Schedule** cutover window (suggest weekday morning)
4. **Begin** fixes using CUTOVER_CHECKLIST.md
5. **Test** using test script in QUICK_FIX_SNIPPETS.md
6. **Cutover** when all tests pass

## Questions?

- **"Can we cutover with these issues?"** No - fatal errors will crash pages
- **"How hard are these fixes?"** Mostly straightforward code changes
- **"What if something breaks?"** Feature flags allow instant rollback to MySQL
- **"Will data be lost?"** No - all operations are read-only
- **"When can we cutover?"** 1-2 days after starting fixes

## Resource Needs

- **1 senior developer** (knows PHP, SQL, Payload CMS)
- **8 hours** focused work time
- **Access to:**
  - Dev server (localhost:8080)
  - Payload admin (localhost:3001)
  - Postgres database
  - PHP/MySQL codebase

## Deliverables

After completion:
- [ ] All 7 issues fixed
- [ ] Test script passes 10/10 pages
- [ ] Home page matches prod (images + story count)
- [ ] Playwright comparison shows green
- [ ] Rollback procedure tested
- [ ] Documentation updated

## Contact

For questions about this plan:
- See PAYLOAD_CUTOVER_PLAN.md (detailed strategy)
- See CUTOVER_CHECKLIST.md (implementation steps)
- See QUICK_FIX_SNIPPETS.md (code examples)

---

**Status as of 2026-01-12:** Plans created, awaiting implementation start

