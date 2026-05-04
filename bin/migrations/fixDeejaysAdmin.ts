/**
 * Pre-cutover admin fixes for the deejays page on dev Neon:
 *
 *  1. Issue #598: duplicate "Josh T. Landow" — there are two DJ rows
 *     (legacy_id=1, on_air=false) and (legacy_id=79, on_air=true). The
 *     legacy import created the first one; the active record is the
 *     second. Soft-delete the duplicate by setting _status='draft' so
 *     admins still see it for reference but it never renders publicly.
 *
 *  2. Issue #596: Judy G. has no photo in dev Neon. The legacy production
 *     site uses https://i.imgur.com/MARUqpa.jpg. Create a media record
 *     pointing at that URL and link Judy (id=75) to it.
 *
 *  3. Issue #596: Sort order parity with prod. The two-column deejays page
 *     splits the SQL result by index (even → left, odd → right). Prod
 *     shows Adrienne in left col position 2 and Joey O. in right col
 *     position 1; dev has them swapped because Adrienne's sort_order=1
 *     (odd) and Joey O.'s sort_order=2 (even). Swap their sort_order so
 *     they land in the matching columns.
 *
 *  4. Issue #596: Display name parity — prod calls Emily K. "Em K.".
 *     Update both the DJ display_name and the linked person name.
 *
 * Idempotent. Run with --env dev (default) or --env prod.
 */

// eslint-disable-next-line import/no-extraneous-dependencies
import { Command } from 'commander';
import { getPayloadClient } from './shared/payloadClient';
import { createLogger } from './shared/logger';

const logger = createLogger('FixDeejaysAdmin');

const JUDY_LEGACY_NAME = 'Judy G.';
const JUDY_PHOTO_URL = 'https://i.imgur.com/MARUqpa.jpg';
const DUPLICATE_JOSH_LEGACY_ID = 1;

interface Options {
  env: 'dev' | 'prod';
  dryRun: boolean;
}

async function fixDuplicateJosh(payload: any, dryRun: boolean): Promise<void> {
  const found = await payload.find({
    collection: 'djs',
    where: { legacyId: { equals: DUPLICATE_JOSH_LEGACY_ID } },
    limit: 1,
  });
  const dj = found.docs[0];
  if (!dj) {
    logger.warn(`No DJ with legacyId=${DUPLICATE_JOSH_LEGACY_ID} found — nothing to do.`);
    return;
  }
  if (dj._status === 'draft') {
    logger.info(`Duplicate Josh (id=${dj.id}) is already draft — skip.`);
    return;
  }
  logger.info(
    `Setting duplicate Josh (id=${dj.id}, displayName="${dj.displayName}") to _status=draft`,
  );
  if (!dryRun) {
    await payload.update({
      collection: 'djs',
      id: dj.id,
      data: { _status: 'draft' },
    });
  }
}

async function fixJudyPhoto(payload: any, dryRun: boolean): Promise<void> {
  const found = await payload.find({
    collection: 'djs',
    where: { displayName: { equals: JUDY_LEGACY_NAME } },
    limit: 1,
  });
  const judy = found.docs[0];
  if (!judy) {
    logger.warn(`Could not find DJ "${JUDY_LEGACY_NAME}" — nothing to do.`);
    return;
  }
  if (judy.photo) {
    logger.info(
      `${JUDY_LEGACY_NAME} (id=${judy.id}) already has a photo (id=${typeof judy.photo === 'object' ? judy.photo.id : judy.photo}). Skip.`,
    );
    return;
  }

  // Payload's media collection is upload-only via the API. Drop down to SQL
  // for a legacy-URL-only media row that PostgresDeejay's CASE expression
  // will surface via m.legacy_url.
  const db = payload.db.drizzle.session.client;
  const existing = await db.query('SELECT id FROM media WHERE legacy_url = $1 LIMIT 1', [
    JUDY_PHOTO_URL,
  ]);
  let mediaId: number;
  if (existing.rows[0]) {
    mediaId = existing.rows[0].id;
    logger.info(`Reusing existing media id=${mediaId}`);
  } else {
    logger.info(`Creating media row with legacy_url=${JUDY_PHOTO_URL}`);
    if (dryRun) {
      mediaId = -1;
    } else {
      const ins = await db.query(
        'INSERT INTO media (alt, legacy_url, mime_type, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW()) RETURNING id',
        [`Photo of ${JUDY_LEGACY_NAME}`, JUDY_PHOTO_URL, 'image/jpeg'],
      );
      mediaId = ins.rows[0].id;
      logger.info(`Created media id=${mediaId}`);
    }
  }

  logger.info(`Linking ${JUDY_LEGACY_NAME} (id=${judy.id}) to media id=${mediaId}`);
  if (!dryRun) {
    await db.query('UPDATE djs SET photo_id = $1, updated_at = NOW() WHERE id = $2', [
      mediaId,
      judy.id,
    ]);
  }
}

