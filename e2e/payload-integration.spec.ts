import { test, expect } from '@playwright/test';
import { getPayload } from 'payload';
import config from '../payload.config';

/**
 * E2E Integration Test: Payload CMS → Legacy PHP Site
 *
 * This test demonstrates end-to-end data flow:
 * 1. Start Payload CMS (via getPayload API)
 * 2. Create a new concert through Payload
 * 3. Verify the concert appears on the legacy PHP site (concerts.php)
 *
 * The test assumes:
 * - Docker Compose has started PostgreSQL, MySQL, and Apache services
 * - PostgreSQL database has Payload schema (via migrations)
 * - Legacy PHP site is configured to read from PostgreSQL
 * - Apache is serving the legacy PHP site on port 8080
 */

test.describe('Payload CMS Integration with Legacy PHP Site', () => {
  test('should create concert in Payload and verify it appears on legacy site', async ({
    page,
  }, testInfo) => {
    // eslint-disable-next-line no-console
    console.log('🎭 Testing Payload CMS → Legacy PHP Site integration');

    // Step 1: Initialize Payload
    // eslint-disable-next-line no-console
    console.log('📦 Initializing Payload CMS...');
    const payload = await getPayload({ config });

    // Step 2: Ensure we have required data (artist and venue)
    // eslint-disable-next-line no-console
    console.log('🔍 Checking for existing test data...');

    // Check for or create a test artist
    let testArtist = await payload.find({
      collection: 'artists',
      where: {
        name: {
          equals: 'E2E Test Band',
        },
      },
      limit: 1,
    });

    if (testArtist.docs.length === 0) {
      // eslint-disable-next-line no-console
      console.log('🎸 Creating test artist...');
      const createdArtist = await payload.create({
        collection: 'artists',
        data: {
          name: 'E2E Test Band',
          slug: 'e2e-test-band',
          website: 'https://e2etestband.example.com',
        },
      });
      testArtist = { docs: [createdArtist] };
    }

    const artistId = testArtist.docs[0].id;
    // eslint-disable-next-line no-console
    console.log(`   ✅ Using artist ID: ${artistId}`);

    // Check for or create a test venue
    let testVenue = await payload.find({
      collection: 'venues',
      where: {
        name: {
          equals: 'E2E Test Venue',
        },
      },
      limit: 1,
    });

    if (testVenue.docs.length === 0) {
      // eslint-disable-next-line no-console
      console.log('🏢 Creating test venue...');
      const createdVenue = await payload.create({
        collection: 'venues',
        data: {
          name: 'E2E Test Venue',
          slug: 'e2e-test-venue',
          city: 'Philadelphia',
          state: 'PA',
          website: 'https://e2etestvenue.example.com',
        },
      });
      testVenue = { docs: [createdVenue] };
    }

    const venueId = testVenue.docs[0].id;
    // eslint-disable-next-line no-console
    console.log(`   ✅ Using venue ID: ${venueId}`);

    // Step 3: Create a new concert with a future date
    // eslint-disable-next-line no-console
    console.log('🎤 Creating new concert via Payload...');

    const concertDate = new Date();
    concertDate.setDate(concertDate.getDate() + 7); // 7 days from now
    const concertDateString = concertDate.toISOString().split('T')[0]; // YYYY-MM-DD format

    const newConcert = await payload.create({
      collection: 'concerts',
      data: {
        title: 'E2E Integration Test Concert',
        date: concertDate.toISOString(),
        artists: [typeof artistId === 'number' ? artistId : parseInt(artistId, 10)],
        venue: typeof venueId === 'number' ? venueId : parseInt(venueId, 10),
        ticketInfo: 'Test Tickets $25',
        ticketUrl: 'https://tickets.example.com/e2e-test',
        featured: false,
      },
    });

    // eslint-disable-next-line no-console
    console.log(`   ✅ Created concert with ID: ${newConcert.id}`);

    // Step 4: Navigate to the legacy PHP concerts page
    // eslint-disable-next-line no-console
    console.log('🌐 Navigating to legacy PHP concerts page...');

    const response = await page.goto('http://localhost:8080/concerts.php', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    expect(response?.status()).toBe(200);

    // Step 5: Verify the page loaded without errors
    const pageContent = await page.content();

    // Check for PHP errors
    expect(pageContent).not.toContain('Fatal error');
    expect(pageContent).not.toContain('Parse error');
    expect(pageContent).not.toContain('Warning:');

    // Step 6: Verify the newly created concert appears on the page
    // eslint-disable-next-line no-console
    console.log('🔍 Verifying concert appears on page...');

    // Check for artist name
    expect(pageContent).toContain('E2E Test Band');

    // Check for venue name
    expect(pageContent).toContain('E2E Test Venue');

    // Check for ticket info
    expect(pageContent).toContain('Test Tickets $25');

    // Step 7: Take a screenshot showing the concert on the page
    const screenshot = await page.screenshot({
      fullPage: true,
    });
    await testInfo.attach('Concerts Page with New Concert', {
      body: screenshot,
      contentType: 'image/png',
    });

    // eslint-disable-next-line no-console
    console.log('✅ Concert successfully appears on legacy PHP site!');

    // Step 8: Cleanup - Delete the test concert
    // eslint-disable-next-line no-console
    console.log('🧹 Cleaning up test concert...');
    await payload.delete({
      collection: 'concerts',
      id: typeof newConcert.id === 'number' ? newConcert.id : parseInt(newConcert.id, 10),
    });

    // eslint-disable-next-line no-console
    console.log('✅ Integration test completed successfully!');
  });

  test('should verify Payload database connectivity', async () => {
    // eslint-disable-next-line no-console
    console.log('🔌 Testing Payload database connectivity...');

    const payload = await getPayload({ config });

    // Simple query to verify database is accessible
    const venues = await payload.find({
      collection: 'venues',
      limit: 1,
    });

    // We should be able to query the database without errors
    expect(venues).toBeDefined();
    expect(venues.docs).toBeDefined();

    // eslint-disable-next-line no-console
    console.log('✅ Payload database connection successful');
  });
});
