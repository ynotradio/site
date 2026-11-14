/* eslint-disable no-console */
import type { Payload } from 'payload';

export const SEED_POLL_SLUG = 'yep-2026-seed';
const STAFF_PICKS_YEAR = 2025;

const DAY = 24 * 60 * 60 * 1000;

/** The 12 legacy categories, with the legacy max picks and prize-entry rule. */
const CATEGORIES: {
  slug: string;
  displayName: string;
  categoryType: 'songs' | 'albums' | 'artists' | 'concerts' | 'custom';
  maxPicks: number;
  requiredForContest: boolean;
  nominees: string[];
}[] = [
  {
    slug: 'songs',
    displayName: 'Songs of the Year',
    categoryType: 'songs',
    maxPicks: 20,
    requiredForContest: true,
    nominees: [
      'Wet Leg - catch these fists',
      'Wet Leg - mangetout',
      'Wet Leg - CPR',
      'Nation of Language - Inept Apollo',
      "Fontaines D.C. - It's Amazing To Be Young",
      'Pulp - Spike Island',
      'Deep Sea Diver - SHOVEL',
      'Petey USA - The Milkman',
      'Nine Inch Nails - As Alive As You Need Me To Be',
      'Momma - I Want You (Fever)',
      'Teen Jesus and the Jean Teasers - BALCONY',
      'Indigo De Souza - Heartthrob',
      'Rocket - Take Your Aim',
      'Tunde Adebimpe - Ate The Moon',
      "Garbage - There's No Future In Optimism",
      "Alex Lahey - Don't Wanna Know",
      'OK Go - Take Me With You',
      'Franz Ferdinand - Night Or Day',
      'Japanese Breakfast - Picture Window',
      'Cheekface - Living Lo-Fi',
      'The Wombats - Blood On The Hospital Floor',
      'Water From Your Eyes - Nights in Armor',
      'Sleigh Bells - Badly',
      'Beach Bunny - Tunnel Vision',
      'Dave Hause - Enough Hope',
      'The Beths - Straight Line Was a Lie',
    ],
  },
  {
    slug: 'albums',
    displayName: 'Albums of the Year',
    categoryType: 'albums',
    maxPicks: 10,
    requiredForContest: true,
    nominees: [
      'Wet Leg - moisturizer',
      'Deep Sea Diver - Billboard Heart',
      'Tunde Adebimpe - Thee Black Boltz',
      'Rocket - R Is for Rocket',
      'Petey USA - The Yips',
      'Momma - Welcome to My Blue Sky',
      'Franz Ferdinand - The Human Fear',
      'OK Go - And the Adjacent Possible',
      'Garbage - Let All That We Imagine Be The Light',
      'Teen Jesus and The Jean Teasers - Glory',
      "Guerilla Toss - You're Weird Now",
      'HAIM - I quit',
      'David Byrne - Who Is The Sky?',
    ],
  },
  {
    slug: 'artists',
    displayName: 'Artists of the Year',
    categoryType: 'artists',
    maxPicks: 5,
    requiredForContest: true,
    nominees: [
      'Wet Leg',
      'Deep Sea Diver',
      'Garbage',
      'Franz Ferdinand',
      'Tunde Adebimpe',
      'Momma',
      'Dave Hause',
      'HAIM',
    ],
  },
  {
    slug: 'concerts',
    displayName: 'Concerts of the Year',
    categoryType: 'concerts',
    maxPicks: 2,
    requiredForContest: false,
    nominees: [
      'Wet Leg - The Fillmore Philadelphia',
      'Garbage - The Met Philadelphia',
      'Franz Ferdinand - Franklin Music Hall',
      'Japanese Breakfast - The Mann Center',
    ],
  },
  {
    slug: 'new_artists',
    displayName: 'New Artists of the Year',
    categoryType: 'artists',
    maxPicks: 3,
    requiredForContest: true,
    nominees: ['Petey USA', 'Rocket', 'CROONeR', 'Polaroid Fade', 'Annie DiRusso'],
  },
  {
    slug: 'philly_artists',
    displayName: 'Philly Artists of the Year',
    categoryType: 'artists',
    maxPicks: 5,
    requiredForContest: true,
    nominees: [
      'Japanese Breakfast',
      'Alex G',
      'Mannequin Pussy',
      'Sheer Mag',
      'The War On Drugs',
      'Kurt Vile',
      'Hop Along',
      'Hannah Cohen',
    ],
  },
  {
    slug: 'most_anticipated_albums',
    displayName: 'Most Anticipated Albums of 2027',
    categoryType: 'custom',
    maxPicks: 2,
    requiredForContest: true,
    nominees: ['Arcade Fire', 'Phoebe Bridgers', 'The Strokes', 'Paramore'],
  },
  {
    slug: 'tv_dramas',
    displayName: 'TV Dramas of the Year',
    categoryType: 'custom',
    maxPicks: 3,
    requiredForContest: false,
    nominees: ['Severance', 'The Pitt', 'Andor', 'Slow Horses', 'The White Lotus'],
  },
  {
    slug: 'tv_comedies',
    displayName: 'TV Comedies of the Year',
    categoryType: 'custom',
    maxPicks: 3,
    requiredForContest: false,
    nominees: ['The Studio', 'Hacks', 'Abbott Elementary', 'The Bear', 'What We Do in the Shadows'],
  },
  {
    slug: 'best_movies',
    displayName: 'Best Movies of the Year',
    categoryType: 'custom',
    maxPicks: 3,
    requiredForContest: false,
    nominees: ['Sinners', 'One Battle After Another', 'Weapons', 'Bugonia', 'Marty Supreme'],
  },
  {
    slug: 'worst_movies',
    displayName: 'Worst Movies of the Year',
    categoryType: 'custom',
    maxPicks: 2,
    requiredForContest: false,
    nominees: ['Snow White', 'War of the Worlds', 'Tron: Ares', 'The Electric State'],
  },
  {
    slug: 'unnecessary_sequels',
    displayName: 'Unnecessary Sequels or Reboots',
    categoryType: 'custom',
    maxPicks: 2,
    requiredForContest: false,
    nominees: [
      'Freakier Friday',
      'Happy Gilmore 2',
      'The Naked Gun',
      'I Know What You Did Last Summer',
    ],
  },
];