async function fixSortOrderSwap(payload: any, dryRun: boolean): Promise<void> {
  const db = payload.db.drizzle.session.client;
  const { rows } = await db.query(
    "SELECT id, display_name, sort_order FROM djs WHERE display_name IN ('Adrienne', 'Joey O.') AND COALESCE(on_air, true) = true ORDER BY display_name",
  );
  const adrienne = rows.find((r: any) => r.display_name === 'Adrienne');
  const joey = rows.find((r: any) => r.display_name === 'Joey O.');
  if (!adrienne || !joey) {
    logger.warn('Could not find both Adrienne and Joey O. on-air rows — skip swap.');
    return;
  }
  if (adrienne.sort_order === 2 && joey.sort_order === 1) {
    logger.info('Sort order already swapped (Adrienne=2, Joey O.=1) — skip.');
    return;
  }
  if (adrienne.sort_order !== 1 || joey.sort_order !== 2) {
    logger.warn(
      `Unexpected sort_order state Adrienne=${adrienne.sort_order} JoeyO.=${joey.sort_order} — skip swap to avoid clobbering manual edits.`,
    );
    return;
  }
  logger.info(`Swapping sort_order: Adrienne (id=${adrienne.id}) 1→2, Joey O. (id=${joey.id}) 2→1`);
  if (!dryRun) {
    // Use a temporary value to avoid the unique-ish constraint pattern, if any.
    await db.query('UPDATE djs SET sort_order = 9999, updated_at = NOW() WHERE id = $1', [
      adrienne.id,
    ]);
    await db.query('UPDATE djs SET sort_order = 1, updated_at = NOW() WHERE id = $1', [joey.id]);
    await db.query('UPDATE djs SET sort_order = 2, updated_at = NOW() WHERE id = $1', [
      adrienne.id,
    ]);
  }
}

async function fixEmilyToEm(payload: any, dryRun: boolean): Promise<void> {
  const db = payload.db.drizzle.session.client;
  const { rows: djRows } = await db.query(
    "SELECT id, display_name FROM djs WHERE display_name IN ('Emily K.', 'Em K.') LIMIT 1",
  );
  const dj = djRows[0];
  if (!dj) {
    logger.warn('Could not find Emily K. / Em K. DJ row — skip.');
    return;
  }
  if (dj.display_name === 'Em K.') {
    logger.info(`DJ display_name already "Em K." (id=${dj.id}) — skip.`);
  } else {
    logger.info(`Renaming DJ id=${dj.id} display_name "Emily K." → "Em K."`);
    if (!dryRun) {
      await db.query("UPDATE djs SET display_name = 'Em K.', updated_at = NOW() WHERE id = $1", [
        dj.id,
      ]);
    }
  }
  // Update linked person row that drives the rendered <h2>.
  const { rows: peopleRows } = await db.query(
    `SELECT p.id, p.name FROM people p
     JOIN djs_rels dr ON dr.people_id = p.id
     WHERE dr.parent_id = $1 AND dr.path = 'person'`,
    [dj.id],
  );
  for (const person of peopleRows) {
    if (person.name === 'Em K.') {
      logger.info(`Person id=${person.id} already "Em K." — skip.`);
    } else if (person.name !== 'Emily K.') {
      logger.warn(`Skipping person id=${person.id} with unexpected name "${person.name}".`);
    } else {
      logger.info(`Renaming person id=${person.id} "Emily K." → "Em K."`);
      if (!dryRun) {
        await db.query("UPDATE people SET name = 'Em K.', updated_at = NOW() WHERE id = $1", [
          person.id,
        ]);
      }
    }
  }
}

/**
 * Issue: Concert titles + sold-out status parity with prod (ynotradio.net).
 *
 * The legacy import left some concerts with NULL/empty `title` (so the public
 * page shows just the artist names joined) and some with stale `ticket_info`
 * (mostly missing SOLD OUT badges or stale "Tickets Available"). This applies
 * the canonical mapping confirmed against legacy production for all currently
 * visible concerts.
 *
 * Match by (date::date, venue.name) so timezone offsets in `concerts.date`
 * (mixed 00:00 UTC vs 04:00 UTC) don't affect lookup. Idempotent: only writes
 * when current value differs.
 */
interface ConcertFix {
  date: string; // YYYY-MM-DD
  venue: string;
  title?: string;
  ticketInfo?: string;
}

