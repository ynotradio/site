#!/usr/bin/env tsx
/**
 * Read-only inspection of Top 11 data on production Postgres.
 *
 * Lists every Top11Contests row, flags which one matches the contest
 * currently live on ynotradio.net/top11, and reports row counts per
 * related collection (Contestants, Votes, WriteIns, WinnerDraws) per
 * contest. Prints a cleanup plan. Deletes nothing.
 *
 * Usage:
 *   YES_I_MEAN_PROD=true yarn tsx --import ./bin/preload-nextenv-fix.mjs \
 *     bin/migrations/inspectTop11Prod.ts
 */

import { getPayloadClient } from './shared/payloadClient';

const LIVE_CONTEST_DATE = 'July 2, 2026';
const LIVE_SONGS = [
  'Yip Yip Yow',
  'Chance To Bleed',
  'Sun Has Set',
  'G.O.D. And The Broken Ribs',
  'Switch Up',
  'Burning Out',
  'A Good Day for Dying',
  'Call It In',
  'Going Shopping',
  'Violins*',
  'Hot Slob',
];

async function main() {
  const payload = await getPayloadClient('prod-neon');

  const contests = await payload.find({
    collection: 'top11-contests',
    limit: 1000,
    depth: 1,
  });

  console.log(`\nFound ${contests.totalDocs} Top11Contests rows on production.\n`);

  for (const contest of contests.docs) {
    const entries = Array.isArray((contest as any).entries) ? (contest as any).entries : [];
    const entrySongTitles = entries
      .map((e: any) => (typeof e.song === 'object' ? e.song?.title : e.song))
      .filter(Boolean);

    const matchCount = entrySongTitles.filter((title: string) =>
      LIVE_SONGS.some((liveSong) => title?.includes(liveSong.replace('*', ''))),
    ).length;

    const isLikelyLive = matchCount >= 8;

    const [contestants, votes, writeIns, winnerDraws] = await Promise.all([
      payload.find({
        collection: 'top11-contestants',
        where: { contest: { equals: contest.id } },
        limit: 0,
      }),
      payload.find({
        collection: 'top11-votes',
        where: { contest: { equals: contest.id } },
        limit: 0,
      }),
      payload.find({
        collection: 'top11-write-ins',
        where: { contest: { equals: contest.id } },
        limit: 0,
      }),
      payload.find({
        collection: 'top11-winner-draws',
        where: { contest: { equals: contest.id } },
        limit: 0,
      }),
    ]);

    console.log(
      `Contest id=${contest.id} status=${(contest as any).status} ` +
        `entries=${entries.length} matchedLiveSongs=${matchCount}/11 ` +
        `${isLikelyLive ? `<-- LIKELY THE LIVE CONTEST (${LIVE_CONTEST_DATE})` : ''}`,
    );
    console.log(
      `  contestants=${contestants.totalDocs} votes=${votes.totalDocs} ` +
        `writeIns=${writeIns.totalDocs} winnerDraws=${winnerDraws.totalDocs}`,
    );

    if (process.env.VERBOSE === 'true') {
      const mask = (value: unknown) => {
        const str = String(value ?? '');
        if (!str) return '(empty)';
        return str.length <= 4 ? '*'.repeat(str.length) : `${str.slice(0, 2)}***${str.slice(-2)}`;
      };
      const qaLike = (value: unknown) => /^qa-test/i.test(String(value ?? ''));

      console.log(`  entry songs: ${entrySongTitles.join(' | ')}`);
      console.log(
        `  contestant emails (masked): ${contestants.docs
          .map((c: any) => `${mask(c.email)}${qaLike(c.email) ? '[QA]' : ''}`)
          .join(', ')}`,
      );
      console.log(
        `  voter emails/keys (masked): ${votes.docs
          .map((v: any) => {
            const raw = v.voterEmail || v.voterKey || v.voterUserId;
            return `${mask(raw)}${qaLike(raw) ? '[QA]' : ''}`;
          })
          .join(', ')}`,
      );
      console.log(`  write-ins: ${writeIns.docs.map((w: any) => w.writeIn).join(' | ')}`);
    }
  }

  console.log('\nNo data was modified. Review the output above before writing a cleanup script.\n');

  process.exit(0);
}

main().catch((error) => {
  console.error('Inspection failed:', error);
  process.exit(1);
});
