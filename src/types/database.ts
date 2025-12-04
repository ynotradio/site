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
 * - Top 11: sanity_contest_id + sanity_option_id + rank
 * - Year End Poll: sanity_contest_id + sanity_category_id + sanity_option_id + rank
 * - MRM: sanity_matchup_id
 */
export interface Vote {
  id: string;
  user_id?: string;
  ip_address: string;
  sanity_contest_id: string;
  sanity_option_id?: string;
  sanity_category_id?: string;
  sanity_matchup_id?: string;
  rank?: number;
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
  sanity_contest_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  hometown?: string;
  newsletter_opt_in: boolean;
  display: boolean;
  ip_address?: string;
  submitted_at: Date;
}

/**
 * Contest type discriminator
 */
export type ContestType = 'top11' | 'yearEndPoll' | 'mrm';

/**
 * Contest status values (matches Sanity schema enums)
 */
export type ContestStatus = 'draft' | 'open' | 'closed' | 'archived' | 'active' | 'complete';

/**
 * Vote count aggregation result
 */
export interface VoteCount {
  sanity_option_id?: string;
  sanity_category_id?: string;
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
