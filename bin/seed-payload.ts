/* eslint-disable no-console */
import { getPayloadHMR } from '@payloadcms/next/utilities';
import config from '@payload-config';

/**
 * Seed Payload database with sample data for testing
 *
 * Usage: yarn tsx bin/seed-payload.ts
 *
 * Creates sample data for:
 * - People (DJs, Artists)
 * - Venues
 * - Concerts
 * - Posts (stories)
 * - Shows
 * - Songs, Records, Artists
 */

async function seed() {
  console.log('🌱 Seeding Payload database with sample data...\n');

  const payload = await getPayloadHMR({ config });

  try {
    // Check if already seeded (skip if People collection has data)
    const existingPeople = await payload.find({
      collection: 'people',
      limit: 1,
    });

    if (existingPeople.docs.length > 0) {
      console.log('⏭️  Database already has data. Skipping seed.');
      console.log('   To re-seed, first clear existing data or drop the database.');
      process.exit(0);
    }

    console.log('🗑️  Database is empty, proceeding with seed...');

    // Create admin user for development
    console.log('👤 Creating admin user...');

    const existingAdmin = await payload.find({
      collection: 'users',
      where: {
        email: {
          equals: process.env.PAYLOAD_DEV_EMAIL || 'admin@ynotradio.net',
        },
      },
      limit: 1,
    });

    if (existingAdmin.docs.length === 0) {
      await payload.create({
        collection: 'users',
        data: {
          email: process.env.PAYLOAD_DEV_EMAIL || 'admin@ynotradio.net',
          password: process.env.PAYLOAD_DEV_PASSWORD || 'password',
          role: 'admin',
          _verified: true, // Skip email verification for dev/test environments
        },
      });
      console.log(
        `   ✅ Created admin user: ${process.env.PAYLOAD_DEV_EMAIL || 'admin@ynotradio.net'}`,
      );
    } else {
      console.log('   ⏭️  Admin user already exists');
    }

    // Create sample People (DJs and Artists)
    console.log('👤 Creating sample people...');

    const dj1 = await payload.create({
      collection: 'people',
      data: {
        name: 'Josh T. Landow',
        slug: 'josh-t-landow',
        email: 'josh@ynotradio.net',
        role: 'dj',
        bio: 'Host of Top 11 @ 11 and Future Fridays',
        website: 'http://www.facebook.com/josh.t.landow.1',
        priority: 1,
        active: true,
      },
    });

    const dj2 = await payload.create({
      collection: 'people',
      data: {
        name: 'Test DJ',
        slug: 'test-dj',
        email: 'test@ynotradio.net',
        role: 'dj',
        bio: 'Sample DJ for testing',
        priority: 2,
        active: true,
      },
    });

    const artist1 = await payload.create({
      collection: 'people',
      data: {
        name: 'Sample Artist',
        slug: 'sample-artist',
        role: 'artist',
        bio: 'Indie rock artist from Philadelphia',
        website: 'https://sampleartist.com',
        active: true,
      },
    });

    console.log(`   ✅ Created ${dj1.name}, ${dj2.name}, ${artist1.name}`);

    // Create sample Venues
    console.log('🏢 Creating sample venues...');

    const venue1 = await payload.create({
      collection: 'venues',
      data: {
        name: 'The Foundry',
        slug: 'the-foundry',
        city: 'Philadelphia',
        state: 'PA',
        website: 'https://www.thefoundry.com',
      },
    });

    const venue2 = await payload.create({
      collection: 'venues',
      data: {
        name: 'Union Transfer',
        slug: 'union-transfer',
        city: 'Philadelphia',
        state: 'PA',
        website: 'https://www.utphilly.com',
      },
    });

    const venue3 = await payload.create({
      collection: 'venues',
      data: {
        name: 'World Cafe Live',
        slug: 'world-cafe-live',
        city: 'Philadelphia',
        state: 'PA',
        website: 'https://www.worldcafelive.com',
      },
    });

    console.log(`   ✅ Created ${venue1.name}, ${venue2.name}, ${venue3.name}`);

    // Create sample Artists (for music collections)
    console.log('🎸 Creating sample artists...');

    const musicArtist1 = await payload.create({
      collection: 'artists',
      data: {
        name: 'Sample Band',
        slug: 'sample-band',
        website: 'https://sampleband.com',
        spotifyUrl: 'https://open.spotify.com/artist/example',
      },
    });

    const musicArtist2 = await payload.create({
      collection: 'artists',
      data: {
        name: 'Test Group',
        slug: 'test-group',
        website: 'https://testgroup.com',
      },
    });

    console.log(`   ✅ Created ${musicArtist1.name}, ${musicArtist2.name}`);

    // Create sample Records
    console.log('💿 Creating sample records...');

    const record1 = await payload.create({
      collection: 'records',
      data: {
        title: 'Great Album',
        artist: musicArtist1.id,
        releaseYear: 2025,
        label: 'Independent Records',
        spotifyUrl: 'https://open.spotify.com/album/example1',
      },
    });

    const record2 = await payload.create({
      collection: 'records',
      data: {
        title: 'Awesome LP',
        artist: musicArtist2.id,
        releaseYear: 2026,
        label: 'Test Label',
      },
    });

    console.log(`   ✅ Created "${record1.title}", "${record2.title}"`);

    // Create sample Songs
    console.log('🎵 Creating sample songs...');

    const song1 = await payload.create({
      collection: 'songs',
      data: {
        title: 'Hit Single',
        artist: musicArtist1.id,
        record: record1.id,
        spotifyUrl: 'https://open.spotify.com/track/example1',
      },
    });

    const song2 = await payload.create({
      collection: 'songs',
      data: {
        title: 'Deep Cut',
        artist: musicArtist1.id,
        record: record1.id,
      },
    });

    const song3 = await payload.create({
      collection: 'songs',
      data: {
        title: 'Radio Friendly',
        artist: musicArtist2.id,
        record: record2.id,
      },
    });

    console.log(`   ✅ Created "${song1.title}", "${song2.title}", "${song3.title}"`);

    // Create sample Concerts
    console.log('🎤 Creating sample concerts...');

    const futureDate1 = new Date();
    futureDate1.setDate(futureDate1.getDate() + 30);

    const futureDate2 = new Date();
    futureDate2.setDate(futureDate2.getDate() + 45);

    const futureDate3 = new Date();
    futureDate3.setDate(futureDate3.getDate() + 60);

    await payload.create({
      collection: 'concerts',
      data: {
        date: futureDate1.toISOString(),
        artists: [
          typeof musicArtist1.id === 'number' ? musicArtist1.id : parseInt(musicArtist1.id, 10),
        ],
        venue: typeof venue1.id === 'number' ? venue1.id : parseInt(venue1.id, 10),
        ticketUrl: 'https://ticketmaster.com/example1',
        featured: true,
      },
    });

    await payload.create({
      collection: 'concerts',
      data: {
        date: futureDate2.toISOString(),
        artists: [
          typeof musicArtist1.id === 'number' ? musicArtist1.id : parseInt(musicArtist1.id, 10),
        ],
        venue: typeof venue2.id === 'number' ? venue2.id : parseInt(venue2.id, 10),
        ticketUrl: 'https://ticketmaster.com/example2',
        featured: false,
      },
    });

    await payload.create({
      collection: 'concerts',
      data: {
        date: futureDate3.toISOString(),
        artists: [
          typeof musicArtist1.id === 'number' ? musicArtist1.id : parseInt(musicArtist1.id, 10),
          typeof musicArtist2.id === 'number' ? musicArtist2.id : parseInt(musicArtist2.id, 10),
        ],
        venue: typeof venue3.id === 'number' ? venue3.id : parseInt(venue3.id, 10),
        ticketUrl: 'https://worldcafelive.com/events',
        featured: true,
      },
    });

    console.log('   ✅ Created 3 concerts');

    // Create sample Posts (stories)
    console.log('📝 Creating sample posts...');

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 90); // Active for 90 days

    const post1 = await payload.create({
      collection: 'posts',
      data: {
        headline: 'Welcome to Y-Not Radio',
        content: {
          root: {
            type: 'root',
            children: [
              {
                type: 'paragraph',
                children: [
                  {
                    type: 'text',
                    text: 'Y-Not Radio is an independent online radio station playing the best in indie rock, alternative, and college radio. Tune in 24/7 for new music discoveries and deep cuts from your favorite artists.',
                  },
                ],
              },
            ],
          },
        },
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        priority: 1,
        showOnFrontPage: true,
        _status: 'published',
      },
    });

    const post2 = await payload.create({
      collection: 'posts',
      data: {
        headline: 'New Music Friday',
        content: {
          root: {
            type: 'root',
            children: [
              {
                type: 'paragraph',
                children: [
                  {
                    type: 'text',
                    text: 'Check out the latest releases from Sample Band and Test Group. New albums spinning all day!',
                  },
                ],
              },
            ],
          },
        },
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        priority: 2,
        showOnFrontPage: true,
        _status: 'published',
      },
    });

    const post3 = await payload.create({
      collection: 'posts',
      data: {
        headline: 'Win Concert Tickets',
        content: {
          root: {
            type: 'root',
            children: [
              {
                type: 'paragraph',
                children: [
                  {
                    type: 'text',
                    text: 'Enter for your chance to win tickets to see Sample Band at The Foundry next month!',
                  },
                ],
              },
            ],
          },
        },
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        priority: 3,
        showOnFrontPage: true,
        _status: 'published',
      },
    });

    console.log(`   ✅ Created "${post1.headline}", "${post2.headline}", "${post3.headline}"`);

    // Create sample DJs first (for Shows)
    console.log('🎧 Creating sample DJs...');

    const djRecord1 = await payload.create({
      collection: 'djs',
      data: {
        person: [typeof dj1.id === 'number' ? dj1.id : parseInt(dj1.id, 10)],
        description: {
          root: {
            type: 'root',
            children: [
              {
                type: 'paragraph',
                children: [
                  {
                    type: 'text',
                    text: 'Host of Top 11 @ 11 and Future Fridays',
                  },
                ],
              },
            ],
          },
        },
        onAir: true,
      },
    });

    const djRecord2 = await payload.create({
      collection: 'djs',
      data: {
        person: [typeof dj2.id === 'number' ? dj2.id : parseInt(dj2.id, 10)],
        description: {
          root: {
            type: 'root',
            children: [
              {
                type: 'paragraph',
                children: [
                  {
                    type: 'text',
                    text: 'Indie rock DJ playing the best new and classic alternative music',
                  },
                ],
              },
            ],
          },
        },
        onAir: true,
      },
    });

    console.log('   ✅ Created 2 DJ records');

    // Create sample Shows
    console.log('📻 Creating sample shows...');

    const showDate1 = new Date();
    showDate1.setDate(showDate1.getDate() + 7);
    showDate1.setUTCHours(12, 0, 0, 0); // noon UTC to match Payload dayOnly picker normalization

    const showDate2 = new Date();
    showDate2.setDate(showDate2.getDate() + 8);
    showDate2.setUTCHours(12, 0, 0, 0); // noon UTC to match Payload dayOnly picker normalization

    await payload.create({
      collection: 'shows',
      data: {
        date: showDate1.toISOString(),
        day: 'friday',
        startTime: '11:00',
        endTime: '13:00',
        host: typeof djRecord1.id === 'number' ? djRecord1.id : parseInt(djRecord1.id, 10),
        note: 'Top 11 @ 11 countdown show',
      },
    });

    await payload.create({
      collection: 'shows',
      data: {
        date: showDate2.toISOString(),
        day: 'monday',
        startTime: '13:00',
        endTime: '17:00',
        host: typeof djRecord2.id === 'number' ? djRecord2.id : parseInt(djRecord2.id, 10),
        note: 'Indie Rock Hour',
      },
    });

    console.log('   ✅ Created 2 shows');

    // ── Modern Rock Madness 2025 ─────────────────────────────────────────────
    // Full 64-band, 63-match tournament sourced from ynot_db.sql (mrm_bands,
    // mrm_matches, mrm_matches_flow). R.E.M. defeated Yeah Yeah Yeahs 27–26
    // in the Championship to claim the 2025 crown.
    // ─────────────────────────────────────────────────────────────────────────
    console.log('🏆 Creating Modern Rock Madness 2025 tournament (64 bands, 63 matches)...');

    const tournament = await payload.create({
      collection: 'modern-rock-madness-tournaments',
      data: {
        name: 'Modern Rock Madness 2025',
        year: 2025,
        startDate: '2025-03-24T00:00:00.000Z',
        status: 'complete',
        bracketPdfUrl: 'https://od.lk/d/219145587_ruE6q/MRM2025Bracket.pdf',
      },
    });

    console.log(`   ✅ Created tournament: ${tournament.name}`);

    const tournamentId = typeof tournament.id === 'number' ? tournament.id : parseInt(tournament.id, 10);

    // ── 64 groups from ynot_db.sql `mrm_bands` ───────────────────────────────
    // Artists can be linked after migration; name is used as display override.
    // Columns: id (legacy), name, url, placement (1–64), seed (1–16), abbreviation, sponsor
    const mrmBands = [
      {
        id: 1,
        name: 'Japanese Breakfast',
        url: 'http://japanesebreakfast.rocks/',
        placement: 1,
        seed: 1,
        abbreviation: 'JBrekie',
        sponsor: 'Dave Mooney',
      },
      {
        id: 2,
        name: 'Charly Bliss',
        url: 'https://charlybliss.os.fan/',
        placement: 2,
        seed: 16,
        abbreviation: 'ChlyBls',
        sponsor: 'Wendy Kessler',
      },
      {
        id: 3,
        name: 'The Wombats',
        url: 'https://www.thewombats.co.uk/',
        placement: 3,
        seed: 8,
        abbreviation: 'Wombats',
        sponsor: 'David Cohen',
      },
      {
        id: 4,
        name: 'Japandroids',
        url: 'https://japandroids.com/',
        placement: 4,
        seed: 9,
        abbreviation: 'Jpndrds',
        sponsor: 'Vincent Smith',
      },
      {
        id: 5,
        name: 'The Clash',
        url: 'https://www.theclash.com/',
        placement: 5,
        seed: 5,
        abbreviation: 'Clash',
        sponsor: 'Vincent Smith',
      },
      {
        id: 6,
        name: 'Cake',
        url: 'https://www.cakemusic.com/',
        placement: 6,
        seed: 12,
        abbreviation: 'Cake',
        sponsor: 'Orlan Santos',
      },
      {
        id: 7,
        name: 'CHVRCHES',
        url: 'http://www.chvrch.es/',
        placement: 7,
        seed: 4,
        abbreviation: 'CHVRCHS',
        sponsor: 'Marisa Lumino',
      },
      {
        id: 8,
        name: 'Sylvan Esso',
        url: 'https://www.sylvanesso.com/',
        placement: 8,
        seed: 13,
        abbreviation: 'SlvnEso',
        sponsor: 'David Cohen',
      },
      {
        id: 9,
        name: 'The Linda Lindas',
        url: 'https://www.thelindalindas.com/',
        placement: 9,
        seed: 6,
        abbreviation: 'Lindas',
        sponsor: 'Brian Osborn',
      },
      {
        id: 10,
        name: 'Ben Folds (Five)',
        url: 'https://www.benfolds.com/',
        placement: 10,
        seed: 11,
        abbreviation: 'BenFlds',
        sponsor: 'Thomas Rife',
      },
      {
        id: 11,
        name: 'Beastie Boys',
        url: 'http://beastieboys.com/',
        placement: 11,
        seed: 3,
        abbreviation: 'Beastie',
        sponsor: 'Jennifer Kondracki',
      },
      {
        id: 12,
        name: 'Daft Punk',
        url: 'https://daftpunk.com/',
        placement: 12,
        seed: 14,
        abbreviation: 'DaftPnk',
        sponsor: 'Andrew Dippell',
      },
      {
        id: 13,
        name: 'The War on Drugs',
        url: 'http://www.thewarondrugs.net/home',
        placement: 13,
        seed: 7,
        abbreviation: 'WrOnDrg',
        sponsor: 'Jason Rohde',
      },
      {
        id: 14,
        name: 'Interpol',
        url: 'https://www.interpolnyc.com/',
        placement: 14,
        seed: 10,
        abbreviation: 'Interpl',
        sponsor: 'Dave Mazzone',
      },
      {
        id: 15,
        name: 'Radiohead / The Smile',
        url: 'https://radiohead.com/',
        placement: 15,
        seed: 2,
        abbreviation: 'Rdohead',
        sponsor: 'Mary Holman',
      },
      {
        id: 16,
        name: 'Nada Surf',
        url: 'https://www.nadasurf.com/',
        placement: 16,
        seed: 15,
        abbreviation: 'NadaSrf',
        sponsor: 'Jennifer Kondracki',
      },
      {
        id: 17,
        name: 'Fontaines D.C.',
        url: 'https://fontainesdc.com/',
        placement: 17,
        seed: 1,
        abbreviation: 'FntnsDC',
        sponsor: 'Jim McAndrew',
      },
      {
        id: 18,
        name: 'Caroline Rose',
        url: 'https://www.carolinerosemusic.com/',
        placement: 18,
        seed: 16,
        abbreviation: 'ClnRose',
        sponsor: 'Scott Hemmons',
      },
      {
        id: 19,
        name: 'Kurt Vile',
        url: 'https://www.kurtvile.com/',
        placement: 19,
        seed: 8,
        abbreviation: 'KrtVile',
        sponsor: 'Andrew Gribbin',
      },
      {
        id: 20,
        name: 'Alvvays',
        url: 'https://alvvays.com/',
        placement: 20,
        seed: 9,
        abbreviation: 'Alvvays',
        sponsor: 'Gordon Lung',
      },
      {
        id: 21,
        name: 'Beabadoobee',
        url: 'https://www.beabadoobee.com/',
        placement: 21,
        seed: 5,
        abbreviation: 'Bbadbee',
        sponsor: 'Michael Cunningham',
      },
      {
        id: 22,
        name: 'The Strokes',
        url: 'http://www.thestrokes.com',
        placement: 22,
        seed: 12,
        abbreviation: 'Strokes',
        sponsor: 'Steve Hrobsky',
      },
      {
        id: 23,
        name: 'Against Me! / Laura Jane Grace',
        url: 'https://www.laurajanegrace.com/',
        placement: 23,
        seed: 4,
        abbreviation: 'AgnstMe',
        sponsor: 'Richard Crespo',
      },
      {
        id: 24,
        name: 'Car Seat Headrest',
        url: 'https://carseatheadrest.com/',
        placement: 24,
        seed: 13,
        abbreviation: 'CSHR',
        sponsor: 'Michael Ferry',
      },
      {
        id: 25,
        name: 'Spoon',
        url: 'http://www.spoontheband.com',
        placement: 25,
        seed: 6,
        abbreviation: 'Spoon',
        sponsor: 'David & Pat Schaeffer',
      },
      {
        id: 26,
        name: 'Arctic Monkeys',
        url: 'http://www.arcticmonkeys.com',
        placement: 26,
        seed: 11,
        abbreviation: 'ArcMnky',
        sponsor: 'Eric Rusack',
      },
      {
        id: 27,
        name: 'Yeah Yeah Yeahs',
        url: 'http://www.yeahyeahyeahs.com/',
        placement: 27,
        seed: 3,
        abbreviation: 'YYYs',
        sponsor: 'Steve Quirk',
      },
      {
        id: 28,
        name: 'Foo Fighters',
        url: 'https://foofighters.com/',
        placement: 28,
        seed: 14,
        abbreviation: 'FooFtrs',
        sponsor: 'Meredith Drumheller',
      },
      {
        id: 29,
        name: 'Nine Inch Nails',
        url: 'https://www.nin.com/',
        placement: 29,
        seed: 7,
        abbreviation: 'NIN',
        sponsor: 'Image360 of the Main Line (David Friedenberg)',
      },
      {
        id: 30,
        name: 'Beach Bunny',
        url: 'https://www.beachbunnymusic.com/',
        placement: 30,
        seed: 10,
        abbreviation: 'BchBnny',
        sponsor: 'Karen Isaacman',
      },
      {
        id: 31,
        name: 'The Cure',
        url: 'https://www.thecure.com/',
        placement: 31,
        seed: 2,
        abbreviation: 'Cure',
        sponsor: 'Dennis Beach',
      },
      {
        id: 32,
        name: 'Bloc Party',
        url: 'https://blocparty.com/',
        placement: 32,
        seed: 15,
        abbreviation: 'BlcPrty',
        sponsor: 'Joe Tittermary',
      },
      {
        id: 33,
        name: 'Jack White / White Stripes',
        url: 'http://www.jackwhiteiii.com',
        placement: 33,
        seed: 1,
        abbreviation: 'JackWht',
        sponsor: 'Damian Petrone',
      },
      {
        id: 34,
        name: 'Sheer Mag',
        url: 'https://www.sheer-mag.com/',
        placement: 34,
        seed: 16,
        abbreviation: 'SherMag',
        sponsor: 'Liz Whelan',
      },
      {
        id: 35,
        name: 'IDLES',
        url: 'https://www.idlesband.com/',
        placement: 35,
        seed: 8,
        abbreviation: 'IDLES',
        sponsor: 'Thomas Rife',
      },
      {
        id: 36,
        name: 'The National',
        url: 'https://americanmary.com/',
        placement: 36,
        seed: 9,
        abbreviation: 'Nationl',
        sponsor: 'Steve Hrobsky',
      },
      {
        id: 37,
        name: 'Garbage',
        url: 'http://www.garbage.com',
        placement: 37,
        seed: 5,
        abbreviation: 'Garbage',
        sponsor: 'David Johnson',
      },
      {
        id: 38,
        name: 'Franz Ferdinand',
        url: 'https://franzferdinand.com/',
        placement: 38,
        seed: 12,
        abbreviation: 'FrnzFrd',
        sponsor: 'Daniel Rowan',
      },
      {
        id: 39,
        name: 'Death Cab For Cutie',
        url: 'https://www.deathcabforcutie.com/',
        placement: 39,
        seed: 4,
        abbreviation: 'DCfC',
        sponsor: 'Bill Syrros',
      },
      {
        id: 40,
        name: 'Mitski',
        url: 'https://mitski.com/',
        placement: 40,
        seed: 13,
        abbreviation: 'Mitski',
        sponsor: 'Eric Rusack',
      },
      {
        id: 41,
        name: 'The Beths',
        url: 'https://thebeths.com/',
        placement: 41,
        seed: 6,
        abbreviation: 'Beths',
        sponsor: 'Martin Falasco',
      },
      {
        id: 42,
        name: 'The New Pornographers',
        url: 'https://thenewpornographers.com/',
        placement: 42,
        seed: 11,
        abbreviation: 'NewPrno',
        sponsor: 'Jakey Greenberg',
      },
      {
        id: 43,
        name: 'Vampire Weekend',
        url: 'http://www.vampireweekend.com',
        placement: 43,
        seed: 3,
        abbreviation: 'VmprWkd',
        sponsor: 'Michael Lebovitz',
      },
      {
        id: 44,
        name: 'Ramones',
        url: 'https://www.ramones.com/',
        placement: 44,
        seed: 14,
        abbreviation: 'Ramones',
        sponsor: 'Brandon Pinzini',
      },
      {
        id: 45,
        name: 'TV On The Radio',
        url: 'https://tvontheradio.com/',
        placement: 45,
        seed: 7,
        abbreviation: 'TVOTR',
        sponsor: 'George White',
      },
      {
        id: 46,
        name: 'Talking Heads / David Byrne',
        url: 'http://davidbyrne.com/',
        placement: 46,
        seed: 10,
        abbreviation: 'TlkgHds',
        sponsor: 'Terry Lautin',
      },
      {
        id: 47,
        name: 'R.E.M.',
        url: 'https://remhq.com/',
        placement: 47,
        seed: 2,
        abbreviation: 'REM',
        sponsor: 'Image360 of the Main Line (David Friedenberg)',
      },
      {
        id: 48,
        name: 'The Hives',
        url: 'https://www.thehives.com/',
        placement: 48,
        seed: 15,
        abbreviation: 'Hives',
        sponsor: 'Meredith Drumheller',
      },
      {
        id: 49,
        name: 'St. Vincent',
        url: 'http://www.ilovestvincent.com/',
        placement: 49,
        seed: 1,
        abbreviation: 'StVnct',
        sponsor: 'Lisa Wetherby',
      },
      {
        id: 50,
        name: 'Yard Act',
        url: 'https://www.yardactors.com/',
        placement: 50,
        seed: 16,
        abbreviation: 'YardAct',
        sponsor: 'Gregory Itts',
      },
      {
        id: 51,
        name: 'Metric',
        url: 'http://www.ilovemetric.com',
        placement: 51,
        seed: 8,
        abbreviation: 'Metric',
        sponsor: 'Danielle Nutt',
      },
      {
        id: 52,
        name: 'Guster',
        url: 'https://www.guster.com/',
        placement: 52,
        seed: 9,
        abbreviation: 'Guster',
        sponsor: 'Michele Gurz',
      },
      {
        id: 53,
        name: 'Waxahatchee',
        url: 'https://www.waxahatchee.com/',
        placement: 53,
        seed: 5,
        abbreviation: 'Wxhtche',
        sponsor: 'Madge & Joe Rassman',
      },
      {
        id: 54,
        name: 'Tame Impala',
        url: 'https://official.tameimpala.com/',
        placement: 54,
        seed: 12,
        abbreviation: 'TmImpla',
        sponsor: 'Jeffrey Seltzer',
      },
      {
        id: 55,
        name: 'Beck',
        url: 'http://www.beck.com',
        placement: 55,
        seed: 4,
        abbreviation: 'Beck',
        sponsor: 'Wendy Kessler',
      },
      {
        id: 56,
        name: 'Nirvana',
        url: 'https://www.nirvana.com/',
        placement: 56,
        seed: 13,
        abbreviation: 'Nirvana',
        sponsor: 'David Soto',
      },
      {
        id: 57,
        name: 'Silversun Pickups',
        url: 'https://silversunpickups.com/',
        placement: 57,
        seed: 6,
        abbreviation: 'SSPU',
        sponsor: 'Bruce Grant',
      },
      {
        id: 58,
        name: 'The Vaccines',
        url: 'https://www.thevaccines.com/',
        placement: 58,
        seed: 11,
        abbreviation: 'Vaccins',
        sponsor: 'Jeanne Martin',
      },
      {
        id: 59,
        name: 'LCD Soundsystem',
        url: 'http://lcdsoundsystem.com/main/.',
        placement: 59,
        seed: 3,
        abbreviation: 'LCDSyst',
        sponsor: 'Liz Whelan',
      },
      {
        id: 60,
        name: 'Future Islands',
        url: 'https://www.future-islands.com/',
        placement: 60,
        seed: 14,
        abbreviation: 'FtrIsld',
        sponsor: 'Patrick Raimondo',
      },
      {
        id: 61,
        name: 'Gorillaz / Blur',
        url: 'https://www.gorillaz.com/',
        placement: 61,
        seed: 7,
        abbreviation: 'Gorllaz',
        sponsor: 'Michael Clarke',
      },
      {
        id: 62,
        name: 'The Decemberists',
        url: 'https://www.decemberists.com/',
        placement: 62,
        seed: 10,
        abbreviation: 'Dcmbrst',
        sponsor: 'Danielle Nutt',
      },
      {
        id: 63,
        name: 'Mannequin Pussy',
        url: 'https://mannequinpussy.com/',
        placement: 63,
        seed: 2,
        abbreviation: 'MnqnPsy',
        sponsor: 'George White',
      },
      {
        id: 64,
        name: 'Speedy Ortiz',
        url: 'https://www.speedyortiz.com/',
        placement: 64,
        seed: 15,
        abbreviation: 'SpdyOtz',
        sponsor: 'Jeffrey Seltzer',
      },
    ];

    console.log('🎸 Creating 64 MRM groups...');
    const bandIdMap = new Map<number, number>(); // legacy seed id → Payload id

    /* eslint-disable no-await-in-loop */
    for (let i = 0; i < mrmBands.length; i += 1) {
      const b = mrmBands[i];
      const created = await payload.create({
        collection: 'modern-rock-madness-groups',
        data: {
          tournament: tournamentId,
          name: b.name,
          url: b.url,
          placement: b.placement,
          seed: b.seed,
          abbreviation: b.abbreviation,
          sponsor: b.sponsor,
        },
      });
      bandIdMap.set(b.id, typeof created.id === 'number' ? created.id : parseInt(created.id, 10));
    }
    /* eslint-enable no-await-in-loop */

    console.log(`   ✅ Created ${mrmBands.length} bands`);

    // ── Helper: map legacy match number to Payload round select value ─────────
    const getMatchRound = (matchNum: number): string => {
      if (matchNum <= 32) return '1'; // Round 1  (64→32)
      if (matchNum <= 48) return '2'; // Round 2  (32→16)
      if (matchNum <= 56) return '3'; // Swell 16 (16→8)
      if (matchNum <= 60) return '4'; // Elusive 8 (8→4)
      if (matchNum <= 62) return '5'; // Fantastic 4  (4→2)
      return '6'; // Championship
    };

    // ── 63 matches from ynot_db.sql `mrm_matches` ────────────────────────────
    // Columns: matchNum, region, group1LegacyId, group1Votes, group2LegacyId,
    //          band2Votes, startTime, endTime, winnerLegacyId
    // All matches are complete (showScore=true, winner set).
    type MatchRow = [number, number, number, number, number, number, string, string, number];
    const mrmMatchRows: MatchRow[] = [
      // Round 1 — Region 1 (Mar 24)
      [1, 1, 1, 20, 2, 6, '2025-03-24T14:00:00Z', '2025-03-24T14:30:00Z', 1],
      [2, 1, 3, 18, 4, 19, '2025-03-24T14:30:00Z', '2025-03-24T15:00:00Z', 4],
      [3, 1, 5, 18, 6, 11, '2025-03-24T15:00:00Z', '2025-03-24T15:30:00Z', 5],
      [4, 1, 7, 15, 8, 8, '2025-03-24T15:30:00Z', '2025-03-24T16:00:00Z', 7],
      [5, 1, 9, 10, 10, 13, '2025-03-24T17:00:00Z', '2025-03-24T17:30:00Z', 10],
      [6, 1, 11, 9, 12, 12, '2025-03-24T17:30:00Z', '2025-03-24T18:00:00Z', 12],
      [7, 1, 13, 10, 14, 14, '2025-03-24T18:00:00Z', '2025-03-24T18:30:00Z', 14],
      [8, 1, 15, 15, 16, 10, '2025-03-24T18:30:00Z', '2025-03-24T19:00:00Z', 15],
      // Round 1 — Region 2 (Mar 25)
      [9, 2, 17, 10, 18, 11, '2025-03-25T14:00:00Z', '2025-03-25T14:30:00Z', 18],
      [10, 2, 19, 10, 20, 13, '2025-03-25T14:30:00Z', '2025-03-25T15:00:00Z', 20],
      [11, 2, 21, 10, 22, 17, '2025-03-25T15:00:00Z', '2025-03-25T15:30:00Z', 22],
      [12, 2, 23, 9, 24, 10, '2025-03-25T15:30:00Z', '2025-03-25T16:00:00Z', 24],
      [13, 2, 25, 15, 26, 7, '2025-03-25T17:00:00Z', '2025-03-25T17:30:00Z', 25],
      [14, 2, 27, 22, 28, 5, '2025-03-25T17:30:00Z', '2025-03-25T18:00:00Z', 27],
      [15, 2, 29, 20, 30, 4, '2025-03-25T18:00:00Z', '2025-03-25T18:30:00Z', 29],
      [16, 2, 31, 16, 32, 12, '2025-03-25T18:30:00Z', '2025-03-25T19:00:00Z', 31],
      // Round 1 — Region 3 (Mar 26)
      [17, 3, 33, 9, 34, 14, '2025-03-26T14:00:00Z', '2025-03-26T14:30:00Z', 34],
      [18, 3, 35, 9, 36, 10, '2025-03-26T14:30:00Z', '2025-03-26T15:00:00Z', 36],
      [19, 3, 37, 12, 38, 13, '2025-03-26T15:00:00Z', '2025-03-26T15:30:00Z', 38],
      [20, 3, 39, 18, 40, 7, '2025-03-26T15:30:00Z', '2025-03-26T16:00:00Z', 39],
      [21, 3, 41, 9, 42, 19, '2025-03-26T17:00:00Z', '2025-03-26T17:30:00Z', 42],
      [22, 3, 43, 14, 44, 17, '2025-03-26T17:30:00Z', '2025-03-26T18:00:00Z', 44],
      [23, 3, 45, 16, 46, 14, '2025-03-26T18:00:00Z', '2025-03-26T18:30:00Z', 45],
      [24, 3, 47, 28, 48, 8, '2025-03-26T18:30:00Z', '2025-03-26T19:00:00Z', 47],
      // Round 1 — Region 4 (Mar 27–28)
      [25, 4, 49, 19, 50, 6, '2025-03-27T14:00:00Z', '2025-03-27T14:30:00Z', 49],
      [26, 4, 51, 17, 52, 7, '2025-03-27T14:30:00Z', '2025-03-27T15:00:00Z', 51],
      [27, 4, 53, 9, 54, 18, '2025-03-27T15:00:00Z', '2025-03-27T15:30:00Z', 54],
      [28, 4, 55, 14, 56, 16, '2025-03-27T15:30:00Z', '2025-03-27T16:00:00Z', 56],
      [29, 4, 57, 18, 58, 7, '2025-03-27T17:00:00Z', '2025-03-27T17:30:00Z', 57],
      [30, 4, 59, 15, 60, 10, '2025-03-27T17:30:00Z', '2025-03-27T18:00:00Z', 59],
      [31, 4, 61, 14, 62, 13, '2025-03-27T18:00:00Z', '2025-03-27T18:30:00Z', 61],
      [32, 4, 63, 9, 64, 8, '2025-03-28T18:00:00Z', '2025-03-28T18:30:00Z', 63],
      // Round 2 — Regions 1–4 (Mar 31)
      [33, 1, 1, 16, 4, 12, '2025-03-31T14:00:00Z', '2025-03-31T14:30:00Z', 1],
      [34, 1, 5, 16, 7, 14, '2025-03-31T14:30:00Z', '2025-03-31T15:00:00Z', 5],
      [35, 1, 10, 12, 12, 13, '2025-03-31T15:00:00Z', '2025-03-31T15:30:00Z', 12],
      [36, 1, 14, 15, 15, 16, '2025-03-31T15:30:00Z', '2025-03-31T16:00:00Z', 15],
      [37, 2, 18, 14, 20, 11, '2025-03-31T17:00:00Z', '2025-03-31T17:30:00Z', 18],
      [38, 2, 22, 16, 24, 8, '2025-03-31T17:30:00Z', '2025-03-31T18:00:00Z', 22],
      [39, 2, 25, 14, 27, 20, '2025-03-31T18:00:00Z', '2025-03-31T18:30:00Z', 27],
      [40, 2, 29, 14, 31, 22, '2025-03-31T18:30:00Z', '2025-03-31T19:00:00Z', 31],
      // Round 2 — Regions 3–4 (Apr 1)
      [41, 3, 34, 7, 36, 17, '2025-04-01T14:00:00Z', '2025-04-01T14:30:00Z', 36],
      [42, 3, 38, 12, 39, 15, '2025-04-01T14:30:00Z', '2025-04-01T15:00:00Z', 39],
      [43, 3, 42, 14, 44, 17, '2025-04-01T15:00:00Z', '2025-04-01T15:30:00Z', 44],
      [44, 3, 45, 14, 47, 20, '2025-04-01T15:30:00Z', '2025-04-01T16:00:00Z', 47],
      [45, 4, 49, 8, 51, 10, '2025-04-01T17:00:00Z', '2025-04-01T17:30:00Z', 51],
      [46, 4, 54, 15, 56, 13, '2025-04-01T17:30:00Z', '2025-04-01T18:00:00Z', 54],
      [47, 4, 57, 13, 59, 16, '2025-04-01T18:00:00Z', '2025-04-01T18:30:00Z', 59],
      [48, 4, 61, 19, 63, 11, '2025-04-01T18:30:00Z', '2025-04-01T19:00:00Z', 61],
      // Swell 16 (Apr 2)
      [49, 1, 1, 16, 5, 9, '2025-04-02T14:00:00Z', '2025-04-02T14:30:00Z', 1],
      [50, 1, 12, 8, 15, 21, '2025-04-02T14:30:00Z', '2025-04-02T15:00:00Z', 15],
      [51, 2, 18, 7, 22, 24, '2025-04-02T15:00:00Z', '2025-04-02T15:30:00Z', 22],
      [52, 2, 27, 21, 31, 16, '2025-04-02T15:30:00Z', '2025-04-02T16:00:00Z', 27],
      [53, 3, 36, 15, 39, 18, '2025-04-02T17:00:00Z', '2025-04-02T17:30:00Z', 39],
      [54, 3, 44, 7, 47, 19, '2025-04-02T17:30:00Z', '2025-04-02T18:00:00Z', 47],
      [55, 4, 51, 20, 54, 13, '2025-04-02T18:00:00Z', '2025-04-02T18:30:00Z', 51],
      [56, 4, 59, 21, 61, 14, '2025-04-02T18:30:00Z', '2025-04-02T19:00:00Z', 59],
      // Elusive 8 (Apr 3)
      [57, 1, 1, 14, 15, 17, '2025-04-03T14:00:00Z', '2025-04-03T14:30:00Z', 15],
      [58, 2, 22, 18, 27, 19, '2025-04-03T14:30:00Z', '2025-04-03T15:00:00Z', 27],
      [59, 3, 39, 14, 47, 22, '2025-04-03T15:00:00Z', '2025-04-03T15:30:00Z', 47],
      [60, 4, 51, 20, 59, 21, '2025-04-03T15:30:00Z', '2025-04-03T16:00:00Z', 59],
      // Fantastic 4 (Apr 3 evening)
      [61, 5, 15, 18, 27, 21, '2025-04-03T18:00:00Z', '2025-04-03T19:00:00Z', 27],
      [62, 5, 47, 26, 59, 23, '2025-04-03T19:00:00Z', '2025-04-03T20:00:00Z', 47],
      // Championship — R.E.M. def. Yeah Yeah Yeahs 27–26 (Apr 4)
      [63, 5, 27, 26, 47, 27, '2025-04-04T17:00:00Z', '2025-04-04T19:00:00Z', 47],
    ];

    console.log('⚔️  Creating 63 MRM matches...');
    const matchIdMap = new Map<number, number>(); // match number → Payload id

    /* eslint-disable no-await-in-loop */
    for (let i = 0; i < mrmMatchRows.length; i += 1) {
      const [mId, region, b1, b1v, b2, b2v, start, end, winner] = mrmMatchRows[i];
      const created = await payload.create({
        collection: 'modern-rock-madness-matches',
        data: {
          tournament: tournamentId,
          matchNumber: mId,
          round: getMatchRound(mId),
          region,
          band1: bandIdMap.get(b1),
          band2: bandIdMap.get(b2),
          band1Votes: b1v,
          band2Votes: b2v,
          startTime: start,
          endTime: end,
          winner: bandIdMap.get(winner),
          showScore: true,
        },
      });
      matchIdMap.set(mId, typeof created.id === 'number' ? created.id : parseInt(created.id, 10));
    }
    /* eslint-enable no-await-in-loop */

    console.log('   ✅ Created 63 matches');

    // ── Wire nextMatch from ynot_db.sql `mrm_matches_flow` ────────────────────
    // Each pair is [fromLegacyMatchId, toLegacyMatchId]
    const mrmFlow: [number, number][] = [
      [1, 33],
      [2, 33],
      [3, 34],
      [4, 34],
      [5, 35],
      [6, 35],
      [7, 36],
      [8, 36],
      [9, 37],
      [10, 37],
      [11, 38],
      [12, 38],
      [13, 39],
      [14, 39],
      [15, 40],
      [16, 40],
      [17, 41],
      [18, 41],
      [19, 42],
      [20, 42],
      [21, 43],
      [22, 43],
      [23, 44],
      [24, 44],
      [25, 45],
      [26, 45],
      [27, 46],
      [28, 46],
      [29, 47],
      [30, 47],
      [31, 48],
      [32, 48],
      [33, 49],
      [34, 49],
      [35, 50],
      [36, 50],
      [37, 51],
      [38, 51],
      [39, 52],
      [40, 52],
      [41, 53],
      [42, 53],
      [43, 54],
      [44, 54],
      [45, 55],
      [46, 55],
      [47, 56],
      [48, 56],
      [49, 57],
      [50, 57],
      [51, 58],
      [52, 58],
      [53, 59],
      [54, 59],
      [55, 60],
      [56, 60],
      [57, 61],
      [58, 61],
      [59, 62],
      [60, 62],
      [61, 63],
      [62, 63],
    ];

    /* eslint-disable no-await-in-loop */
    for (let i = 0; i < mrmFlow.length; i += 1) {
      const [fromId, toId] = mrmFlow[i];
      await payload.update({
        collection: 'modern-rock-madness-matches',
        id: matchIdMap.get(fromId) as number,
        data: { nextMatch: matchIdMap.get(toId) },
      });
    }
    /* eslint-enable no-await-in-loop */

    console.log(`   ✅ Wired ${mrmFlow.length} nextMatch bracket links`);

    console.log('\n✅ Database seeded successfully!\n');
    console.log('📊 Summary:');
    console.log('   Users: 1 (admin)');
    console.log('   People: 3');
    console.log('   Venues: 3');
    console.log('   Artists: 2');
    console.log('   Records: 2');
    console.log('   Songs: 3');
    console.log('   Concerts: 3');
    console.log('   Posts: 3');
    console.log('   Shows: 2');
    console.log('   MRM Tournament: 1 (Modern Rock Madness 2025, complete)');
    console.log('   MRM Bands: 64 (all 4 regions, from ynot_db.sql)');
    console.log('   MRM Matches: 63 (full bracket + nextMatch wired)');
    console.log('\n🌐 View at: http://localhost:3000/admin');
    console.log(
      `   Login: ${process.env.PAYLOAD_DEV_EMAIL || 'admin@ynotradio.net'} / ${process.env.PAYLOAD_DEV_PASSWORD || 'password'}\n`,
    );

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seed();
