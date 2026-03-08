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
        slug: 'great-album',
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
        slug: 'awesome-lp',
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
        slug: 'hit-single',
        artist: musicArtist1.id,
        record: record1.id,
        spotifyUrl: 'https://open.spotify.com/track/example1',
      },
    });

    const song2 = await payload.create({
      collection: 'songs',
      data: {
        title: 'Deep Cut',
        slug: 'deep-cut',
        artist: musicArtist1.id,
        record: record1.id,
      },
    });

    const song3 = await payload.create({
      collection: 'songs',
      data: {
        title: 'Radio Friendly',
        slug: 'radio-friendly',
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

    const showDate2 = new Date();
    showDate2.setDate(showDate2.getDate() + 8);

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
