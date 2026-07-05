/* eslint-disable no-console, no-continue, max-len, @typescript-eslint/no-use-before-define */
/**
 * One-shot script to bring prod Postgres concerts into parity with the
 * legacy MySQL concerts page ahead of the cutover. Idempotent.
 *
 * Usage:
 *   yarn tsx -r dotenv/config bin/sync-concerts-for-cutover.ts            # dry run (default)
 *   yarn tsx -r dotenv/config bin/sync-concerts-for-cutover.ts --apply    # actually write
 *
 * Requires DATABASE_URI in .env pointing at the target Postgres.
 */
import 'dotenv/config';
import { Pool, type PoolClient } from 'pg';

const APPLY = process.argv.includes('--apply');

type Plain = string;
type Lexical = Record<string, unknown>;

function lexicalFromHtml(html: string): Lexical {
  // Tiny purpose-built parser: supports <em>/<i> as italic, <strong>/<b> as bold,
  // and a single optional <a href="...">. Any other tags are stripped as plain text.
  const children: Array<Record<string, unknown>> = [];
  let i = 0;
  while (i < html.length) {
    const tagOpen = html.indexOf('<', i);
    if (tagOpen === -1) {
      const text = html.slice(i);
      if (text) children.push(textNode(text, 0));
      break;
    }
    if (tagOpen > i) children.push(textNode(html.slice(i, tagOpen), 0));
    const tagClose = html.indexOf('>', tagOpen);
    if (tagClose === -1) break;
    const tag = html.slice(tagOpen + 1, tagClose).toLowerCase();
    const tagName = tag.replace(/\s.*$/, '').replace(/^\//, '');
    const closeIdx = html.toLowerCase().indexOf(`</${tagName}>`, tagClose);
    const innerEnd = closeIdx === -1 ? html.length : closeIdx;
    const inner = html.slice(tagClose + 1, innerEnd);
    if (tagName === 'em' || tagName === 'i') children.push(textNode(stripTags(inner), 2));
    else if (tagName === 'strong' || tagName === 'b') children.push(textNode(stripTags(inner), 1));
    else children.push(textNode(stripTags(inner), 0));
    i = closeIdx === -1 ? html.length : closeIdx + tagName.length + 3;
  }
  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr',
      children: [
        {
          type: 'paragraph',
          format: '',
          indent: 0,
          version: 1,
          direction: 'ltr',
          textFormat: 0,
          children,
        },
      ],
    },
  };
}

function textNode(text: string, format: number) {
  return {
    mode: 'normal',
    text,
    type: 'text',
    style: '',
    detail: 0,
    format,
    version: 1,
  };
}

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, '');
}

function plainFromHtml(html: string): Plain {
  return stripTags(html).replace(/\s+/g, ' ').trim();
}

type Action = { kind: 'sql'; label: string; sql: string; values?: unknown[] };

