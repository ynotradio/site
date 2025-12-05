-- Neon PostgreSQL Schema for Contest Voting
-- This schema stores user-generated data (votes, entries) while contest
-- configuration lives in Sanity CMS.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(64),
    last_name VARCHAR(64),
    phone VARCHAR(20),
    hometown VARCHAR(64),
    newsletter_opt_in BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(email)
);

CREATE INDEX idx_users_email ON users(email);

-- Votes table (all contest types)
CREATE TABLE votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    contest_type VARCHAR(50) NOT NULL,
    contest_sanity_id VARCHAR(255) NOT NULL,
    option_sanity_id VARCHAR(255),
    year_end_poll_category_sanity_id VARCHAR(255),
    modern_rock_madness_matchup_sanity_id VARCHAR(255),
    top_11_rank INTEGER,
    is_write_in BOOLEAN DEFAULT FALSE,
    write_in_value TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_votes_contest ON votes(contest_sanity_id);
CREATE INDEX idx_votes_option ON votes(contest_sanity_id, option_sanity_id);
CREATE INDEX idx_votes_category ON votes(contest_sanity_id, year_end_poll_category_sanity_id);
CREATE INDEX idx_votes_matchup ON votes(modern_rock_madness_matchup_sanity_id);
CREATE INDEX idx_votes_user ON votes(user_id);
CREATE INDEX idx_votes_contest_type ON votes(contest_type);

-- Unique constraints for duplicate prevention
-- MRM: One vote per user per matchup
CREATE UNIQUE INDEX idx_votes_mrm_unique 
    ON votes(user_id, modern_rock_madness_matchup_sanity_id) 
    WHERE modern_rock_madness_matchup_sanity_id IS NOT NULL;

-- Year End Poll: One vote per user per category per option (including write-ins)
-- COALESCE allows both option_id votes and write-in votes to be uniquely constrained
CREATE UNIQUE INDEX idx_votes_yep_unique 
    ON votes(user_id, contest_sanity_id, year_end_poll_category_sanity_id, COALESCE(option_sanity_id, write_in_value)) 
    WHERE year_end_poll_category_sanity_id IS NOT NULL;

-- Contest entries table
CREATE TABLE contest_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    contest_sanity_id VARCHAR(255) NOT NULL,
    first_name VARCHAR(64) NOT NULL,
    last_name VARCHAR(64) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    hometown VARCHAR(64),
    newsletter_opt_in BOOLEAN DEFAULT FALSE,
    display BOOLEAN DEFAULT TRUE,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(email, contest_sanity_id)
);

CREATE INDEX idx_entries_contest ON contest_entries(contest_sanity_id);
CREATE INDEX idx_entries_winner_pool ON contest_entries(contest_sanity_id, display) WHERE display = TRUE;

-- Helper function: Pick random contest winner
CREATE OR REPLACE FUNCTION pick_winner(p_contest_id VARCHAR)
RETURNS TABLE (first_name VARCHAR, last_name VARCHAR, email VARCHAR, phone VARCHAR) AS $$
BEGIN
    RETURN QUERY
    SELECT ce.first_name, ce.last_name, ce.email, ce.phone
    FROM contest_entries ce
    WHERE ce.contest_sanity_id = p_contest_id AND ce.display = TRUE
    ORDER BY RANDOM()
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Helper function: Get vote counts for a contest
CREATE OR REPLACE FUNCTION get_vote_counts(p_contest_id VARCHAR)
RETURNS TABLE (option_sanity_id VARCHAR, year_end_poll_category_sanity_id VARCHAR, total_votes BIGINT, weighted_score BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.option_sanity_id,
        v.year_end_poll_category_sanity_id,
        COUNT(*) as total_votes,
        -- Weighted scoring for ranked votes: #1 = 11 points, #2 = 10 points, ... #11 = 1 point
        -- The value 12 assumes maxSelections=11 (default for Top 11). For contests with 
        -- different maxSelections, calculate as (maxSelections + 1 - rank)
        SUM(CASE WHEN v.top_11_rank IS NOT NULL THEN (12 - v.top_11_rank) ELSE 1 END) as weighted_score
    FROM votes v
    WHERE v.contest_sanity_id = p_contest_id AND v.is_write_in = FALSE
    GROUP BY v.option_sanity_id, v.year_end_poll_category_sanity_id;
END;
$$ LANGUAGE plpgsql;

-- Helper function: Get write-ins for review
CREATE OR REPLACE FUNCTION get_write_ins(p_contest_id VARCHAR)
RETURNS TABLE (write_in_value TEXT, category VARCHAR, count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.write_in_value,
        v.year_end_poll_category_sanity_id as category,
        COUNT(*) as count
    FROM votes v
    WHERE v.contest_sanity_id = p_contest_id AND v.is_write_in = TRUE
    GROUP BY v.write_in_value, v.year_end_poll_category_sanity_id
    ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql;
