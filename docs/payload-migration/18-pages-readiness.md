# Chapter 18: Pages Migration — Content Readiness Plan

[← Back to Index](./README.md)

**Status:** In progress · **Last Updated:** July 2026

---

## Before anything else

**Production's flag is already `true`.** It's harmless today only because the
deployed PHP still reads the old `posts` table. The instant #804 deploys,
`PostgresCustomText.php` swaps to the new `pages` table — with no rollout gate,
since the flag needs no flip. **Merging #804 and deploying it are not the same
action.** A local edit to `.env.php` already sets the flag to `false`, prepared
but undeployed. Deploy that first, separately, before the code deploy — see the
checklist below.

## Status at a glance

9 of 35 pages hand-verified as of this writing.

### Blocking — do not flip the flag with these unresolved

| Page               | Archetype         | Finding                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------------ | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `shows`            | B · directory     | **Total content loss.** 7,422 characters of real source HTML converted to the literal fallback string "(No content available)." This is the specialty-show discovery hub. Likely a caught-and-swallowed conversion exception on the 4-column program-tile table, not a genuine empty page. Worth checking whether other pages hit the same silent path undetected.                                                               |
| `contests`         | E · live giveaway | **Entry form doesn't work.** Two band-logo images (WAAX, The Blackburns) missing entirely from the imported content — absent at the data level, not a render issue. The Google Form embed points at the bare `viewform` URL instead of `viewform?embedded=true`, and renders at a fixed 152px instead of the ~1,000px the form needs. A real person trying to enter this giveaway today would see what looks like a broken page. |
| `y-not-contests-2` | E · live giveaway | Same Google Form bug as `contests`, confirmed independently — this is a **systemic pattern**, not a one-off. Any page with a Google Forms embed will fail the same way. Fixing the embed handler once (recognize `forms.google.com`/`docs.google.com/forms`, append `embedded=true`, use a tall fixed height) resolves both pages at once.                                                                                       |

### Known gaps — acceptable to ship with a committed fix-forward

| Page                             | Archetype           | Finding                                                                                                                                                                                                                                                                             |
| -------------------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `y100-rocks`                     | D · retrospective   | All content present — title, banner, intro text, all 26 DJ names. Renders as a single column locally vs. prod's 2-column grid. Layout-only. The "Philadelphiaâ??s" mojibake is confirmed pre-existing in production, not a regression — not worth fixing as part of this migration. |
| `t-shirts`                       | E · merch           | All 15 shirt colors and labels present. Prod shows a 4-column grid of color-accurate product photos; local stacks them in one column, and every swatch shows the same generic black shirt rather than its actual color. Presentation gap, not data loss.                            |
| `modern-rock-madness`            | E · tournament stub | Text content matches prod exactly. Missing the title banner image and the bracket-download graphic. Lower priority — the live tournament experience already lives in Payload separately via `modern-rock-madness-draft`.                                                            |
| `dollar-stroll-raffle-contest-1` | E · live giveaway   | Working as designed, not a bug: the PayPal Smart Buttons block correctly renders nothing without `PAYPAL_SMART_BUTTON_CLIENT_ID` set. This is a deploy-config item, not a code fix — confirm the env var is set wherever this ships.                                                |

### Verified safe

- `future-friday` (D) — table-striping fix (shipped in #804) closed most of the gap. Remaining diff is dense-table layout drift, expected and documented.
- `rodney-anonymous` (A) — 143 Mixcloud embeds render correctly once given a realistic load timeout. Confirmed clean across repeated samples.
- `words-with-nerds` (D) — confirmed clean. Earlier high-diff readings were the local dev environment's known Neon connection flakiness, not real content loss.
- `quarantine-takeovers` (A) — all 35 embeds present and correctly rendered. Legacy `www.mixcloud.com/widget/iframe/` URL fix (shipped in #804) resolved this one.
- `y100-20-years-gone` (D) — confirmed clean, stable across every sample, effectively pixel-identical to prod.
- `player-test` (E) — Live365 widget present and correct; a screenshot timing difference in interactive-control rendering, not a content gap.

### Diffed but not yet hand-verified — 26 pages

These have an automated pixel-diff score but no human eyes confirming what the diff actually shows.

| Group             | Pages                                               | Diff range | Read                                                                                                                                                                                                           |
| ----------------- | --------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Year-end rankings | `top220–225of20XX`                                  | 42–44%     | Stable, tight cluster — consistent with expected dense-table layout drift (Archetype C), already an open design question about graduating to a dedicated collection. Lower priority to re-verify individually. |
| Year-end polls    | `yearendpoll20XX`                                   | 48–57%     | Same story as rankings — same archetype, same expected structural drift.                                                                                                                                       |
| Session recaps    | `ynotsessions20XX`                                  | 27–31%     | Tightest, lowest-variance cluster of the whole set. Good sign; still unverified by eye.                                                                                                                        |
| Remaining singles | `donate`, `top1000`, `remembering-starla`, `shows`* | 20–33%     | Lower diff scores but not yet eye-checked — `shows` is the reminder that a moderate-looking score can hide total failure if the diff lands on whitespace rather than missing content.                          |

## Before flipping the flag in production

1. **Deploy the flag flip first, separately.** Push `.env.php`'s
   `USE_POSTGRES_CUSTOMTEXT=false` to production on its own, before merging any
   Pages code that depends on it. Decouples "ship the code" from "cut prod
   traffic over to it" — restores the rollout gate the flag was designed to
   provide.
2. **Fix the Google Form embed handler once.** Recognize `forms.google.com` /
   `docs.google.com/forms`, append `embedded=true`, use a tall fixed height
   instead of 152px. Resolves both `contests` and `y-not-contests-2` in a
   single change — confirmed systemic, not isolated.
3. **Find why `shows` collapsed to empty.** Check whether the converter is
   catching and swallowing an exception on this page's 4-column table
   structure. If it's a silent-failure path, other pages may be hitting it too
   without anyone noticing yet.
4. **Recover the two missing images on `contests`.** The WAAX and Blackburns
   band-logo graphics aren't in the imported content at all. Confirms whether
   the image-drop is the same root cause as `shows`'s content loss, or a
   separate bug.
5. **Write the golden-fixture regression test.** Run the real converter
   against the real 35 rows of legacy HTML; fail if any page produces the
   empty-content fallback or an output far smaller than its input. The single
   test that would have caught two of the bugs above before manual audit found
   them.
6. **Confirm `PAYPAL_SMART_BUTTON_CLIENT_ID` is set wherever this deploys.**
   `dollar-stroll-raffle-contest-1`'s checkout silently renders nothing without
   it — by design, but easy to forget at deploy time.
7. **Hand-verify the remaining 26 pages**, prioritizing anything with a live
   form, ticket link, or button over the year-end ranking/poll cluster.
   Diff-score clustering can hide a total failure behind a plausible-looking
   percentage, as `shows` demonstrates.

---

Compiled from a visual-diff audit of the 35 imported custom-text pages; #804 is
green and mergeable, production deploy sequencing is the open item.
