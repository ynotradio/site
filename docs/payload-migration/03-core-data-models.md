# Core Data Models

[Back to Index](./README.md)

## Payload Collections

| Collection                       | Slug                               | Status     | Notes                               |
| -------------------------------- | ---------------------------------- | ---------- | ----------------------------------- |
| Ads                              | `ads`                              | Production | Sponsor ads                         |
| Artists                          | `artists`                          | Production | MusicBrainz-aware artist records    |
| CD of the Week                   | `cdoftheweek`                      | Production | Album reviews linked to Records     |
| Concerts                         | `concerts`                         | Production | Events linked to Artists and Venues |
| DJs                              | `djs`                              | Production | Host records linked to People       |
| Media                            | `media`                            | Production | Cloudinary-backed uploads           |
| On Demand                        | `ondemand`                         | Production | Audio content                       |
| People                           | `people`                           | Production | Shared person records               |
| Posts                            | `posts`                            | Production | Stories and custom text             |
| Records                          | `records`                          | Production | Album/catalog records               |
| Shows                            | `shows`                            | Production | Schedule entries                    |
| Songs                            | `songs`                            | Production | Track/catalog records               |
| Users                            | `users`                            | Production | Payload auth                        |
| Venues                           | `venues`                           | Production | Concert venues                      |
| Year End Poll Results            | `year-end-poll-results`            | Production | Published results display data only |
| Modern Rock Madness Tournaments  | `modern-rock-madness-tournaments`  | Production | Tournament config                   |
| Modern Rock Madness Groups       | `modern-rock-madness-groups`       | Production | Tournament participants             |
| Modern Rock Madness Matches      | `modern-rock-madness-matches`      | Production | Bracket matchups                    |
| Modern Rock Madness Votes        | `modern-rock-madness-votes`        | Production | Vote records                        |
| Modern Rock Madness Match Events | `modern-rock-madness-match-events` | Production | Audit log                           |

## Not Yet Migrated

| Area                       | Current Source     | Notes                                         |
| -------------------------- | ------------------ | --------------------------------------------- |
| Top 11                     | Legacy MySQL/admin | Needs requirements and Payload model          |
| Year End Poll voting/admin | Legacy MySQL/admin | Results display exists, voting/admin does not |
| Staff Picks                | Legacy MySQL/admin | Not ready for Payload                         |

## Editing Policy

Edit production content in Payload for migrated collections. Do not use import scripts as a routine content-sync mechanism.
