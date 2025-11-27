-- Migration: Update RPC functions to require city parameter
-- Issue: #2
-- Date: 2025-11-27

-- Drop existing functions (will be recreated with new signatures)
DROP FUNCTION IF EXISTS get_maps_sorted_by_upvotes(integer, integer);
DROP FUNCTION IF EXISTS get_location_counts(uuid[]);
DROP FUNCTION IF EXISTS get_contributor_counts(uuid[]);

-- Recreate get_maps_sorted_by_upvotes with mandatory city parameter
CREATE OR REPLACE FUNCTION get_maps_sorted_by_upvotes(
  p_limit integer,
  p_offset integer,
  p_city varchar DEFAULT 'Bangalore'
)
RETURNS TABLE (
  id uuid,
  name text,
  short_description text,
  body text,
  display_picture text,
  owner_id uuid,
  slug text,
  created_at timestamp,
  updated_at timestamp,
  city varchar,
  vote_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.name,
    m.short_description,
    m.body,
    m.display_picture,
    m.owner_id,
    m.slug,
    m.created_at,
    m.updated_at,
    m.city,
    COUNT(v.id) as vote_count
  FROM maps m
  LEFT JOIN votes v ON m.id = v.map_id
  WHERE m.city = p_city
  GROUP BY m.id
  ORDER BY vote_count DESC, m.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Recreate get_location_counts with mandatory city parameter
CREATE OR REPLACE FUNCTION get_location_counts(
  map_ids uuid[],
  p_city varchar DEFAULT 'Bangalore'
)
RETURNS TABLE (
  map_id uuid,
  location_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.map_id,
    COUNT(l.id) as location_count
  FROM locations l
  WHERE l.map_id = ANY(map_ids)
    AND l.city = p_city
  GROUP BY l.map_id;
END;
$$ LANGUAGE plpgsql;

-- Recreate get_contributor_counts with mandatory city parameter
CREATE OR REPLACE FUNCTION get_contributor_counts(
  map_ids uuid[],
  p_city varchar DEFAULT 'Bangalore'
)
RETURNS TABLE (
  map_id uuid,
  contributor_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.map_id,
    COUNT(DISTINCT l.creator_id) as contributor_count
  FROM locations l
  WHERE l.map_id = ANY(map_ids)
    AND l.city = p_city
  GROUP BY l.map_id;
END;
$$ LANGUAGE plpgsql;

-- Add comments to document the changes
COMMENT ON FUNCTION get_maps_sorted_by_upvotes IS 'Returns maps sorted by upvotes, filtered by city. Defaults to Bangalore.';
COMMENT ON FUNCTION get_location_counts IS 'Returns location counts per map, filtered by city. Defaults to Bangalore.';
COMMENT ON FUNCTION get_contributor_counts IS 'Returns contributor counts per map, filtered by city. Defaults to Bangalore.';
