# Import Gap Report

**Generated:** 2026-01-25T04:33:58.323Z
**MySQL Source:** local-mysql
**Payload Target:** production-db

## Summary

| Metric                | Value  |
| --------------------- | ------ |
| Total MySQL Records   | 10,613 |
| Total Payload Records | 11,677 |
| Total Missing         | 11     |
| Overall Import Rate   | 110.0% |

## Collection Status

| Collection         | MySQL | Payload | Missing | Import Rate |
| ------------------ | ----- | ------- | ------- | ----------- |
| ✅ Posts (Stories) | 649   | 764     | 0       | 117.7%      |
| ✅ Custom Texts    | 35    | 35      | 0       | 100.0%      |
| 🟡 Songs (Music)   | 5,401 | 5,394   | 7       | 99.9%       |
| 🟡 Concerts        | 4,403 | 4,400   | 3       | 99.9%       |
| ✅ On Demand       | 0     | 484     | 0       | 100.0%      |
| ✅ CD of the Week  | 0     | 460     | 0       | 100.0%      |
| ✅ Ads (Sponsors)  | 41    | 57      | 0       | 139.0%      |
| 🟡 DJs             | 84    | 83      | 1       | 98.8%       |

## Missing: Posts (Stories)

_Showing up to 14 of 0 missing records_

| Legacy ID | Identifier                                | Reason       |
| --------- | ----------------------------------------- | ------------ |
| 28        | Surfer Blood Bunker Session               | Not imported |
| 142       | Chairlift Interview                       | Not imported |
| 227       | Atlas Genius MilkBoy Session              | Not imported |
| 243       | Jukebox The Ghost Interview + Performance | Not imported |
| 261       | Win Passion Pit / Joy Formidable Tickets  | Not imported |
| 363       | Y-Not Sessions: Best of 2014              | Not imported |
| 371       | The Districts Valentine's Takeover        | Not imported |
| 397       | Y-Not 5th Anniversary Show                | Not imported |
| 426       | Surfer Blood Radio Takeover               | Not imported |
| 429       | Aussie Unlocked: Best of 2015             | Not imported |
| 540       | Win Cloud Nothings Tickets                | Not imported |
| 585       | Metronomy Radio Takeover                  | Not imported |
| 740       | Text To Win Japanese Breakfast Tickets    | Not imported |
| 774       | Win Portugal. The Man Tickets             | Not imported |

## Missing: Songs (Music)

_Showing up to 7 of 7 missing records_

| Legacy ID | Identifier             | Reason       |
| --------- | ---------------------- | ------------ |
| 460       | Heavy Metal            | Not imported |
| 780       | Wild Palms             | Not imported |
| 1020      | One Girl / One Boy     | Not imported |
| 2039      | Need A Friend          | Not imported |
| 3285      | Serbia Drums           | Not imported |
| 3939      | No Blood               | Not imported |
| 4078      | Storm Around The World | Not imported |

## Missing: Concerts

_Showing up to 3 of 3 missing records_

| Legacy ID | Identifier | Reason       |
| --------- | ---------- | ------------ |
| 419       | !!!        | Not imported |
| 833       | !!!        | Not imported |
| 1075      | !!!        | Not imported |

## Missing: DJs

_Showing up to 1 of 1 missing records_

| Legacy ID | Identifier     | Reason       |
| --------- | -------------- | ------------ |
| 78        | Josh T. Landow | Not imported |

## Next Steps

To import missing records, run:

```bash
# Incremental import (recommended)
tsx bin/incremental-import.ts --from prod-mysql --to production-db --verbose

# Or reset and reimport specific collections
tsx bin/incremental-import.ts --from prod-mysql --to production-db --reset
```