/** Three real 2025 staff picks, trimmed from the legacy page. */
const STAFF_PICKS = [
  {
    name: 'Josh T. Landow',
    details: 'Owner / Program Director / Host',
    sortOrder: 1,
    mixcloudUrls: 'https://www.mixcloud.com/ynotradio/josh-t-landows-best-of-2025/',
    songsPaste: [
      'Deep Sea Diver "SHOVEL"',
      'Petey USA "The Milkman"',
      'Nine Inch Nails "As Alive As You Need Me To Be"',
      'Momma "I Want You (Fever)"',
      'Wet Leg "CPR"',
    ],
    albumsPaste: [
      'Deep Sea Diver - Billboard Heart',
      'Tunde Adebimpe - Thee Black Boltz',
      'Wet Leg - moisturizer',
    ],
  },
  {
    name: 'Joey O.',
    details: 'Music Director\nThursdays 4-9pm',
    sortOrder: 2,
    mixcloudUrls: 'https://www.mixcloud.com/ynotradio/joey-os-top-20-of-2025/',
    songsPaste: [
      'Wet Leg "Catch These Fists"',
      'Nine Inch Nails "As Alive As You Need Me To Be"',
      'Dave Hause "Enough Hope"',
      'Lady Gaga "Killah"',
      'Garbage "Chinese Fire Horse"',
    ],
    albumsPaste: ['Dave Hause - …and the Mermaid', 'Wet Leg - moisturizer', 'HAIM - I quit'],
  },
  {
    name: 'Hannah',
    showName: 'Y-Not Philly',
    details: 'Mondays 1-5pm\nWednesdays 11am & 10pm',
    sortOrder: 3,
    mixcloudUrls: [
      'https://www.mixcloud.com/ynotradio/hannahs-top-20-of-2025/',
      'https://www.mixcloud.com/ynotradio/y-not-philly-121025/',
    ].join('\n'),
    songsPaste: [
      'Florry "Say Your Prayers Rock"',
      'Kaela "Tender"',
      'quickly, quickly "Drawn Away"',
    ],
    albumsPaste: ['Florry - Sounds Like...', 'Cleo Reed - Cuntry'],
  },
];

