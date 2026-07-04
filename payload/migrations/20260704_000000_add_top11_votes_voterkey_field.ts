import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres';

// No-op: the top11_votes.voter_key column and its unique index already exist,
// created by migration 20260701_170648_add_top11_vote_dedup_and_lookback via
// raw SQL (GENERATED ALWAYS AS ... STORED). This migration exists only to mark
// the point where the Top11Votes collection config started declaring a
// matching `voterKey` field, so Payload's schema introspection stops treating
// that column as unmanaged.
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {}
