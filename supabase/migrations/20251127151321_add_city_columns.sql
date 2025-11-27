-- Migration: Add city columns to make data model city-agnostic
-- Issue: #2
-- Date: 2025-11-27

-- Add city column to maps table
ALTER TABLE maps
ADD COLUMN city VARCHAR(100) DEFAULT 'Bangalore' NOT NULL;

-- Add city column to locations table
ALTER TABLE locations
ADD COLUMN city VARCHAR(100) DEFAULT 'Bangalore' NOT NULL;

-- Add city column to users table (nullable, for user preference)
ALTER TABLE users
ADD COLUMN city VARCHAR(100);

-- Create indexes for efficient city filtering
CREATE INDEX idx_maps_city ON maps(city);
CREATE INDEX idx_locations_city ON locations(city);

-- Backfill existing data (automatically handled by DEFAULT, but being explicit)
UPDATE maps SET city = 'Bangalore' WHERE city IS NULL;
UPDATE locations SET city = 'Bangalore' WHERE city IS NULL;

-- Add comment to document the change
COMMENT ON COLUMN maps.city IS 'City where this map is focused. Defaults to Bangalore.';
COMMENT ON COLUMN locations.city IS 'City where this location exists. Defaults to Bangalore.';
COMMENT ON COLUMN users.city IS 'User preferred city for browsing maps (optional).';