const idOf = (doc: { id: number | string }) => (typeof doc.id === 'number' ? doc.id : Number(doc.id));

async function findIdByField(
  payload: Payload,
  collection: 'songs' | 'records' | 'djs',
  field: string,
  value: string,
) {
  const res = await payload.find({
    collection,
    where: { [field]: { equals: value } },
    limit: 1,
    depth: 0,
  });
  return res.docs[0] ? idOf(res.docs[0]) : undefined;
}

/**
 * Seeds an open 2026 Year End Poll (12 categories, real-ish nominees) and a
 * few 2025 staff picks. Safe to re-run: skips the poll if its slug exists and
 * skips staff picks that already exist for the same year and name.
 */
export async function seedYearEndPoll(payload: Payload): Promise<void> {
  console.log('🗳️  Seeding Year End Poll...');

  const existing = await payload.find({
    collection: 'year-end-polls',
    where: { slug: { equals: SEED_POLL_SLUG } },
    limit: 1,
  });
  if (existing.docs.length) {
    console.log(`   ⏭️  Poll "${SEED_POLL_SLUG}" already exists`);
  } else {
    const poll = await payload.create({
      collection: 'year-end-polls',
      data: {
        name: 'Y-Not Year End Poll 2026',
        year: 2026,
        slug: SEED_POLL_SLUG,
        status: 'open',
        votingOpensAt: new Date(Date.now() - DAY).toISOString(),
        votingClosesAt: new Date(Date.now() + 30 * DAY).toISOString(),
        introHtml:
          "<p>As the year winds down, it's time to pick your favorite music, movies, TV and more from 2026! "
          + 'Finish the first six categories to enter our prize drawing.</p>',
        closedHtml:
          '<p>Thanks to everyone who voted! Tune in from December 29th to hear the results in our year-end countdown.</p>',
      },
    });

    const song = await findIdByField(payload, 'songs', 'title', 'Hit Single');
    const record = await findIdByField(payload, 'records', 'title', 'Great Album');

    for (const category of CATEGORIES) {
      const linked = [
        ...(category.slug === 'songs' && song ? [{ song }] : []),
        ...(category.slug === 'albums' && record ? [{ record }] : []),
      ];
      // eslint-disable-next-line no-await-in-loop
      await payload.create({
        collection: 'year-end-poll-categories',
        data: {
          poll: idOf(poll),
          slug: category.slug,
          displayName: category.displayName,
          categoryType: category.categoryType,
          maxPicks: category.maxPicks,
          requiredForContest: category.requiredForContest,
          nominees: linked,
          bulkNominees: category.nominees.join('\n'),
        },
      });
    }
    console.log(`   ✅ Created open poll "${SEED_POLL_SLUG}" with ${CATEGORIES.length} categories`);
  }

  let created = 0;
  for (const pick of STAFF_PICKS) {
    // eslint-disable-next-line no-await-in-loop
    const found = await payload.find({
      collection: 'year-end-staff-picks',
      where: { and: [{ year: { equals: STAFF_PICKS_YEAR } }, { name: { equals: pick.name } }] },
      limit: 1,
    });
    if (found.docs.length) continue; // eslint-disable-line no-continue
    // eslint-disable-next-line no-await-in-loop
    const dj = await findIdByField(payload, 'djs', 'displayName', pick.name);
    // eslint-disable-next-line no-await-in-loop
    await payload.create({
      collection: 'year-end-staff-picks',
      data: {
        ...pick,
        year: STAFF_PICKS_YEAR,
        dj,
        songsPaste: pick.songsPaste.join('\n'),
        albumsPaste: pick.albumsPaste.join('\n'),
      },
    });
    created += 1;
  }
  console.log(`   ✅ Created ${created} ${STAFF_PICKS_YEAR} staff picks`);
}