async function plan(client: PoolClient): Promise<Action[]> {
  const out: Action[] = [];

  // -------- DELETE Swell 16 dupe (id=4493) --------
  const swellDupe = await client.query('SELECT id FROM concerts WHERE id = 4493');
  if (swellDupe.rows.length > 0) {
    out.push({
      kind: 'sql',
      label: 'DELETE concerts_rels for id=4493 (Swell 16 dupe)',
      sql: 'DELETE FROM concerts_rels WHERE parent_id = $1',
      values: [4493],
    });
    out.push({
      kind: 'sql',
      label: 'DELETE concert id=4493 (Swell 16 dupe)',
      sql: 'DELETE FROM concerts WHERE id = $1',
      values: [4493],
    });
  }

  // -------- UPDATE Geese 11/07 (id=4499) and 11/08 (id=4500) → SOLD OUT --------
  for (const id of [4499, 4500]) {
    const r = await client.query('SELECT id, ticket_info FROM concerts WHERE id = $1', [id]);
    if (r.rows.length > 0 && r.rows[0].ticket_info !== 'SOLD OUT') {
      out.push({
        kind: 'sql',
        label: `UPDATE Geese id=${id} ticket_info → SOLD OUT`,
        sql: "UPDATE concerts SET ticket_info = 'SOLD OUT', ticket_url = '', updated_at = NOW() WHERE id = $1",
        values: [id],
      });
    }
  }

  // -------- UPDATE Liz Phair (id=4501): custom title + ticket_info --------
  const liz = await client.query(
    'SELECT id, title_plain, ticket_info FROM concerts WHERE id = 4501',
  );
  if (liz.rows.length > 0) {
    const desiredTitle = 'Liz Phair & Sleater-Kinney';
    const desiredTicket = 'Tickets Available';
    const needsTitle = liz.rows[0].title_plain !== desiredTitle;
    const needsTicket = liz.rows[0].ticket_info !== desiredTicket;
    if (needsTitle || needsTicket) {
      const lex = lexicalFromHtml(desiredTitle);
      out.push({
        kind: 'sql',
        label: `UPDATE Liz Phair id=4501 title="${desiredTitle}" ticket_info="${desiredTicket}"`,
        sql: 'UPDATE concerts SET title = $1::jsonb, title_html = $2, title_plain = $3, ticket_info = $4, updated_at = NOW() WHERE id = 4501',
        values: [JSON.stringify(lex), desiredTitle, desiredTitle, desiredTicket],
      });
    }
  }

  // -------- ENSURE Citizen artist exists --------
  const citizen = await client.query(
    "SELECT id FROM artists WHERE LOWER(name) = LOWER('Citizen') LIMIT 1",
  );
  let citizenId: number;
  if (citizen.rows.length > 0) {
    citizenId = citizen.rows[0].id;
  } else if (APPLY) {
    const ins = await client.query(
      "INSERT INTO artists (name, slug, updated_at, created_at) VALUES ('Citizen', 'citizen', NOW(), NOW()) RETURNING id",
    );
    citizenId = ins.rows[0].id;
    console.log(`(applied inline) Created artist Citizen id=${citizenId}`);
  } else {
    citizenId = -1; // placeholder for dry-run output
    out.push({
      kind: 'sql',
      label: "INSERT artist 'Citizen' (will get fresh id at apply time)",
      sql: "INSERT INTO artists (name, updated_at, created_at) VALUES ('Citizen', NOW(), NOW())",
    });
  }

  // -------- ADD missing concerts --------
  type ConcertSpec = {
    date: string; // ISO with TZ
    titleHtml: string; // explicit display title
    venueId: number;
    headlinerArtistId: number; // single artist link to satisfy required relation
    ticketInfo: string;
    ticketUrl: string;
  };
  const adds: ConcertSpec[] = [
    {
      date: '2026-07-10T19:00:00-04:00',
      titleHtml: 'Hurry (Album Release Show) w/ SAD13',
      venueId: 8, // Johnny Brenda's
      headlinerArtistId: 1080, // Hurry
      ticketInfo: 'Tickets Available',
      ticketUrl:
        'https://johnnybrendas.com/event/hurry-2/johnny-brendas/philadelphia-pennsylvania/',
    },
    {
      date: '2026-07-24T19:00:00-04:00',
      titleHtml: 'Spirit of The Beehive',
      venueId: 145, // Spruce Street Harbor Park
      headlinerArtistId: 1293, // Spirit of The Beehive
      ticketInfo: 'FREE SHOW',
      ticketUrl:
        'https://dice.fm/partner/tickets/event/eomwyy-spirit-of-the-beehive-24th-jul-spruce-street-harbor-philadelphia-tickets',
    },
    {
      date: '2026-08-29T19:00:00-04:00',
      titleHtml: 'Citizen w/ Hotline TNT and Rocket',
      venueId: 25, // Union Transfer
      headlinerArtistId: citizenId,
      ticketInfo: 'Tickets Available',
      ticketUrl: 'https://www.axs.com/events/1417965',
    },
    {
      date: '2026-09-21T19:00:00-04:00',
      titleHtml: 'Suki Waterhouse',
      venueId: 135, // The Fillmore
      headlinerArtistId: 1858, // Suki Waterhouse
      ticketInfo: 'Tickets Available',
      ticketUrl: 'https://www.ticketmaster.com/event/02006497A10DFC7C',
    },
  ];

  for (const c of adds) {
    // Idempotency check: same date + venue + headliner already linked = skip
    const exists = await client.query(
      `SELECT c.id FROM concerts c
       JOIN concerts_rels r ON r.parent_id = c.id AND r.path = 'artists' AND r.artists_id = $3
       WHERE c.date::date = $1::date AND c.venue_id = $2 LIMIT 1`,
      [c.date.slice(0, 10), c.venueId, c.headlinerArtistId],
    );
    if (exists.rows.length > 0) {
      console.log(
        `SKIP add (already present id=${exists.rows[0].id}): ${c.date.slice(0, 10)} ${c.titleHtml}`,
      );
      continue;
    }
    const lex = lexicalFromHtml(c.titleHtml);
    out.push({
      kind: 'sql',
      label: `INSERT concert ${c.date.slice(0, 10)} "${c.titleHtml}" @ venue=${c.venueId}`,
      sql: `INSERT INTO concerts (title, title_html, title_plain, date, venue_id, ticket_info, ticket_url, _status, updated_at, created_at)
            VALUES ($1::jsonb, $2, $3, $4::timestamptz, $5, $6, $7, 'published', NOW(), NOW())
            RETURNING id`,
      values: [
        JSON.stringify(lex),
        c.titleHtml,
        plainFromHtml(c.titleHtml),
        c.date,
        c.venueId,
        c.ticketInfo,
        c.ticketUrl,
      ],
    });
    out.push({
      kind: 'sql',
      label: `INSERT concerts_rels artists_id=${c.headlinerArtistId} for the concert just inserted`,
      sql: `INSERT INTO concerts_rels ("order", parent_id, path, artists_id)
            VALUES (1, currval('concerts_id_seq'), 'artists', $1)`,
      values: [c.headlinerArtistId],
    });
  }

  return out;
}

async function main() {
  if (!process.env.DATABASE_URI) throw new Error('DATABASE_URI not set');
  const pool = new Pool({ connectionString: process.env.DATABASE_URI });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const actions = await plan(client);
    console.log(`\n=== ${APPLY ? 'APPLY' : 'DRY RUN'} - ${actions.length} action(s) ===\n`);
    for (const a of actions) {
      console.log(`• ${a.label}`);
      if (!APPLY) continue;
      const result = await client.query(a.sql, a.values);
      if (result.rows.length > 0) console.log(`    → ${JSON.stringify(result.rows[0])}`);
    }
    if (APPLY) {
      await client.query('COMMIT');
      console.log('\n✓ Committed.');
    } else {
      await client.query('ROLLBACK');
      console.log('\n(dry run — no changes made; pass --apply to execute)');
    }
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
