# Payload CMS Cutover - Document Index

All documents created from the side-by-side comparison report analysis.

---

## Quick Start

**If you're a...**

- 👔 **Manager/Stakeholder** → Start with **CUTOVER_SUMMARY.md**
- 👨‍💻 **Developer implementing fixes** → Start with **CUTOVER_CHECKLIST.md**
- 🏗️ **Architect/Tech Lead** → Start with **PAYLOAD_CUTOVER_PLAN.md**
- 🔍 **Need code snippets** → Jump to **QUICK_FIX_SNIPPETS.md**
- 📊 **Understanding architecture** → See **CUTOVER_ARCHITECTURE.md**

---

## Document Hierarchy

```
📋 CUTOVER_SUMMARY.md (this file)
    │
    ├─ Executive overview
    ├─ 6 blocking issues summary
    ├─ Timeline & risk assessment
    └─ Go/No-Go criteria
        │
        ▼
📘 PAYLOAD_CUTOVER_PLAN.md
    │
    ├─ Detailed strategy
    ├─ Per-issue analysis
    ├─ Implementation sequence
    ├─ Testing checklist
    ├─ Rollback plan
    └─ Post-cutover tasks
        │
        ├────────────┬────────────┐
        ▼            ▼            ▼
    
📝 CUTOVER_      💻 QUICK_FIX_    🏗️ CUTOVER_
   CHECKLIST.md     SNIPPETS.md      ARCHITECTURE.md
    │                │                │
    ├─ Task list     ├─ SQL code     ├─ Diagrams
    ├─ Checkboxes    ├─ PHP code     ├─ Data flow
    ├─ Test cmds     ├─ Test script  ├─ Schema diff
    └─ Time est.     └─ Copy-paste   └─ Visual guide
```

---

## Documents Overview

### 1. CUTOVER_SUMMARY.md
**Purpose:** High-level executive summary  
**Audience:** Managers, stakeholders, decision-makers  
**Length:** 3 pages  
**Contains:**
- What's broken (6 issues)
- Why it matters
- How long to fix (1-2 days)
- Risk assessment
- Go/No-Go criteria

**Read this if:** You need to understand the situation at a glance

---

### 2. PAYLOAD_CUTOVER_PLAN.md
**Purpose:** Complete strategy and context  
**Audience:** Project leads, architects, senior developers  
**Length:** 15 pages  
**Contains:**
- Full problem analysis
- Detailed fix descriptions
- Implementation sequence (Day 1 morning → Day 2 afternoon)
- Testing checklist
- Rollback procedure
- Post-cutover tasks
- Files reference
- Success criteria

**Read this if:** You're planning the cutover or need full context

---

### 3. CUTOVER_CHECKLIST.md
**Purpose:** Step-by-step implementation guide  
**Audience:** Developers doing the work  
**Length:** 8 pages  
**Contains:**
- 6 issues as task lists with checkboxes
- Quick-reference fixes
- Test commands per fix
- Time estimates
- Final verification steps
- Emergency rollback steps

**Read this if:** You're implementing the fixes today

---

### 4. QUICK_FIX_SNIPPETS.md
**Purpose:** Ready-to-use code snippets  
**Audience:** Developers (fastest reference)  
**Length:** 14 pages  
**Contains:**
- Complete SQL queries (copy-paste ready)
- Complete PHP code (copy-paste ready)
- Test bash script
- No explanation, just code

**Read this if:** You know what to do and just need the code

---

### 5. CUTOVER_ARCHITECTURE.md
**Purpose:** Visual architecture guide  
**Audience:** Technical team, architects  
**Length:** 12 pages  
**Contains:**
- System architecture diagrams
- Database schema comparisons
- Data flow visualization
- Feature flag architecture
- Rollback architecture
- Before/After metrics

**Read this if:** You need to understand how the system works

---

## The 7 Blocking Issues (Quick Reference)

| # | Issue | Impact | Time | Complexity | Document |
|---|-------|--------|------|------------|----------|
| 1 | Home Page - Images/Sort | First impression | 60m | Med | Section 1.1 |
| 2 | OnDemand - Media JOIN | Fatal crash | 30m | Low | Section 1.2 |
| 3 | CD of Week - Factory | Error msg | 45m | Low | Section 1.3 |
| 4 | Schedule - Lexical | Raw JSON | 30m | Med | Section 1.4 |
| 5 | Top 11 - Session | Warnings | 45m | Low | Section 1.5 |
| 6 | Custom Text - Missing | No data | 60m | Med | Section 1.6 |
| 7 | DeeJays - Incomplete | Missing | 45m | Low | Section 1.7 |

**Total:** 6.75 hours (plan for 9 with testing)

---

## Reading Path by Role

### Project Manager
1. Read **CUTOVER_SUMMARY.md** (10 mins)
2. Skim **PAYLOAD_CUTOVER_PLAN.md** sections:
   - Executive Summary
   - Timeline Estimate
   - Success Criteria
3. Review **Questions for Stakeholders** section
4. Make go/no-go decision

### Tech Lead / Architect
1. Read **PAYLOAD_CUTOVER_PLAN.md** fully (30 mins)
2. Review **CUTOVER_ARCHITECTURE.md** (15 mins)
3. Assess team capacity vs timeline
4. Assign tasks to developers

