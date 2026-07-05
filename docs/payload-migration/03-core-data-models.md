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
| Top 11 Contests                  | `top11-contests`                   | Production | Weekly contest config               |
| Top 11 Contestants               | `top11-contestants`                | Production | Song entries per contest            |
| Top 11 Votes                     | `top11-votes`                      | Production | Auth0-authenticated vote records    |
| Top 11 Write-ins                 | `top11-write-ins`                  | Production | Write-in song nominations           |
| Top 11 Winner Draws              | `top11-winner-draws`               | Production | Weekly winner selection             |
| Year End Polls                   | `year-end-polls`                   | Production | Annual poll config                  |
| Year End Poll Categories         | `year-end-poll-categories`         | Production | Poll categories with nominees       |
| Year End Poll Votes              | `year-end-poll-votes`              | Production | Auth0-authenticated vote records    |

## Not Yet Migrated

None — all collections have been migrated to Payload.

## Editing Policy

Edit production content in Payload for migrated collections. Do not use import scripts as a routine content-sync mechanism.
