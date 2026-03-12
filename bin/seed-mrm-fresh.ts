/* eslint-disable no-console */
import { getPayloadHMR } from '@payloadcms/next/utilities';
import config from '@payload-config';

/**
 * Seed a fresh Modern Rock Madness tournament into Payload database.
 *
 * Usage: yarn seed:mrm:fresh
 *
 * Creates a fresh MRM tournament suitable for e2e testing:
 * - 1 tournament (Modern Rock Madness 2026, status: active)
 * - 64 groups (bands) with the same roster as the 2025 tournament
 * - 63 matches (full bracket, no winners, no votes)
 *   - Match 1 is set to be currently RUNNING (start: now-15min, end: now+15min)
 *   - All other matches are in the future
 * - nextMatch links wired by the scaffold hook automatically
 *
 * Idempotent: skips if an active tournament already exists.
 * Safe to run alongside seed:mrm (complete tournament stays intact).
 */

/** Return the current Monday (or today if already Monday) as a YYYY-MM-DD string. */
function nextMonday(from: Date): string {
  const d = new Date(from);
  const dow = d.getUTCDay(); // 0=Sun, 1=Mon … 6=Sat
  if (dow !== 1) {
    const daysToAdd = dow === 0 ? 1 : 8 - dow;
    d.setUTCDate(d.getUTCDate() + daysToAdd);
  }
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

/** Round 1 band pairing: match m (1-32) → [band1Placement, band2Placement]. */
function r1BandPair(matchNumber: number): [number, number] {
  const regionIndex = Math.floor((matchNumber - 1) / 8); // 0-3
  const matchInRegion = (matchNumber - 1) % 8; // 0-7
  const band1Placement = regionIndex * 16 + matchInRegion * 2 + 1;
  const band2Placement = regionIndex * 16 + matchInRegion * 2 + 2;
  return [band1Placement, band2Placement];
}

async function seedMrmFresh() {
  console.log('🏆 Seeding fresh Modern Rock Madness tournament...\n');

  const payload = await getPayloadHMR({ config });

  try {
    // ── Idempotency check ───────────────────────────────────────────────────
    const existingActive = await payload.find({
      collection: 'modern-rock-madness-tournaments',
      where: { status: { equals: 'active' } },
      limit: 1,
    });

    if (existingActive.docs.length > 0) {
      console.log('⏭️  Active MRM tournament already exists. Skipping fresh seed.');
      console.log('   To re-seed, first delete the active tournament.');
      process.exit(0);
    }

    // Ensure admin user exists (required for Payload operations)
    const existingAdmin = await payload.find({
      collection: 'users',
      where: {
        email: { equals: process.env.PAYLOAD_DEV_EMAIL || 'admin@ynotradio.net' },
      },
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

    // ── Tournament ──────────────────────────────────────────────────────────
    // Start date snapped to next Monday so scaffold produces a clean schedule.
    const startDate = nextMonday(new Date());
    console.log(`📅 Tournament start date: ${startDate}`);

    console.log('🏆 Creating tournament (scaffold will auto-create 63 empty matches)...');
    const tournament = await payload.create({
      collection: 'modern-rock-madness-tournaments',
      data: {
        name: 'Modern Rock Madness 2026',
        year: 2026,
        startDate,
        status: 'active',
        bracketPdfUrl: 'https://od.lk/d/219145587_ruE6q/MRM2025Bracket.pdf',
      },
    });
    const tournamentId = typeof tournament.id === 'number'
      ? tournament.id
      : parseInt(tournament.id, 10);
    console.log(`   ✅ Tournament created (id=${tournamentId})`);

    // ── Fetch scaffolded matches ────────────────────────────────────────────
    // The afterChange hook creates all 63 matches; collect them now.
    const { docs: scaffoldedMatches } = await payload.find({
      collection: 'modern-rock-madness-matches',
      where: { tournament: { equals: tournamentId } },
      limit: 100,
      sort: 'matchNumber',
    });
    console.log(`   ✅ Scaffold created ${scaffoldedMatches.length} matches`);

    // Build matchNumber → Payload ID map
    const matchIdByNumber = new Map<number, number>();
    for (const m of scaffoldedMatches) {
      const mn = typeof m.matchNumber === 'number' ? m.matchNumber : parseInt(m.matchNumber as string, 10);
      const id = typeof m.id === 'number' ? m.id : parseInt(m.id as string, 10);
      matchIdByNumber.set(mn, id);
    }

    // ── Set match 1 to "currently running" ─────────────────────────────────
    const now = new Date();
    const match1Start = new Date(now.getTime() - 15 * 60 * 1000);
    const match1End = new Date(now.getTime() + 15 * 60 * 1000);

    await payload.update({
      collection: 'modern-rock-madness-matches',
      id: matchIdByNumber.get(1) as number,
      data: {
        startTime: match1Start.toISOString(),
        endTime: match1End.toISOString(),
      },
    });
    console.log(`   ✅ Match 1 set to running (${match1Start.toISOString()} – ${match1End.toISOString()})`);

    // ── 64 Groups (bands) ───────────────────────────────────────────────────
    // Same roster as the 2025 tournament for realistic test data.
    const mrmBands = [
      { placement: 1,  seed: 1,  abbreviation: 'JBrekie', name: 'Japanese Breakfast',         url: 'http://japanesebreakfast.rocks/' },
      { placement: 2,  seed: 16, abbreviation: 'ChlyBls', name: 'Charly Bliss',                url: 'https://charlybliss.os.fan/' },
      { placement: 3,  seed: 8,  abbreviation: 'Wombats', name: 'The Wombats',                 url: 'https://www.thewombats.co.uk/' },
      { placement: 4,  seed: 9,  abbreviation: 'Jpndrds', name: 'Japandroids',                 url: 'https://japandroids.com/' },
      { placement: 5,  seed: 5,  abbreviation: 'Clash',   name: 'The Clash',                   url: 'https://www.theclash.com/' },
      { placement: 6,  seed: 12, abbreviation: 'Cake',    name: 'Cake',                        url: 'https://www.cakemusic.com/' },
      { placement: 7,  seed: 4,  abbreviation: 'CHVRCHS', name: 'CHVRCHES',                    url: 'http://www.chvrch.es/' },
      { placement: 8,  seed: 13, abbreviation: 'SlvnEso', name: 'Sylvan Esso',                 url: 'https://www.sylvanesso.com/' },
      { placement: 9,  seed: 6,  abbreviation: 'Lindas',  name: 'The Linda Lindas',            url: 'https://www.thelindalindas.com/' },
      { placement: 10, seed: 11, abbreviation: 'BenFlds', name: 'Ben Folds (Five)',             url: 'https://www.benfolds.com/' },
      { placement: 11, seed: 3,  abbreviation: 'Beastie', name: 'Beastie Boys',                url: 'http://beastieboys.com/' },
      { placement: 12, seed: 14, abbreviation: 'DaftPnk', name: 'Daft Punk',                   url: 'https://daftpunk.com/' },
      { placement: 13, seed: 7,  abbreviation: 'WrOnDrg', name: 'The War on Drugs',            url: 'http://www.thewarondrugs.net/home' },
      { placement: 14, seed: 10, abbreviation: 'Interpl', name: 'Interpol',                    url: 'https://www.interpolnyc.com/' },
      { placement: 15, seed: 2,  abbreviation: 'Rdohead', name: 'Radiohead / The Smile',       url: 'https://radiohead.com/' },
      { placement: 16, seed: 15, abbreviation: 'NadaSrf', name: 'Nada Surf',                   url: 'https://www.nadasurf.com/' },
      { placement: 17, seed: 1,  abbreviation: 'FntnsDC', name: 'Fontaines D.C.',              url: 'https://fontainesdc.com/' },
      { placement: 18, seed: 16, abbreviation: 'ClnRose', name: 'Caroline Rose',               url: 'https://www.carolinerosemusic.com/' },
      { placement: 19, seed: 8,  abbreviation: 'KrtVile', name: 'Kurt Vile',                   url: 'https://www.kurtvile.com/' },
      { placement: 20, seed: 9,  abbreviation: 'Alvvays', name: 'Alvvays',                     url: 'https://alvvays.com/' },
      { placement: 21, seed: 5,  abbreviation: 'Bbadbee', name: 'Beabadoobee',                 url: 'https://www.beabadoobee.com/' },
      { placement: 22, seed: 12, abbreviation: 'Strokes', name: 'The Strokes',                 url: 'http://www.thestrokes.com' },
      { placement: 23, seed: 4,  abbreviation: 'AgnstMe', name: 'Against Me! / Laura Jane Grace', url: 'https://www.laurajanegrace.com/' },
      { placement: 24, seed: 13, abbreviation: 'CSHR',    name: 'Car Seat Headrest',           url: 'https://carseatheadrest.com/' },
      { placement: 25, seed: 6,  abbreviation: 'Spoon',   name: 'Spoon',                       url: 'http://www.spoontheband.com' },
      { placement: 26, seed: 11, abbreviation: 'ArcMnky', name: 'Arctic Monkeys',              url: 'http://www.arcticmonkeys.com' },
      { placement: 27, seed: 3,  abbreviation: 'YYYs',    name: 'Yeah Yeah Yeahs',             url: 'http://www.yeahyeahyeahs.com/' },
      { placement: 28, seed: 14, abbreviation: 'FooFtrs', name: 'Foo Fighters',                url: 'https://foofighters.com/' },
      { placement: 29, seed: 7,  abbreviation: 'NIN',     name: 'Nine Inch Nails',             url: 'https://www.nin.com/' },
      { placement: 30, seed: 10, abbreviation: 'BchBnny', name: 'Beach Bunny',                 url: 'https://www.beachbunnymusic.com/' },
      { placement: 31, seed: 2,  abbreviation: 'Cure',    name: 'The Cure',                    url: 'https://www.thecure.com/' },
      { placement: 32, seed: 15, abbreviation: 'BlcPrty', name: 'Bloc Party',                  url: 'https://blocparty.com/' },
      { placement: 33, seed: 1,  abbreviation: 'JackWht', name: 'Jack White / White Stripes',  url: 'http://www.jackwhiteiii.com' },
      { placement: 34, seed: 16, abbreviation: 'SherMag', name: 'Sheer Mag',                   url: 'https://www.sheer-mag.com/' },
      { placement: 35, seed: 8,  abbreviation: 'IDLES',   name: 'IDLES',                       url: 'https://www.idlesband.com/' },
      { placement: 36, seed: 9,  abbreviation: 'Nationl', name: 'The National',                url: 'https://americanmary.com/' },
      { placement: 37, seed: 5,  abbreviation: 'Garbage', name: 'Garbage',                     url: 'http://www.garbage.com' },
      { placement: 38, seed: 12, abbreviation: 'FrnzFrd', name: 'Franz Ferdinand',             url: 'https://franzferdinand.com/' },
      { placement: 39, seed: 4,  abbreviation: 'DCfC',    name: 'Death Cab For Cutie',         url: 'https://www.deathcabforcutie.com/' },
      { placement: 40, seed: 13, abbreviation: 'Mitski',  name: 'Mitski',                      url: 'https://mitski.com/' },
      { placement: 41, seed: 6,  abbreviation: 'Beths',   name: 'The Beths',                   url: 'https://thebeths.com/' },
      { placement: 42, seed: 11, abbreviation: 'NewPrno', name: 'The New Pornographers',       url: 'https://thenewpornographers.com/' },
      { placement: 43, seed: 3,  abbreviation: 'VmprWkd', name: 'Vampire Weekend',             url: 'http://www.vampireweekend.com' },
      { placement: 44, seed: 14, abbreviation: 'Ramones', name: 'Ramones',                     url: 'https://www.ramones.com/' },
      { placement: 45, seed: 7,  abbreviation: 'TVOTR',   name: 'TV On The Radio',             url: 'https://tvontheradio.com/' },
      { placement: 46, seed: 10, abbreviation: 'TlkgHds', name: 'Talking Heads / David Byrne', url: 'http://davidbyrne.com/' },
      { placement: 47, seed: 2,  abbreviation: 'REM',     name: 'R.E.M.',                      url: 'https://remhq.com/' },
      { placement: 48, seed: 15, abbreviation: 'Hives',   name: 'The Hives',                   url: 'https://www.thehives.com/' },
      { placement: 49, seed: 1,  abbreviation: 'StVnct',  name: 'St. Vincent',                 url: 'http://www.ilovestvincent.com/' },
      { placement: 50, seed: 16, abbreviation: 'YardAct', name: 'Yard Act',                    url: 'https://www.yardactors.com/' },
      { placement: 51, seed: 8,  abbreviation: 'Metric',  name: 'Metric',                      url: 'http://www.ilovemetric.com' },
      { placement: 52, seed: 9,  abbreviation: 'Guster',  name: 'Guster',                      url: 'https://www.guster.com/' },
      { placement: 53, seed: 5,  abbreviation: 'Wxhtche', name: 'Waxahatchee',                 url: 'https://www.waxahatchee.com/' },
      { placement: 54, seed: 12, abbreviation: 'TmImpla', name: 'Tame Impala',                 url: 'https://official.tameimpala.com/' },
      { placement: 55, seed: 4,  abbreviation: 'Beck',    name: 'Beck',                        url: 'http://www.beck.com' },
      { placement: 56, seed: 13, abbreviation: 'Nirvana', name: 'Nirvana',                     url: 'https://www.nirvana.com/' },
      { placement: 57, seed: 6,  abbreviation: 'SSPU',    name: 'Silversun Pickups',           url: 'https://silversunpickups.com/' },
      { placement: 58, seed: 11, abbreviation: 'Vaccins', name: 'The Vaccines',                url: 'https://www.thevaccines.com/' },
      { placement: 59, seed: 3,  abbreviation: 'LCDSyst', name: 'LCD Soundsystem',             url: 'http://lcdsoundsystem.com/main/.' },
      { placement: 60, seed: 14, abbreviation: 'FtrIsld', name: 'Future Islands',              url: 'https://www.future-islands.com/' },
      { placement: 61, seed: 7,  abbreviation: 'Gorllaz', name: 'Gorillaz / Blur',             url: 'https://www.gorillaz.com/' },
      { placement: 62, seed: 10, abbreviation: 'Dcmbrst', name: 'The Decemberists',            url: 'https://www.decemberists.com/' },
      { placement: 63, seed: 2,  abbreviation: 'MnqnPsy', name: 'Mannequin Pussy',             url: 'https://mannequinpussy.com/' },
      { placement: 64, seed: 15, abbreviation: 'SpdyOtz', name: 'Speedy Ortiz',               url: 'https://www.speedyortiz.com/' },
    ];

    console.log('🎸 Creating 64 groups (bands)...');
    const bandIdByPlacement = new Map<number, number>();

    /* eslint-disable no-await-in-loop */
    for (const b of mrmBands) {
      const created = await payload.create({
        collection: 'modern-rock-madness-groups',
        data: {
          tournament: tournamentId,
          placement: b.placement,
          seed: b.seed,
          abbreviation: b.abbreviation,
          name: b.name,
          url: b.url,
        },
      });
      const id = typeof created.id === 'number' ? created.id : parseInt(created.id as string, 10);
      bandIdByPlacement.set(b.placement, id);
    }
    /* eslint-enable no-await-in-loop */
    console.log('   ✅ Created 64 groups');

    // ── Assign bands to Round 1 matches (1-32) ──────────────────────────────
    console.log('⚔️  Assigning bands to Round 1 matches (1-32)...');
    /* eslint-disable no-await-in-loop */
    for (let m = 1; m <= 32; m += 1) {
      const [p1, p2] = r1BandPair(m);
      await payload.update({
        collection: 'modern-rock-madness-matches',
        id: matchIdByNumber.get(m) as number,
        data: {
          band1: bandIdByPlacement.get(p1),
          band2: bandIdByPlacement.get(p2),
        },
      });
    }
    /* eslint-enable no-await-in-loop */
    console.log('   ✅ Round 1 bands assigned');

    console.log('\n✅ Fresh MRM tournament seeded successfully!\n');
    console.log('📊 Summary:');
    console.log('   Tournament: Modern Rock Madness 2026 (active)');
    console.log('   Groups: 64 bands');
    console.log('   Matches: 63 (match 1 currently running, rest in future)');
    console.log('   Winners: none (fresh tournament)');
    console.log('   Votes: none (fresh tournament)');
    console.log('\n🎭 Run e2e tests: yarn test:e2e');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding fresh MRM data:', error);
    process.exit(1);
  }
}

seedMrmFresh();
