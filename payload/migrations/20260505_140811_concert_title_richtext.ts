import { sql } from '@payloadcms/db-postgres';
import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres';
import { htmlTitleToLexical } from '../../bin/migrations/shared/htmlTitleToLexical.ts';
import { convertConcertTitleToPlain } from '../src/utils/concertTitle.ts';

/**
 * Convert concerts.title from plain varchar (which historically held raw HTML
 * smuggled in by editors) to a Payload Lexical rich-text field, while keeping
 * a server-rendered HTML mirror (title_html) for the legacy PHP renderer and a
 * stripped plain-text mirror (title_plain) for useAsTitle / admin columns.
 *
 * Strategy:
 *   1. Rename existing varchar `title` → `title_html` (preserves the raw HTML
 *      that PHP was already rendering).
 *   2. Add new jsonb `title` and varchar `title_plain` columns.
 *   3. Backfill: parse each existing title_html into Lexical JSON, populate
 *      title (jsonb) and title_plain (stripped text). Empty/null title_html
 *      rows are left null on all three columns.
 *   4. Same on the _concerts_v versions table.
 */

export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  // 1 + 2: schema changes — split into single statements (drizzle/pg won't
  // batch multi-statement strings reliably and the migration silently hangs
  // when more than one DDL is sent in a single execute call).
  await db.execute(sql`ALTER TABLE "concerts" RENAME COLUMN "title" TO "title_html"`);
  await db.execute(sql`ALTER TABLE "concerts" ADD COLUMN "title" jsonb`);
  await db.execute(sql`ALTER TABLE "concerts" ADD COLUMN "title_plain" varchar`);

  await db.execute(sql`ALTER TABLE "_concerts_v" RENAME COLUMN "version_title" TO "version_title_html"`);
  await db.execute(sql`ALTER TABLE "_concerts_v" ADD COLUMN "version_title" jsonb`);
  await db.execute(sql`ALTER TABLE "_concerts_v" ADD COLUMN "version_title_plain" varchar`);

  // 3 + 4: backfill — done in JS because parsing HTML in Postgres is not
  // feasible. Executes a per-row UPDATE; concert volume is small (hundreds
  // of rows in concerts, low thousands in _concerts_v) so this is acceptable.

  type Row = { id: number; html: string };

  const concertsResult = await db.execute(sql`
    SELECT id, title_html AS html FROM "concerts"
    WHERE title_html IS NOT NULL AND title_html <> ''
  `);
  const versionsResult = await db.execute(sql`
    SELECT id, version_title_html AS html FROM "_concerts_v"
    WHERE version_title_html IS NOT NULL AND version_title_html <> ''
  `);

  const concerts = (concertsResult as unknown as { rows: Row[] }).rows ?? [];
  const versions = (versionsResult as unknown as { rows: Row[] }).rows ?? [];

  payload.logger.info(
    `concert_title_richtext: backfilling ${concerts.length} concerts and ${versions.length} versions`,
  );

  let i = 0;
  for (const row of concerts) {
    const lexical = htmlTitleToLexical(row.html);
    const plain = convertConcertTitleToPlain(lexical);
    await db.execute(sql`
      UPDATE "concerts"
      SET title = ${JSON.stringify(lexical)}::jsonb,
          title_plain = ${plain}
      WHERE id = ${row.id}
    `);
    i += 1;
    if (i % 100 === 0) payload.logger.info(`  concerts: ${i}/${concerts.length}`);
  }

  i = 0;
  for (const row of versions) {
    const lexical = htmlTitleToLexical(row.html);
    const plain = convertConcertTitleToPlain(lexical);
    await db.execute(sql`
      UPDATE "_concerts_v"
      SET version_title = ${JSON.stringify(lexical)}::jsonb,
          version_title_plain = ${plain}
      WHERE id = ${row.id}
    `);
    i += 1;
    if (i % 500 === 0) payload.logger.info(`  versions: ${i}/${versions.length}`);
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`ALTER TABLE "concerts" DROP COLUMN IF EXISTS "title"`);
  await db.execute(sql`ALTER TABLE "concerts" DROP COLUMN IF EXISTS "title_plain"`);
  await db.execute(sql`ALTER TABLE "concerts" RENAME COLUMN "title_html" TO "title"`);

  await db.execute(sql`ALTER TABLE "_concerts_v" DROP COLUMN IF EXISTS "version_title"`);
  await db.execute(sql`ALTER TABLE "_concerts_v" DROP COLUMN IF EXISTS "version_title_plain"`);
  await db.execute(sql`ALTER TABLE "_concerts_v" RENAME COLUMN "version_title_html" TO "version_title"`);
}
