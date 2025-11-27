-- Migration: Add RLS policies for location_votes table
-- Date: 2025-11-27
-- Purpose: Secure location_votes table with Row Level Security

-- Enable RLS on location_votes table
ALTER TABLE location_votes ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view vote counts (SELECT)
-- This allows public access to see vote counts
CREATE POLICY "Anyone can view location votes"
  ON location_votes
  FOR SELECT
  USING (true);

-- Policy: Authenticated users can insert their own votes
-- Users can only create votes for themselves
CREATE POLICY "Users can create their own votes"
  ON location_votes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own votes
-- Users can only delete votes they created
CREATE POLICY "Users can delete their own votes"
  ON location_votes
  FOR DELETE
  USING (auth.uid() = user_id);

-- Policy: Prevent updates entirely
-- Votes should not be updated, only inserted or deleted
-- This is implicitly handled by not creating an UPDATE policy

-- Add comments for documentation
COMMENT ON POLICY "Anyone can view location votes" ON location_votes IS
  'Allows public read access to vote data for displaying vote counts';

COMMENT ON POLICY "Users can create their own votes" ON location_votes IS
  'Authenticated users can only insert votes with their own user_id';

COMMENT ON POLICY "Users can delete their own votes" ON location_votes IS
  'Users can only delete votes they created (toggle off upvote)';
