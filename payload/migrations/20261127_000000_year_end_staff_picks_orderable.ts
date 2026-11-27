import { sql } from '@payloadcms/db-postgres';
import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres';
import { generateNKeysBetween } from 'payload/shared';

// Staff picks are reordered by drag and drop (Payload's `orderable`), which
// keeps order in a fractional-index `_order` column instead of sortOrder.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "year_end_staff_picks" ADD COLUMN IF NOT EXISTS "_order" varchar;
  CREATE INDEX IF NOT EXISTS "year_end_staff_picks__order_idx" ON "year_end_staff_picks" USING btree ("_order");`);

  const { rows } = await db.execute(sql`
  SELECT id FROM "year_end_staff_picks" ORDER BY "year", "sort_order", "id"`);
  const keys = generateNKeysBetween(null, null, rows.length);
  for (const [i, row] of rows.entries()) {
    await db.execute(sql`UPDATE "year_end_staff_picks" SET "_order" = ${keys[i]} WHERE "id" = ${row.id}`);
  }

  await db.execute(sql`ALTER TABLE "year_end_staff_picks" DROP COLUMN IF EXISTS "sort_order";`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "year_end_staff_picks" ADD COLUMN IF NOT EXISTS "sort_order" numeric DEFAULT 100;
  UPDATE "year_end_staff_picks" p SET "sort_order" = o.n
    FROM (SELECT id, row_number() OVER (ORDER BY "_order") AS n FROM "year_end_staff_picks") o
    WHERE p.id = o.id;
  DROP INDEX IF EXISTS "year_end_staff_picks__order_idx";
  ALTER TABLE "year_end_staff_picks" DROP COLUMN IF EXISTS "_order";`);
}