const CONCERT_FIXES: ConcertFix[] = [
  // Title fixes (and combined title/ticket_info where applicable)
  {
    date: '2026-05-03',
    venue: 'Ardmore Music Hall',
    title: 'Brian Fallon (Sing Us Home After Party)',
  },
  { date: '2026-05-09', venue: 'First Unitarian Church', title: 'Gladie w/ Noun' },
  { date: '2026-05-11', venue: 'Union Transfer', title: 'Iron & Wine' },
  { date: '2026-05-12', venue: 'The Fillmore', title: 'Courtney Barnett w/ Momma' },
  { date: '2026-05-15', venue: 'Ukie Club', title: 'Mal Blum and Oceanator' },
  { date: '2026-05-15', venue: 'Ardmore Music Hall', title: 'Southern Culture on the Skids' },
  { date: '2026-05-22', venue: 'Union Transfer', title: 'Toadies w/ Local H' },
  { date: '2026-05-29', venue: 'PhilaMOCA', title: 'Tim Kasher (of Cursive)' },
  { date: '2026-05-29', venue: "Johnny Brenda's", title: 'Just Mustard & Miss Grit' },
  { date: '2026-05-31', venue: 'The Fillmore', title: 'Ben Folds and A Piano' },
  {
    date: '2026-06-06',
    venue: 'TLA',
    title: 'Pete Yorn (Musicforthemorningafter 25th Anniversary / Solo Acoustic)',
  },
  { date: '2026-06-08', venue: 'Mann Skyline Stage', title: 'Amyl and The Sniffers' },
  {
    date: '2026-06-23',
    venue: 'Franklin Music Hall',
    title: 'Black Country, New Road w/ Horsegirl',
  },
  {
    date: '2026-06-23',
    venue: 'The Fillmore',
    title: 'Spoon & The Beths',
    ticketInfo: 'Tickets Available',
  },
  { date: '2026-06-25', venue: 'Underground Arts', title: 'of Montreal' },
  {
    date: '2026-06-26',
    venue: 'Mann Center',
    title: 'The Strokes w/ Thundercat & Hamilton Leithauser',
    ticketInfo: 'SOLD OUT',
  },
  { date: '2026-06-28', venue: 'The Met', title: 'The Human League w/ Soft Cell & Alison Moyet' },
  { date: '2026-07-10', venue: 'Union Transfer', title: 'American Football w/ IAN SWEET' },
  {
    date: '2026-07-10',
    venue: 'Kung Fu Necktie',
    title: "Y-Not Radio's Swell 16 Celebration w/ WAAX and The Blackburns",
  },
  { date: '2026-07-15', venue: 'Xfinity Mobile Arena', title: 'Tame Impala w/ Djo' },
  {
    date: '2026-07-17',
    venue: 'Borgata Event Center (Atlantic City)',
    title: '"Weird Al" Yankovic',
  },
  {
    date: '2026-07-17',
    venue: 'Mann Center',
    title: 'Death Cab For Cutie w/ Japanese Breakfast',
    ticketInfo: 'Tickets Available',
  },
  { date: '2026-07-23', venue: 'Underground Arts', title: 'Man Man w/ Death Valley Girls' },
  {
    date: '2026-07-24',
    venue: 'Dell Music Center',
    title: 'Make The World Better Concert w/ Pavement and Ratboys',
  },
  {
    date: '2026-07-25',
    venue: 'Dell Music Center',
    title: 'Make The World Better Concert w/ Kurt Vile and They Are Gutting A Body of Water',
  },
  { date: '2026-07-28', venue: 'The Met', title: 'Metric w/ Broken Social Scene and Stars' },
  { date: '2026-08-01', venue: 'The Met', title: 'Tori Amos w/ Bartees Strange' },
  {
    date: '2026-08-04',
    venue: 'Wind Creek Steel Stage (Bethlehem, PA)',
    title: '"Weird Al" Yankovic',
  },
  {
    date: '2026-08-13',
    venue: 'Lincoln Financial Field',
    title: 'Foo Fighters w/ Queens of The Stone Age & Mannequin Pussy',
  },
  {
    date: '2026-09-05',
    venue: 'Mann Center',
    title: 'Empire of The Sun',
    ticketInfo: 'Tickets Available',
  },
  {
    date: '2026-09-06',
    venue: 'Xfinity Mobile Arena',
    title: 'Lily Allen (performing West End Girl)',
    ticketInfo: 'Tickets Available',
  },
  {
    date: '2026-09-29',
    venue: 'Xfinity Mobile Arena',
    title: 'Weezer w/ The Shins and Silversun Pickups',
    ticketInfo: 'Tickets Available',
  },
  { date: '2026-11-07', venue: "Johnny Brenda's", title: 'Teen Jesus and The Jean Teasers' },
  // Ticket-info-only fixes
  { date: '2026-05-12', venue: 'The Foundry', ticketInfo: 'SOLD OUT' },
  { date: '2026-05-15', venue: 'Union Transfer', ticketInfo: 'SOLD OUT' },
  { date: '2026-05-16', venue: 'Union Transfer', ticketInfo: 'SOLD OUT' },
  { date: '2026-05-17', venue: 'Union Transfer', ticketInfo: 'Tickets Available' },
  { date: '2026-07-29', venue: 'Freedom Mortgage Pavilion', ticketInfo: 'Tickets Available' },
  { date: '2026-09-25', venue: 'The Fillmore', ticketInfo: 'Tickets Available' },
  { date: '2026-09-26', venue: 'The Fillmore', ticketInfo: 'Tickets Available' },
  { date: '2026-10-12', venue: 'Union Transfer', ticketInfo: 'Tickets Available' },
  { date: '2026-10-13', venue: 'Union Transfer', ticketInfo: 'Tickets Available' },
];

