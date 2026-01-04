import { getPayloadHMR } from '@payloadcms/next/utilities'
import config from '@payload-config'

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
  console.log('🌱 Seeding Payload database with sample data...\n')

  const payload = await getPayloadHMR({ config })

  try {
    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('🗑️  Clearing existing sample data...')
    await payload.delete({ collection: 'concerts', where: {} })
    await payload.delete({ collection: 'posts', where: {} })
    await payload.delete({ collection: 'shows', where: {} })
    await payload.delete({ collection: 'people', where: {} })
    await payload.delete({ collection: 'venues', where: {} })
    await payload.delete({ collection: 'songs', where: {} })
    await payload.delete({ collection: 'records', where: {} })
    await payload.delete({ collection: 'artists', where: {} })

    // Create sample People (DJs and Artists)
    console.log('👤 Creating sample people...')
    
    const dj1 = await payload.create({
      collection: 'people',
      data: {
        name: 'Josh T. Landow',
        email: 'josh@ynotradio.net',
        role: 'dj',
        bio: 'Host of Top 11 @ 11 and Future Fridays',
        website: 'http://www.facebook.com/josh.t.landow.1',
        priority: 1,
        active: true,
      },
    })

    const dj2 = await payload.create({
      collection: 'people',
      data: {
        name: 'Test DJ',
        email: 'test@ynotradio.net',
        role: 'dj',
        bio: 'Sample DJ for testing',
        priority: 2,
        active: true,
      },
    })

    const artist1 = await payload.create({
      collection: 'people',
      data: {
        name: 'Sample Artist',
        role: 'artist',
        bio: 'Indie rock artist from Philadelphia',
        website: 'https://sampleartist.com',
        active: true,
      },
    })

    console.log(`   ✅ Created ${dj1.name}, ${dj2.name}, ${artist1.name}`)

    // Create sample Venues
    console.log('🏢 Creating sample venues...')
    
    const venue1 = await payload.create({
      collection: 'venues',
      data: {
        name: 'The Foundry',
        city: 'Philadelphia',
        state: 'PA',
        website: 'https://www.thefoundry.com',
      },
    })

    const venue2 = await payload.create({
      collection: 'venues',
      data: {
        name: 'Union Transfer',
        city: 'Philadelphia',
        state: 'PA',
        website: 'https://www.utphilly.com',
      },
    })

    const venue3 = await payload.create({
      collection: 'venues',
      data: {
        name: 'World Cafe Live',
        city: 'Philadelphia',
        state: 'PA',
        website: 'https://www.worldcafelive.com',
      },
    })

    console.log(`   ✅ Created ${venue1.name}, ${venue2.name}, ${venue3.name}`)

    // Create sample Artists (for music collections)
    console.log('🎸 Creating sample artists...')
    
    const musicArtist1 = await payload.create({
      collection: 'artists',
      data: {
        name: 'Sample Band',
        website: 'https://sampleband.com',
        spotifyUrl: 'https://open.spotify.com/artist/example',
      },
    })

    const musicArtist2 = await payload.create({
      collection: 'artists',
      data: {
        name: 'Test Group',
        website: 'https://testgroup.com',
      },
    })

    console.log(`   ✅ Created ${musicArtist1.name}, ${musicArtist2.name}`)

    // Create sample Records
    console.log('💿 Creating sample records...')
    
    const record1 = await payload.create({
      collection: 'records',
      data: {
        title: 'Great Album',
        artist: musicArtist1.id,
        releaseYear: 2025,
        label: 'Independent Records',
        spotifyUrl: 'https://open.spotify.com/album/example1',
      },
    })

    const record2 = await payload.create({
      collection: 'records',
      data: {
        title: 'Awesome LP',
        artist: musicArtist2.id,
        releaseYear: 2026,
        label: 'Test Label',
      },
    })

    console.log(`   ✅ Created "${record1.title}", "${record2.title}"`)

    // Create sample Songs
    console.log('🎵 Creating sample songs...')
    
    const song1 = await payload.create({
      collection: 'songs',
      data: {
        title: 'Hit Single',
        artist: musicArtist1.id,
        record: record1.id,
        spotifyUrl: 'https://open.spotify.com/track/example1',
      },
    })

    const song2 = await payload.create({
      collection: 'songs',
      data: {
        title: 'Deep Cut',
        artist: musicArtist1.id,
        record: record1.id,
      },
    })

    const song3 = await payload.create({
      collection: 'songs',
      data: {
        title: 'Radio Friendly',
        artist: musicArtist2.id,
        record: record2.id,
      },
    })

    console.log(`   ✅ Created "${song1.title}", "${song2.title}", "${song3.title}"`)

    // Create sample Concerts
    console.log('🎤 Creating sample concerts...')
    
    const futureDate1 = new Date()
    futureDate1.setDate(futureDate1.getDate() + 30)
    
    const futureDate2 = new Date()
    futureDate2.setDate(futureDate2.getDate() + 45)
    
    const futureDate3 = new Date()
    futureDate3.setDate(futureDate3.getDate() + 60)

    const concert1 = await payload.create({
      collection: 'concerts',
      data: {
        date: futureDate1.toISOString(),
        artist: typeof artist1.id === 'number' ? artist1.id : parseInt(artist1.id),
        venue: typeof venue1.id === 'number' ? venue1.id : parseInt(venue1.id),
        ticketUrl: 'https://ticketmaster.com/example1',
        featured: true,
      },
    })

    const concert2 = await payload.create({
      collection: 'concerts',
      data: {
        date: futureDate2.toISOString(),
        artist: typeof artist1.id === 'number' ? artist1.id : parseInt(artist1.id),
        venue: typeof venue2.id === 'number' ? venue2.id : parseInt(venue2.id),
        ticketUrl: 'https://ticketmaster.com/example2',
        featured: false,
      },
    })

    const concert3 = await payload.create({
      collection: 'concerts',
      data: {
        date: futureDate3.toISOString(),
        artist: typeof artist1.id === 'number' ? artist1.id : parseInt(artist1.id),
        venue: typeof venue3.id === 'number' ? venue3.id : parseInt(venue3.id),
        ticketUrl: 'https://worldcafelive.com/events',
        featured: true,
      },
    })

    console.log(`   ✅ Created 3 concerts`)

    // Create sample Posts (stories)
    console.log('📝 Creating sample posts...')
    
    const post1 = await payload.create({
      collection: 'posts',
      data: {
        title: 'Welcome to Y-Not Radio',
        content: [
          {
            type: 'paragraph',
            children: [
              {
                text: 'Y-Not Radio is an independent online radio station playing the best in indie rock, alternative, and college radio. Tune in 24/7 for new music discoveries and deep cuts from your favorite artists.',
              },
            ],
          },
        ],
        slug: 'welcome-to-ynot',
        publishedDate: new Date().toISOString(),
        status: 'published',
        priority: 1,
      },
    })

    const post2 = await payload.create({
      collection: 'posts',
      data: {
        title: 'New Music Friday',
        content: [
          {
            type: 'paragraph',
            children: [
              {
                text: 'Check out the latest releases from Sample Artist, Test Band, and Demo Group. New albums spinning all day!',
              },
            ],
          },
        ],
        slug: 'new-music-friday',
        publishedDate: new Date().toISOString(),
        status: 'published',
        priority: 2,
      },
    })

    const post3 = await payload.create({
      collection: 'posts',
      data: {
        title: 'Win Concert Tickets',
        content: [
          {
            type: 'paragraph',
            children: [
              {
                text: 'Enter for your chance to win tickets to see Sample Artist at The Foundry next month!',
              },
            ],
          },
        ],
        slug: 'win-concert-tickets',
        publishedDate: new Date().toISOString(),
        status: 'published',
        priority: 3,
      },
    })

    console.log(`   ✅ Created "${post1.title}", "${post2.title}", "${post3.title}"`)

    // Create sample Shows
    console.log('📻 Creating sample shows...')
    
    const show1 = await payload.create({
      collection: 'shows',
      data: {
        name: 'Top 11 @ 11',
        description: 'Countdown of the top 11 songs as voted by listeners',
        dj: typeof dj1.id === 'number' ? dj1.id : parseInt(dj1.id),
        schedule: 'Fridays at 11am',
        active: true,
      },
    })

    const show2 = await payload.create({
      collection: 'shows',
      data: {
        name: 'Indie Rock Hour',
        description: 'The best indie rock, old and new',
        dj: typeof dj2.id === 'number' ? dj2.id : parseInt(dj2.id),
        schedule: 'Mondays 1-5pm',
        active: true,
      },
    })

    console.log(`   ✅ Created "${show1.name}", "${show2.name}"`)

    console.log('\n✅ Database seeded successfully!\n')
    console.log('📊 Summary:')
    console.log(`   People: 3`)
    console.log(`   Venues: 3`)
    console.log(`   Artists: 2`)
    console.log(`   Records: 2`)
    console.log(`   Songs: 3`)
    console.log(`   Concerts: 3`)
    console.log(`   Posts: 3`)
    console.log(`   Shows: 2`)
    console.log('\n🌐 View at: http://localhost:3000/admin\n')

    process.exit(0)
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    process.exit(1)
  }
}

seed()
