/**
 * TypeScript interfaces for Neon PostgreSQL database schema (Top 11 Contest)
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
 * Vote record for Top 11 contest
 * Fields used:
 * - contest_sanity_id: Reference to top11Contest document
 * - option_sanity_id: Reference to song document (for pre-selected songs)
 * - top_11_rank: Ranked choice position (1-11)
 * - write_in_value: For write-in votes
 */
export interface Vote {
  id: string;
  user_id?: string;
  contest_sanity_id: string;
  option_sanity_id?: string;
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
 * Contest status values (matches Sanity schema enums)
 */
export type ContestStatus = 'draft' | 'open' | 'closed' | 'archived';

/**
 * Vote count aggregation result
 */
export interface VoteCount {
  option_sanity_id?: string;
  total_votes: number;
  weighted_score: number;
}

/**
 * Write-in submission aggregation result
 */
export interface WriteIn {
  write_in_value: string;
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
