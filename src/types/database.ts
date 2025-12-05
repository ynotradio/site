/**
 * TypeScript interfaces for Neon PostgreSQL database schema
 * These types correspond to the tables defined in src/db/neon/schema.sql
 */

/**
 * User account with contact information
 */
export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  hometown?: string;
  newsletter_opt_in: boolean;
  created_at: Date;
}

/**
 * Vote record for any contest type
 * The specific foreign key fields used depend on the contest type:
 * - Top 11: contest_sanity_id + option_sanity_id + top_11_rank
 * - Year End Poll: contest_sanity_id + year_end_poll_category_sanity_id + option_sanity_id
 * - MRM: modern_rock_madness_matchup_sanity_id
 */
export interface Vote {
  id: string;
  user_id?: string;
  contest_type: 'TOP_11' | 'YEAR_END_POLL' | 'MODERN_ROCK_MADNESS';
  contest_sanity_id: string;
  option_sanity_id?: string;
  year_end_poll_category_sanity_id?: string;
  modern_rock_madness_matchup_sanity_id?: string;
  top_11_rank?: number;
  is_write_in: boolean;
  write_in_value?: string;
  submitted_at: Date;
}

/**
 * Contest entry for prize drawings
 * Contains participant contact information
 */
export interface ContestEntry {
  id: string;
  user_id?: string;
  contest_sanity_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  hometown?: string;
  newsletter_opt_in: boolean;
  display: boolean;
  submitted_at: Date;
}

/**
 * Contest type discriminator
 */
export type ContestType = 'TOP_11' | 'YEAR_END_POLL' | 'MODERN_ROCK_MADNESS';

/**
 * Contest status values (matches Sanity schema enums)
 */
export type ContestStatus = 'draft' | 'open' | 'closed' | 'archived' | 'active' | 'complete';

/**
 * Vote count aggregation result
 */
export interface VoteCount {
  option_sanity_id?: string;
  year_end_poll_category_sanity_id?: string;
  total_votes: number;
  weighted_score: number;
}

/**
 * Write-in submission aggregation result
 */
export interface WriteIn {
  write_in_value: string;
  category?: string;
  count: number;
}

/**
 * Winner selection result
 */
export interface Winner {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}
