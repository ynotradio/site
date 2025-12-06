-- Neon PostgreSQL Schema for Contest Voting
-- This schema stores user-generated data (votes, entries) for:
-- - Top 11 Contest (weekly)
-- - Year End Poll (annual, multiple categories)
-- - Modern Rock Madness (tournament brackets)
-- Contest configuration lives in Sanity CMS.

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
-- Supports:
-- - Top 11: contest_sanity_id + option_sanity_id (song) + top_11_rank
-- - Year End Poll: contest_sanity_id + category_sanity_id + option_sanity_id
-- - Modern Rock Madness: match_sanity_id + option_sanity_id (band)
CREATE TABLE votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    contest_sanity_id VARCHAR(255),
    category_sanity_id VARCHAR(255),
    match_sanity_id VARCHAR(255),
    option_sanity_id VARCHAR(255),
    top_11_rank INTEGER,
    is_write_in BOOLEAN DEFAULT FALSE,
    write_in_value TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_votes_contest ON votes(contest_sanity_id);
CREATE INDEX idx_votes_category ON votes(contest_sanity_id, category_sanity_id);
CREATE INDEX idx_votes_match ON votes(match_sanity_id);
CREATE INDEX idx_votes_option ON votes(contest_sanity_id, option_sanity_id);
CREATE INDEX idx_votes_user ON votes(user_id);

-- Unique constraints for duplicate prevention
-- Top 11: One vote per user per option per contest
CREATE UNIQUE INDEX idx_votes_top11_unique 
    ON votes(user_id, contest_sanity_id, COALESCE(option_sanity_id, write_in_value))
    WHERE contest_sanity_id IS NOT NULL AND category_sanity_id IS NULL AND match_sanity_id IS NULL AND user_id IS NOT NULL;

-- Year End Poll: One vote per user per option per category
CREATE UNIQUE INDEX idx_votes_yep_unique 
    ON votes(user_id, contest_sanity_id, category_sanity_id, COALESCE(option_sanity_id, write_in_value))
    WHERE category_sanity_id IS NOT NULL AND user_id IS NOT NULL;

-- Modern Rock Madness: One vote per user per match
CREATE UNIQUE INDEX idx_votes_mrm_unique 
    ON votes(user_id, match_sanity_id)
    WHERE match_sanity_id IS NOT NULL AND user_id IS NOT NULL;

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

-- Helper function: Get vote counts for a Top 11 contest
CREATE OR REPLACE FUNCTION get_vote_counts(p_contest_id VARCHAR)
RETURNS TABLE (option_sanity_id VARCHAR, total_votes BIGINT, weighted_score BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.option_sanity_id,
        COUNT(*) as total_votes,
        -- Weighted scoring for ranked votes: #1 = 11 points, #2 = 10 points, ... #11 = 1 point
        SUM(CASE WHEN v.top_11_rank IS NOT NULL THEN (12 - v.top_11_rank) ELSE 1 END) as weighted_score
    FROM votes v
    WHERE v.contest_sanity_id = p_contest_id AND v.is_write_in = FALSE
    GROUP BY v.option_sanity_id;
END;
$$ LANGUAGE plpgsql;

-- Helper function: Get write-ins for review
CREATE OR REPLACE FUNCTION get_write_ins(p_contest_id VARCHAR)
RETURNS TABLE (write_in_value TEXT, count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.write_in_value,
        COUNT(*) as count
    FROM votes v
    WHERE v.contest_sanity_id = p_contest_id AND v.is_write_in = TRUE
    GROUP BY v.write_in_value
    ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql;

-- Helper function: Get vote counts for a Year End Poll category
CREATE OR REPLACE FUNCTION get_yep_vote_counts(p_contest_id VARCHAR, p_category_id VARCHAR)
RETURNS TABLE (option_sanity_id VARCHAR, total_votes BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.option_sanity_id,
        COUNT(*) as total_votes
    FROM votes v
    WHERE v.contest_sanity_id = p_contest_id 
        AND v.category_sanity_id = p_category_id
        AND v.is_write_in = FALSE
    GROUP BY v.option_sanity_id
    ORDER BY total_votes DESC;
END;
$$ LANGUAGE plpgsql;

-- Helper function: Get write-ins for a Year End Poll category
CREATE OR REPLACE FUNCTION get_yep_write_ins(p_contest_id VARCHAR, p_category_id VARCHAR)
RETURNS TABLE (write_in_value TEXT, count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.write_in_value,
        COUNT(*) as count
    FROM votes v
    WHERE v.contest_sanity_id = p_contest_id 
        AND v.category_sanity_id = p_category_id
        AND v.is_write_in = TRUE
    GROUP BY v.write_in_value
    ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql;

-- Helper function: Get vote counts for a Modern Rock Madness match
CREATE OR REPLACE FUNCTION get_mrm_match_votes(p_match_id VARCHAR)
RETURNS TABLE (option_sanity_id VARCHAR, total_votes BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.option_sanity_id,
        COUNT(*) as total_votes
    FROM votes v
    WHERE v.match_sanity_id = p_match_id
    GROUP BY v.option_sanity_id
    ORDER BY total_votes DESC;
END;
$$ LANGUAGE plpgsql;
