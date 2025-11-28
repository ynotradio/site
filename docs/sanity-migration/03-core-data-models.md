# Chapter 3: Core Data Models

[← Back to Index](./README.md)

---

## Priority Order

| Priority | Model | Status | Notes |
|----------|-------|--------|-------|
| 1 | Person | ✅ Done | Schema exists at `studio/schemaTypes/person.ts` |
| 2 | DJ | ✅ Done | Schema exists at `studio/schemaTypes/dj.ts` |
| 3 | Artist | 🔲 Todo | New generic content type for bands |
| 4 | Venue | 🔲 Todo | Concert venues (dropdown/create on the fly) |
| 5 | Ad | 🔲 Todo | Simple model |
| 6 | Concert | 🔲 Todo | References Artist and Venue |
| 7 | Music | 🔲 Todo | References Artist |
| 8 | CdOfTheWeek | 🔲 Todo | References Artist, has review text |
| 9 | OnDemand | 🔲 Todo | Audio content, references Artist or DJ |
| 10 | Schedule | 🔲 Todo | References DJ |
| 11 | Content Block | 🔲 Todo | Unified Story + CustomText model |
| 12 | Top11 | 🔲 Todo | Weekly chart, references Artist |
| 13 | MRM Config | 🔲 Todo | Singleton for tournament settings |
| 14 | MRM Match | 🔲 Todo | Tournament brackets, references Artist |
| 15 | YearEndStaffPick | 🔲 Todo | Staff picks content |
| 16 | YearEndPoll | 🔲 Todo | Most complex, many related tables |

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
         ├── OnDemand ─────────────────┤         │
         ├── Top11                      │         │
         └── MRM Match (+ MRM Config)   │         │
                                        │         │
Schedule ───────────────────────────────┘         │
                                                  │
Content Block ────────────────────────────────────┘
```

---

## Legend

| Status | Meaning |
|--------|---------|
| ✅ Done | Schema created and migration complete |
| 🔲 Todo | Not started |
| 🚧 In Progress | Work has begun |
| ⚠️ Blocked | Waiting on dependency |
