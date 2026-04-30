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
 *   - Match 1 is set to be currently RUNNING (start: now-2h, end: now+2h)
 *   - All other matches are rebased relative to now (always in the future)
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
    // Use CLI arg if provided (e.g. `yarn seed:mrm:fresh 2026-03-18`),
    // otherwise snap to next Monday for a clean schedule.
    const startDate = process.argv[2] ?? nextMonday(new Date());
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
    const tournamentId = typeof tournament.id === 'number' ? tournament.id : parseInt(tournament.id, 10);
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

    // ── Rewrite match times relative to "now" ──────────────────────────────
    // The scaffold hook assigns absolute UTC times based on the startDate.
    // If seeding happens after some of those times, those matches end up in
    // the past and the "next match" query returns a different match than the
    // tests expect. Fix: rebase every match's times relative to now.
    const now = new Date();
    const baseDate = new Date(`${startDate}T00:00:00.000Z`);

    /* eslint-disable no-await-in-loop */
    for (const m of scaffoldedMatches) {
      const mn = typeof m.matchNumber === 'number' ? m.matchNumber : parseInt(m.matchNumber as string, 10);

      if (mn === 1) {
        // Match 1: currently running (wide ±2h window for slow CI)
        const match1Start = new Date(now.getTime() - 2 * 60 * 60 * 1000);
        const match1End = new Date(now.getTime() + 2 * 60 * 60 * 1000);
        await payload.update({
          collection: 'modern-rock-madness-matches',
          id: matchIdByNumber.get(1) as number,
          data: {
            startTime: match1Start.toISOString(),
            endTime: match1End.toISOString(),
          },
        });
      } else {
        // Shift: preserve offset from midnight of startDate, rebase onto now
        const origStart = new Date(m.startTime as string);
        const origEnd = new Date(m.endTime as string);
        const offsetMs = origStart.getTime() - baseDate.getTime();
        const durationMs = origEnd.getTime() - origStart.getTime();
        const newStart = new Date(now.getTime() + offsetMs);
        const newEnd = new Date(newStart.getTime() + durationMs);

        await payload.update({
          collection: 'modern-rock-madness-matches',
          id: matchIdByNumber.get(mn) as number,
          data: {
            startTime: newStart.toISOString(),
            endTime: newEnd.toISOString(),
          },
        });
      }
    }
    /* eslint-enable no-await-in-loop */
    console.log('   ✅ All match times rebased relative to now');

    // ── 64 Groups (bands) ───────────────────────────────────────────────────
    // Same roster as the 2025 tournament for realistic test data.
    const mrmBands = [
      {
        placement: 1,
        seed: 1,
        abbreviation: 'JBrekie',
        name: 'Japanese Breakfast',
        url: 'http://japanesebreakfast.rocks/',
        sponsor: 'Dave Mooney',
      },
      {
        placement: 2,
        seed: 16,
        abbreviation: 'ChlyBls',
        name: 'Charly Bliss',
        url: 'https://charlybliss.os.fan/',
        sponsor: 'Wendy Kessler',
      },
      {
        placement: 3,
        seed: 8,
        abbreviation: 'Wombats',
        name: 'The Wombats',
        url: 'https://www.thewombats.co.uk/',
        sponsor: 'David Cohen',
      },
      {
        placement: 4,
        seed: 9,
        abbreviation: 'Jpndrds',
        name: 'Japandroids',
        url: 'https://japandroids.com/',
        sponsor: 'Vincent Smith',
      },
      {
        placement: 5,
        seed: 5,
        abbreviation: 'Clash',
        name: 'The Clash',
        url: 'https://www.theclash.com/',
        sponsor: 'Vincent Smith',
      },
      {
        placement: 6,
        seed: 12,
        abbreviation: 'Cake',
        name: 'Cake',
        url: 'https://www.cakemusic.com/',
        sponsor: 'Orlan Santos',
      },
      {
        placement: 7,
        seed: 4,
        abbreviation: 'CHVRCHS',
        name: 'CHVRCHES',
        url: 'http://www.chvrch.es/',
        sponsor: 'Marisa Lumino',
      },
      {
        placement: 8,
        seed: 13,
        abbreviation: 'SlvnEso',
        name: 'Sylvan Esso',
        url: 'https://www.sylvanesso.com/',
        sponsor: 'David Cohen',
      },
      {
        placement: 9,
        seed: 6,
        abbreviation: 'Lindas',
        name: 'The Linda Lindas',
        url: 'https://www.thelindalindas.com/',
        sponsor: 'Brian Osborn',
      },
      {
        placement: 10,
        seed: 11,
        abbreviation: 'BenFlds',
        name: 'Ben Folds (Five)',
        url: 'https://www.benfolds.com/',
        sponsor: 'Thomas Rife',
      },
      {
        placement: 11,
        seed: 3,
        abbreviation: 'Beastie',
        name: 'Beastie Boys',
        url: 'http://beastieboys.com/',
        sponsor: 'Jennifer Kondracki',
      },
      {
        placement: 12,
        seed: 14,
        abbreviation: 'DaftPnk',
        name: 'Daft Punk',
        url: 'https://daftpunk.com/',
        sponsor: 'Andrew Dippell',
      },
      {
        placement: 13,
        seed: 7,
        abbreviation: 'WrOnDrg',
        name: 'The War on Drugs',
        url: 'http://www.thewarondrugs.net/home',
        sponsor: 'Jason Rohde',
      },
      {
        placement: 14,
        seed: 10,
        abbreviation: 'Interpl',
        name: 'Interpol',
        url: 'https://www.interpolnyc.com/',
        sponsor: 'Dave Mazzone',
      },
      {
        placement: 15,
        seed: 2,
        abbreviation: 'Rdohead',
        name: 'Radiohead / The Smile',
        url: 'https://radiohead.com/',
        sponsor: 'Mary Holman',
      },
      {
        placement: 16,
        seed: 15,
        abbreviation: 'NadaSrf',
        name: 'Nada Surf',
        url: 'https://www.nadasurf.com/',
        sponsor: 'Jennifer Kondracki',
      },
      {
        placement: 17,
        seed: 1,
        abbreviation: 'FntnsDC',
        name: 'Fontaines D.C.',
        url: 'https://fontainesdc.com/',
        sponsor: 'Jim McAndrew',
      },
      {
        placement: 18,
        seed: 16,
        abbreviation: 'ClnRose',
        name: 'Caroline Rose',
        url: 'https://www.carolinerosemusic.com/',
        sponsor: 'Scott Hemmons',
      },
      {
        placement: 19,
        seed: 8,
        abbreviation: 'KrtVile',
        name: 'Kurt Vile',
        url: 'https://www.kurtvile.com/',
        sponsor: 'Andrew Gribbin',
      },
      {
        placement: 20,
        seed: 9,
        abbreviation: 'Alvvays',
        name: 'Alvvays',
        url: 'https://alvvays.com/',
        sponsor: 'Gordon Lung',
      },
      {
        placement: 21,
        seed: 5,
        abbreviation: 'Bbadbee',
        name: 'Beabadoobee',
        url: 'https://www.beabadoobee.com/',
        sponsor: 'Michael Cunningham',
      },
      {
        placement: 22,
        seed: 12,
        abbreviation: 'Strokes',
        name: 'The Strokes',
        url: 'http://www.thestrokes.com',
        sponsor: 'Steve Hrobsky',
      },
      {
        placement: 23,
        seed: 4,
        abbreviation: 'AgnstMe',
        name: 'Against Me! / Laura Jane Grace',
        url: 'https://www.laurajanegrace.com/',
        sponsor: 'Richard Crespo',
      },
      {
        placement: 24,
        seed: 13,
        abbreviation: 'CSHR',
        name: 'Car Seat Headrest',
        url: 'https://carseatheadrest.com/',
        sponsor: 'Michael Ferry',
      },
      {
        placement: 25,
        seed: 6,
        abbreviation: 'Spoon',
        name: 'Spoon',
        url: 'http://www.spoontheband.com',
        sponsor: 'David & Pat Schaeffer',
      },
      {
        placement: 26,
        seed: 11,
        abbreviation: 'ArcMnky',
        name: 'Arctic Monkeys',
        url: 'http://www.arcticmonkeys.com',
        sponsor: 'Eric Rusack',
      },
      {
        placement: 27,
        seed: 3,
        abbreviation: 'YYYs',
        name: 'Yeah Yeah Yeahs',
        url: 'http://www.yeahyeahyeahs.com/',
        sponsor: 'Steve Quirk',
      },
      {
        placement: 28,
        seed: 14,
        abbreviation: 'FooFtrs',
        name: 'Foo Fighters',
        url: 'https://foofighters.com/',
        sponsor: 'Meredith Drumheller',
      },
      {
        placement: 29,
        seed: 7,
        abbreviation: 'NIN',
        name: 'Nine Inch Nails',
        url: 'https://www.nin.com/',
        sponsor: 'Image360 of the Main Line (David Friedenberg)',
      },
      {
        placement: 30,
        seed: 10,
        abbreviation: 'BchBnny',
        name: 'Beach Bunny',
        url: 'https://www.beachbunnymusic.com/',
        sponsor: 'Karen Isaacman',
      },
      {
        placement: 31,
        seed: 2,
        abbreviation: 'Cure',
        name: 'The Cure',
        url: 'https://www.thecure.com/',
        sponsor: 'Dennis Beach',
      },
      {
        placement: 32,
        seed: 15,
        abbreviation: 'BlcPrty',
        name: 'Bloc Party',
        url: 'https://blocparty.com/',
        sponsor: 'Joe Tittermary',
      },
      {
        placement: 33,
        seed: 1,
        abbreviation: 'JackWht',
        name: 'Jack White / White Stripes',
        url: 'http://www.jackwhiteiii.com',
        sponsor: 'Damian Petrone',
      },
      {
        placement: 34,
        seed: 16,
        abbreviation: 'SherMag',
        name: 'Sheer Mag',
        url: 'https://www.sheer-mag.com/',
        sponsor: 'Liz Whelan',
      },
      {
        placement: 35,
        seed: 8,
        abbreviation: 'IDLES',
        name: 'IDLES',
        url: 'https://www.idlesband.com/',
        sponsor: 'Thomas Rife',
      },
      {
        placement: 36,
        seed: 9,
        abbreviation: 'Nationl',
        name: 'The National',
        url: 'https://americanmary.com/',
        sponsor: 'Steve Hrobsky',
      },
      {
        placement: 37,
        seed: 5,
        abbreviation: 'Garbage',
        name: 'Garbage',
        url: 'http://www.garbage.com',
        sponsor: 'David Johnson',
      },
      {
        placement: 38,
        seed: 12,
        abbreviation: 'FrnzFrd',
        name: 'Franz Ferdinand',
        url: 'https://franzferdinand.com/',
        sponsor: 'Daniel Rowan',
      },
      {
        placement: 39,
        seed: 4,
        abbreviation: 'DCfC',
        name: 'Death Cab For Cutie',
        url: 'https://www.deathcabforcutie.com/',
        sponsor: 'Bill Syrros',
      },
      {
        placement: 40,
        seed: 13,
        abbreviation: 'Mitski',
        name: 'Mitski',
        url: 'https://mitski.com/',
        sponsor: 'Eric Rusack',
      },
      {
        placement: 41,
        seed: 6,
        abbreviation: 'Beths',
        name: 'The Beths',
        url: 'https://thebeths.com/',
        sponsor: 'Martin Falasco',
      },
      {
        placement: 42,
        seed: 11,
        abbreviation: 'NewPrno',
        name: 'The New Pornographers',
        url: 'https://thenewpornographers.com/',
        sponsor: 'Jakey Greenberg',
      },
      {
        placement: 43,
        seed: 3,
        abbreviation: 'VmprWkd',
        name: 'Vampire Weekend',
        url: 'http://www.vampireweekend.com',
        sponsor: 'Michael Lebovitz',
      },
      {
        placement: 44,
        seed: 14,
        abbreviation: 'Ramones',
        name: 'Ramones',
        url: 'https://www.ramones.com/',
        sponsor: 'Brandon Pinzini',
      },
      {
        placement: 45,
        seed: 7,
        abbreviation: 'TVOTR',
        name: 'TV On The Radio',
        url: 'https://tvontheradio.com/',
        sponsor: 'George White',
      },
      {
        placement: 46,
        seed: 10,
        abbreviation: 'TlkgHds',
        name: 'Talking Heads / David Byrne',
        url: 'http://davidbyrne.com/',
        sponsor: 'Terry Lautin',
      },
      {
        placement: 47,
        seed: 2,
        abbreviation: 'REM',
        name: 'R.E.M.',
        url: 'https://remhq.com/',
        sponsor: 'Image360 of the Main Line (David Friedenberg)',
      },
      {
        placement: 48,
        seed: 15,
        abbreviation: 'Hives',
        name: 'The Hives',
        url: 'https://www.thehives.com/',
        sponsor: 'Meredith Drumheller',
      },
      {
        placement: 49,
        seed: 1,
        abbreviation: 'StVnct',
        name: 'St. Vincent',
        url: 'http://www.ilovestvincent.com/',
        sponsor: 'Lisa Wetherby',
      },
      {
        placement: 50,
        seed: 16,
        abbreviation: 'YardAct',
        name: 'Yard Act',
        url: 'https://www.yardactors.com/',
        sponsor: 'Gregory Itts',
      },
      {
        placement: 51,
        seed: 8,
        abbreviation: 'Metric',
        name: 'Metric',
        url: 'http://www.ilovemetric.com',
        sponsor: 'Danielle Nutt',
      },
      {
        placement: 52,
        seed: 9,
        abbreviation: 'Guster',
        name: 'Guster',
        url: 'https://www.guster.com/',
        sponsor: 'Michele Gurz',
      },
      {
        placement: 53,
        seed: 5,
        abbreviation: 'Wxhtche',
        name: 'Waxahatchee',
        url: 'https://www.waxahatchee.com/',
        sponsor: 'Madge & Joe Rassman',
      },
      {
        placement: 54,
        seed: 12,
        abbreviation: 'TmImpla',
        name: 'Tame Impala',
        url: 'https://official.tameimpala.com/',
        sponsor: 'Jeffrey Seltzer',
      },
      {
        placement: 55,
        seed: 4,
        abbreviation: 'Beck',
        name: 'Beck',
        url: 'http://www.beck.com',
        sponsor: 'Wendy Kessler',
      },
      {
        placement: 56,
        seed: 13,
        abbreviation: 'Nirvana',
        name: 'Nirvana',
        url: 'https://www.nirvana.com/',
        sponsor: 'David Soto',
      },
      {
        placement: 57,
        seed: 6,
        abbreviation: 'SSPU',
        name: 'Silversun Pickups',
        url: 'https://silversunpickups.com/',
        sponsor: 'Bruce Grant',
      },
      {
        placement: 58,
        seed: 11,
        abbreviation: 'Vaccins',
        name: 'The Vaccines',
        url: 'https://www.thevaccines.com/',
        sponsor: 'Jeanne Martin',
      },
      {
        placement: 59,
        seed: 3,
        abbreviation: 'LCDSyst',
        name: 'LCD Soundsystem',
        url: 'http://lcdsoundsystem.com/main/.',
        sponsor: 'Liz Whelan',
      },
      {
        placement: 60,
        seed: 14,
        abbreviation: 'FtrIsld',
        name: 'Future Islands',
        url: 'https://www.future-islands.com/',
        sponsor: 'Patrick Raimondo',
      },
      {
        placement: 61,
        seed: 7,
        abbreviation: 'Gorllaz',
        name: 'Gorillaz / Blur',
        url: 'https://www.gorillaz.com/',
        sponsor: 'Michael Clarke',
      },
      {
        placement: 62,
        seed: 10,
        abbreviation: 'Dcmbrst',
        name: 'The Decemberists',
        url: 'https://www.decemberists.com/',
        sponsor: 'Danielle Nutt',
      },
      {
        placement: 63,
        seed: 2,
        abbreviation: 'MnqnPsy',
        name: 'Mannequin Pussy',
        url: 'https://mannequinpussy.com/',
        sponsor: 'George White',
      },
      {
        placement: 64,
        seed: 15,
        abbreviation: 'SpdyOtz',
        name: 'Speedy Ortiz',
        url: 'https://www.speedyortiz.com/',
        sponsor: 'Jeffrey Seltzer',
      },
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
          sponsor: b.sponsor,
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

    // ── Shows for date-filter E2E tests ────────────────────────────────────
    // Two fixed dates in the far future to avoid conflicts with other data.
    // Shows are stored at noon UTC to match Payload's dayOnly picker normalization,
    // ensuring the admin list date filter (exact equality) works correctly.
    console.log('📻 Seeding shows for date-filter tests...');
    const SHOW_DATE_A = '2030-06-15T12:00:00.000Z'; // 2 shows on this date
    const SHOW_DATE_B = '2030-06-22T12:00:00.000Z'; // 1 show on this date

    await payload.create({
      collection: 'shows',
      data: { date: SHOW_DATE_A, startTime: '06:11', endTime: '08:11' },
    });
    await payload.create({
      collection: 'shows',
      data: { date: SHOW_DATE_A, startTime: '10:22', endTime: '12:22' },
    });
    await payload.create({
      collection: 'shows',
      data: { date: SHOW_DATE_B, startTime: '14:33', endTime: '16:33' },
    });
    console.log('   ✅ Created 3 test shows (2 on 2030-06-15, 1 on 2030-06-22)');

    console.log('\n✅ Fresh MRM tournament seeded successfully!\n');
    console.log('📊 Summary:');
    console.log('   Tournament: Modern Rock Madness 2026 (active)');
    console.log('   Groups: 64 bands');
    console.log('   Matches: 63 (match 1 currently running, rest in future)');
    console.log('   Winners: none (fresh tournament)');
    console.log('   Votes: none (fresh tournament)');
    console.log('   Shows: 3 (for date-filter E2E tests)');
    console.log('\n🎭 Run e2e tests: yarn test:e2e');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding fresh MRM data:', error);
    process.exit(1);
  }
}

seedMrmFresh();
