# Import Gap Report

**Generated:** 2026-01-25T04:14:30.664Z
**MySQL Source:** local-mysql
**Payload Target:** prod-neon

## Summary

| Metric                | Value  |
| --------------------- | ------ |
| Total MySQL Records   | 5,488  |
| Total Payload Records | 11,677 |
| Total Missing         | 7      |
| Overall Import Rate   | 212.8% |

## Collection Status

| Collection         | MySQL | Payload | Missing | Import Rate |
| ------------------ | ----- | ------- | ------- | ----------- |
| ✅ Posts (Stories) | 3     | 764     | 0       | 25466.7%    |
| ✅ Custom Texts    | 35    | 35      | 0       | 100.0%      |
| 🟡 Songs (Music)   | 5,401 | 5,394   | 7       | 99.9%       |
| ✅ Concerts        | 5     | 4,400   | 0       | 88000.0%    |
| ✅ On Demand       | 0     | 484     | 0       | 100.0%      |
| ✅ CD of the Week  | 0     | 460     | 0       | 100.0%      |
| ✅ Ads (Sponsors)  | 41    | 57      | 0       | 139.0%      |
| ✅ DJs             | 3     | 83      | 0       | 2766.7%     |

## Missing: Posts (Stories)

_Showing up to 3 of 0 missing records_

| Legacy ID | Identifier             | Reason       |
| --------- | ---------------------- | ------------ |
| 786       | Welcome to Y-Not Radio | Not imported |
| 787       | New Music Friday       | Not imported |
| 788       | Win Concert Tickets    | Not imported |

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

_Showing up to 5 of 0 missing records_

| Legacy ID | Identifier                   | Reason       |
| --------- | ---------------------------- | ------------ |
| 4503      | Sample Artist                | Not imported |
| 4504      | Test Band with Special Guest | Not imported |
| 4505      | Demo Group                   | Not imported |
| 4506      | Example Artist               | Not imported |
| 4507      | Another Band                 | Not imported |

## Next Steps

To import missing records, run:

```bash
# Incremental import (recommended)
tsx bin/incremental-import.ts --from prod-mysql --to prod-neon --verbose

# Or reset and reimport specific collections
tsx bin/incremental-import.ts --from prod-mysql --to prod-neon --reset
```
