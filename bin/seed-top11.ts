/* eslint-disable no-console */
import { getPayloadHMR } from '@payloadcms/next/utilities';
import config from '@payload-config';

/**
 * Seed a realistic Top 11 contest into the Payload database for demos/dev.
 *
 * Usage: yarn seed:top11
 *
 * Recreates the week-of 2026-06-25 chart (status: open) with its 11 real
 * entries, plus a handful of votes, write-ins, and a contestant so the
 * Contest Controls results/winner-draw UI has something to show.
 *
 * Idempotent: skips if a contest for weekOf 2026-06-25 already exists.
 */

const WEEK_OF = '2026-06-25T00:00:00.000Z';

const CHART: Array<{ artist: string; title: string; artistUrl?: string }> = [
  { artist: 'Kurt Vile', title: 'Chance to Bleed', artistUrl: 'http://kurtvile.com/' },
  {
    artist: 'The Bug Club',
    title: 'A Good Day for Dying',
    artistUrl: 'https://thebugclub.bandcamp.com/album/very-human-features',
  },
  {
    artist: 'Caroline Rose',
    title: 'Yip Yip Yow',
    artistUrl: 'https://www.carolinerosemusic.com/',
  },
  {
    artist: 'Blondshell',
    title: 'Heart Has To Work So Hard',
    artistUrl: 'https://www.blondshellmusic.com/',
  },
  { artist: 'Mike D', title: 'Switch Up' },
  {
    artist: 'Death Cab For Cutie',
    title: 'Stone Over Water',
    artistUrl: 'http://www.deathcabforcutie.com/',
  },
  { artist: 'Metric', title: 'Time Is A Bomb', artistUrl: 'http://ilovemetric.com/' },
  { artist: 'Interpol', title: 'See Out Loud', artistUrl: 'http://interpolnyc.com/' },
  {
    artist: 'The Last Dinner Party',
    title: 'Big Dog',
    artistUrl: 'https://www.thelastdinnerparty.co.uk/',
  },
  { artist: 'Ratboys', title: "What's Right", artistUrl: 'http://ratboysband.com/' },
  { artist: 'Snail Mail', title: 'Tractor Beam', artistUrl: 'https://www.snailmail.band/' },
];

const WRITE_INS = ['Free Bird', 'Free Bird', 'Stairway to Heaven'];

async function findOrCreateArtist(
  payload: Awaited<ReturnType<typeof getPayloadHMR>>,
  name: string,
  url?: string,
): Promise<number> {
  const existing = await payload.find({
    collection: 'artists',
    where: { name: { equals: name } },
    limit: 1,
  });
  if (existing.docs.length > 0) {
    return existing.docs[0].id as number;
  }
  const created = await payload.create({
    collection: 'artists',
    data: { name, website: url },
  });
  return created.id as number;
}

async function findOrCreateSong(
  payload: Awaited<ReturnType<typeof getPayloadHMR>>,
  title: string,
  artistId: number,
): Promise<number> {
  const existing = await payload.find({
    collection: 'songs',
    where: { and: [{ title: { equals: title } }, { artist: { equals: artistId } }] },
    limit: 1,
  });
  if (existing.docs.length > 0) {
    return existing.docs[0].id as number;
  }
  const created = await payload.create({
    collection: 'songs',
    data: { title, artist: artistId },
  });
  return created.id as number;
}

async function seedTop11() {
  console.log('🎵 Seeding Top 11 demo contest (week of 2026-06-25)...\n');

  const payload = await getPayloadHMR({ config });

  try {
    const existing = await payload.find({
      collection: 'top11-contests',
      where: { weekOf: { equals: WEEK_OF } },
      limit: 1,
    });

    if (existing.docs.length > 0) {
      console.log('⏭️  A Top 11 contest for week of 2026-06-25 already exists. Skipping.');
      console.log(`   Contest id: ${existing.docs[0].id}`);
      process.exit(0);
    }

    const existingAdmin = await payload.find({
      collection: 'users',
      where: { email: { equals: process.env.PAYLOAD_DEV_EMAIL || 'admin@ynotradio.net' } },
      limit: 1,
    });
    if (existingAdmin.docs.length === 0) {
      console.log('👤 Creating admin user...');
      await payload.create({
        collection: 'users',
        data: {
          email: process.env.PAYLOAD_DEV_EMAIL || 'admin@ynotradio.net',
          password: process.env.PAYLOAD_DEV_PASSWORD || 'password',
          role: 'admin',
          _verified: true,
        },
      });
      console.log('   ✅ Admin user created');
    }

    console.log('🎸 Resolving artists and songs...');
    const songIds: number[] = [];
    /* eslint-disable no-await-in-loop */
    for (const entry of CHART) {
      const artistId = await findOrCreateArtist(payload, entry.artist, entry.artistUrl);
      const songId = await findOrCreateSong(payload, entry.title, artistId);
      songIds.push(songId);
    }
    /* eslint-enable no-await-in-loop */
    console.log(`   ✅ Resolved ${songIds.length} songs`);

    console.log('🏆 Creating contest (status: open)...');
    const contest = await payload.create({
      collection: 'top11-contests',
      data: {
        weekOf: WEEK_OF,
        status: 'open',
        votingOpensAt: WEEK_OF,
        entries: songIds.map((song) => ({ song })),
      },
    });
    const contestId = contest.id as number;
    console.log(`   ✅ Contest created (id=${contestId})`);

    console.log('🗳️  Casting sample votes...');
    /* eslint-disable no-await-in-loop */
    for (let i = 0; i < songIds.length; i += 1) {
      // Front-loaded distribution so the leaderboard has a clear order.
      const voteCount = songIds.length - i;
      for (let v = 0; v < voteCount; v += 1) {
        await payload.create({
          collection: 'top11-votes',
          data: {
            contest: contestId,
            song: songIds[i],
            voterEmail: `demo-voter-${i}-${v}@example.com`,
          },
        });
      }
    }
    /* eslint-enable no-await-in-loop */
    console.log('   ✅ Votes cast');

    console.log('✍️  Adding write-ins...');
    /* eslint-disable no-await-in-loop */
    for (const writeIn of WRITE_INS) {
      await payload.create({
        collection: 'top11-write-ins',
        data: { contest: contestId, writeIn, voterEmail: 'demo-writein@example.com' },
      });
    }
    /* eslint-enable no-await-in-loop */
    console.log(`   ✅ Added ${WRITE_INS.length} write-ins`);

    console.log('🙋 Adding a sample contestant entry...');
    await payload.create({
      collection: 'top11-contestants',
      data: {
        contest: contestId,
        firstName: 'Jamie',
        lastName: 'Demo',
        email: 'jamie.demo@example.com',
        enteredContest: true,
        newsletterOptIn: true,
      },
    });
    console.log('   ✅ Contestant added');

    console.log('\n✅ Top 11 demo contest seeded successfully!\n');
    console.log('📊 Summary:');
    console.log(`   Contest: week of 2026-06-25 (open), id=${contestId}`);
    console.log(`   Entries: ${songIds.length} songs`);
    console.log(`   Votes: ${songIds.reduce((sum, _s, i) => sum + (songIds.length - i), 0)}`);
    console.log(`   Write-ins: ${WRITE_INS.length}`);
    console.log('   Contestants: 1');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding Top 11 demo data:', error);
    process.exit(1);
  }
}

seedTop11();