### Senior Developer (Implementing)
1. Read **CUTOVER_CHECKLIST.md** (15 mins)
2. Keep **QUICK_FIX_SNIPPETS.md** open for reference
3. Reference **CUTOVER_ARCHITECTURE.md** if stuck
4. Follow checklist in order

### Junior Developer (Learning)
1. Start with **CUTOVER_ARCHITECTURE.md** (30 mins)
2. Read **PAYLOAD_CUTOVER_PLAN.md** sections 1.1-1.6
3. Use **QUICK_FIX_SNIPPETS.md** for code examples
4. Ask questions using context from documents

### QA / Tester
1. Read **PAYLOAD_CUTOVER_PLAN.md** "Testing Checklist" section
2. Use test script from **QUICK_FIX_SNIPPETS.md**
3. Follow "Final Verification" in **CUTOVER_CHECKLIST.md**

---

## Key Files to Edit (Cross-Reference)

These are the actual files that need changes:

### Must Create (New Files)
- `src/models/implementations/PostgresCustomText.php` - Issue #5
- `src/models/CdOfTheWeekFactory.php` - Issue #2 (if missing)

### Must Edit (Existing Files)
- `src/models/implementations/PostgresOnDemand.php` - Issue #1
  - Methods: getById(), getAll(), getAllForAdmin()
  
- `src/models/implementations/PostgresSchedule.php` - Issue #3
  - Add: convertLexicalToHtml() and helper methods
  
- `src/models/CustomTextFactory.php` - Issue #5
  - Add: Postgres routing logic
  
- `public/top11.php` (or similar) - Issue #4
  - Move: session_start() to top
  
- `src/models/FeatureManager.php` - Issues #2, #5
  - Add: Feature flags if missing

### May Need Debug (Check First)
- `src/models/implementations/PostgresDeejay.php` - Issue #6
- `src/models/DeejayFactory.php` - Issue #6

---

## Testing Sequence

### Phase 1: Unit Tests (Per-Fix)
After each fix:
```bash
curl http://localhost:8080/[page].php | grep -i "error\|fatal\|warning"
```

### Phase 2: Integration Test (All Pages)
After all fixes:
```bash
bash test-cutover.sh  # Script in QUICK_FIX_SNIPPETS.md
```

### Phase 3: Manual Verification
- [ ] Browse all 10 pages
- [ ] Check browser console for JS errors
- [ ] Verify images load
- [ ] Test interactive features (Top 11 voting)

### Phase 4: Playwright Comparison
- [ ] Re-run original Playwright crawl
- [ ] Compare to baseline
- [ ] Verify all green

---

## Timeline Reference

### Conservative (Recommended)
- **Day 1:** 6 hours fixing + 2 hours testing
- **Day 2 AM:** Final verification
- **Day 2 PM:** Cutover

### Aggressive (If Confident)
- **Morning:** 3 hours fixing issues #1-3
- **Afternoon:** 3 hours fixing issues #4-6
- **Evening:** 2 hours testing
- **Next Day:** Cutover

---

## Emergency Contacts / Resources

### If You Get Stuck

**Question:** "How do I fix OnDemand?"  
**Answer:** See QUICK_FIX_SNIPPETS.md section "Fix #1"

**Question:** "Why is Schedule showing JSON?"  
**Answer:** See CUTOVER_ARCHITECTURE.md section "Issue #3"

**Question:** "What's the database schema?"  
**Answer:** See CUTOVER_ARCHITECTURE.md section "Database Schema Differences"

**Question:** "How do I rollback?"  
**Answer:** See PAYLOAD_CUTOVER_PLAN.md section "Rollback Plan"

**Question:** "What files do I edit?"  
**Answer:** See this document section "Key Files to Edit"

---

## Success Checklist (Final)

Before declaring cutover complete:

- [ ] All 7 fixes implemented
- [ ] Test script passes (10/10 pages)
- [ ] Home page images load correctly
- [ ] Home page story count matches prod
- [ ] No fatal errors in browser console
- [ ] Playwright crawl shows all green
- [ ] Rollback procedure tested in dev
- [ ] Team trained on rollback steps
- [ ] Monitoring/alerting configured
- [ ] Stakeholders notified

---

## Document Maintenance

These documents are current as of **2026-01-12**.

**Update when:**
- Fixes are completed (check off items)
- New issues discovered
- Timeline changes
- Architecture changes

**Version Control:**
All documents in repo:
```
/CUTOVER_SUMMARY.md
/PAYLOAD_CUTOVER_PLAN.md
/CUTOVER_CHECKLIST.md
/QUICK_FIX_SNIPPETS.md
/CUTOVER_ARCHITECTURE.md
/CUTOVER_INDEX.md (this file)
```

---

## Questions?

This is a comprehensive guide, but you may still have questions:

1. Check the relevant document using the hierarchy above
2. Search for keywords (use Ctrl+F in each document)
3. Review the architecture diagrams
4. Ask team lead with document reference

**Example Good Question:**  
"In QUICK_FIX_SNIPPETS.md Fix #3, where exactly do I paste the convertLexicalToHtml method? Before or after formatResult()?"

**Example Bad Question:**  
"How do I fix Schedule?" (Too broad - read the docs first!)

---

**Generated from:** Side-by-side Playwright comparison report (localhost:8080 vs ynotradio.net)  
**Report Date:** 2026-01-12  
**Analysis Complete:** ✅  
**Ready for Implementation:** ✅  

---

*Choose your document and get started!* 🚀
