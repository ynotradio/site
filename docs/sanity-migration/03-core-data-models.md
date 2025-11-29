# Chapter 3: Core Data Models

[← Back to Index](./README.md)

---

## Priority Order

| Priority | Model | Status | Notes |
|----------|-------|--------|-------|
| 1 | Person | ✅ Done | Schema exists at `studio/schemaTypes/person.ts` |
| 2 | DJ | ✅ Done | Schema exists at `studio/schemaTypes/dj.ts` |
| 3 | Artist | ✅ Done | Schema exists at `studio/schemaTypes/artist.ts`, validated and working |
| 4 | Venue | 🔲 Todo | Concert venues (dropdown/create on the fly) |
| 5 | Ad | 🔲 Todo | Simple model |
| 6 | Concert | 🔲 Todo | References Artist and Venue |
| 7 | Music | 🔲 Todo | References Artist |
| 8 | CdOfTheWeek | 🔲 Todo | References Artist, has review text |
| 9 | OnDemand | 🔲 Todo | Audio content, references Artist or DJ |
| 10 | Schedule | 🔲 Todo | References DJ |
| — | Content Block | ⏸️ Later | Unified Story + CustomText model (deferred) |
| — | Top11 | ⏸️ Later | Weekly chart, references Artist (deferred) |
| — | MRM Config | ⏸️ Later | Singleton for tournament settings (deferred) |
| — | MRM Match | ⏸️ Later | Tournament brackets, references Artist (deferred) |
| — | YearEndStaffPick | ⏸️ Later | Staff picks content (deferred) |
| — | YearEndPoll | ⏸️ Later | Most complex, many related tables (deferred) |

---

## Dependencies

```
Person ──────────────────────────────────────────┐
   │                                              │
   └─→ DJ ←────────────────────────────┐         │
                                        │         │
Artist ←─┬── Concert (+ Venue)          │         │
         ├── Music                      │         │
         ├── CdOfTheWeek               │         │
         └── OnDemand ─────────────────┤         │
                                        │         │
Schedule ───────────────────────────────┘         │
```

---

## Legend

| Status | Meaning |
|--------|---------|
| ✅ Done | Schema created and migration complete |
| 🔲 Todo | Not started |
| 🚧 In Progress | Work has begun |
| ⚠️ Blocked | Waiting on dependency |
| ⏸️ Later | Deferred to future PR |
