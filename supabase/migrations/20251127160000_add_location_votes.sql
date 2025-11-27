-- Migration: Add location voting functionality
-- Issue: #3
-- Date: 2025-11-27

-- Create location_votes table
CREATE TABLE location_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(location_id, user_id)
);

-- Create index for efficient lookups
CREATE INDEX idx_location_votes_location_id ON location_votes(location_id);
CREATE INDEX idx_location_votes_user_id ON location_votes(user_id);

-- Add comment to document the table
COMMENT ON TABLE location_votes IS 'Stores upvotes for locations. Each user can upvote a location once.';

-- Create RPC function to get location vote counts efficiently
CREATE OR REPLACE FUNCTION get_location_vote_counts(location_ids UUID[])
RETURNS TABLE(location_id UUID, vote_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    lv.location_id,
    COUNT(lv.id) as vote_count
  FROM location_votes lv
  WHERE lv.location_id = ANY(location_ids)
  GROUP BY lv.location_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- Add comment to document the function
COMMENT ON FUNCTION get_location_vote_counts IS 'Efficiently retrieves vote counts for multiple locations in a single query.';