async function fixConcertTitlesAndStatuses(payload: any, dryRun: boolean): Promise<void> {
  const db = payload.db.drizzle.session.client;
  let updated = 0;
  let skipped = 0;
  let missing = 0;

  for (const fix of CONCERT_FIXES) {
    const { rows } = await db.query(
      `SELECT c.id, c.title, c.ticket_info
         FROM concerts c
         JOIN venues v ON v.id = c.venue_id
        WHERE c.date::date = $1::date AND v.name = $2 AND c._status = 'published'`,
      [fix.date, fix.venue],
    );
    if (rows.length === 0) {
      logger.warn(`MISSING concert ${fix.date} @ ${fix.venue} — skipping (legacy import gap).`);
      missing += 1;
    } else {
      if (rows.length > 1) {
        logger.warn(
          `Multiple concerts on ${fix.date} @ ${fix.venue} (${rows.length}) — applying to all.`,
        );
      }

      // eslint-disable-next-line no-restricted-syntax
      for (const row of rows) {
        const sets: string[] = [];
        const params: any[] = [];
        let p = 1;
        const label = `concert id=${row.id} (${fix.date} @ ${fix.venue})`;

        if (fix.title !== undefined && row.title !== fix.title) {
          sets.push(`title = $${p}`);
          params.push(fix.title);
          p += 1;
        }
        if (fix.ticketInfo !== undefined && row.ticket_info !== fix.ticketInfo) {
          sets.push(`ticket_info = $${p}`);
          params.push(fix.ticketInfo);
          p += 1;
        }

        if (sets.length === 0) {
          logger.info(`${label} already correct — skip.`);
          skipped += 1;
        } else {
          const summary = sets
            .map((s) => s.split(' = ')[0])
            .map((field) => {
              if (field === 'title') return `title="${fix.title}" (was: ${row.title === null ? 'NULL' : `"${row.title}"`})`;
              if (field === 'ticket_info') return `ticket_info="${fix.ticketInfo}" (was: "${row.ticket_info}")`;
              return field;
            })
            .join(', ');

          logger.info(`${label} → ${summary}`);
          if (!dryRun) {
            params.push(row.id);
            await db.query(
              `UPDATE concerts SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $${p}`,
              params,
            );
          }
          updated += 1;
        }
      }
    }
  }
  logger.info(`Concert fixes: ${updated} updated, ${skipped} already-correct, ${missing} missing.`);
}

async function run(options: Options) {
  logger.info(`Starting deejays admin fixes (env=${options.env}, dryRun=${options.dryRun})`);
  process.env.PAYLOAD_MIGRATING = 'true';
  const payload = await getPayloadClient(options.env);
  await fixDuplicateJosh(payload, options.dryRun);
  await fixJudyPhoto(payload, options.dryRun);
  await fixSortOrderSwap(payload, options.dryRun);
  await fixEmilyToEm(payload, options.dryRun);
  await fixConcertTitlesAndStatuses(payload, options.dryRun);
  logger.info('Done.');
}

const program = new Command();
program
  .option('--env <env>', 'dev or prod', 'dev')
  .option('--dry-run', 'do not write changes', false)
  .action(async (opts) => {
    try {
      await run({ env: opts.env, dryRun: !!opts.dryRun });
      process.exit(0);
    } catch (e) {
      logger.error('Failed:', e);
      process.exit(1);
    }
  });
program.parse(process.argv);
