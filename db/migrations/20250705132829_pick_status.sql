-- migrate:up

-- Create new enum types with the values we want
CREATE TYPE pick_status_new AS ENUM ('hit', 'missed', 'not_resolved');
CREATE TYPE parlay_status AS ENUM ('hit', 'missed', 'not_resolved');

-- Drop the existing defaults first
ALTER TABLE parlay_picks ALTER COLUMN status DROP DEFAULT;
ALTER TABLE parlays ALTER COLUMN status DROP DEFAULT;

-- Update the columns to use the new types
ALTER TABLE parlay_picks ALTER COLUMN status TYPE pick_status_new USING 
  CASE 
    WHEN status::text = 'in_progress' THEN 'not_resolved'::pick_status_new
    ELSE status::text::pick_status_new
  END;
  
ALTER TABLE parlays ALTER COLUMN status TYPE parlay_status USING 
  CASE 
    WHEN status::text = 'in_progress' THEN 'not_resolved'::parlay_status
    ELSE status::text::parlay_status
  END;

-- Set the new defaults for the new types
ALTER TABLE parlay_picks ALTER COLUMN status SET DEFAULT 'not_resolved'::pick_status_new;
ALTER TABLE parlays ALTER COLUMN status SET DEFAULT 'not_resolved'::parlay_status;

-- Drop the old types and rename the new pick_status type
DROP TYPE pick_status;
DROP TYPE parlay_status_type;
ALTER TYPE pick_status_new RENAME TO pick_status;

-- migrate:down

-- Recreate the old enum types
CREATE TYPE pick_status_old AS ENUM ('in_progress', 'hit', 'missed');
CREATE TYPE parlay_status_type AS ENUM ('in_progress', 'hit', 'missed');

-- Drop the existing defaults first
ALTER TABLE parlay_picks ALTER COLUMN status DROP DEFAULT;
ALTER TABLE parlays ALTER COLUMN status DROP DEFAULT;

-- Update the columns back to the old types, converting 'not_resolved' to 'in_progress'
ALTER TABLE parlay_picks ALTER COLUMN status TYPE pick_status_old USING 
  CASE 
    WHEN status::text = 'not_resolved' THEN 'in_progress'::pick_status_old
    ELSE status::text::pick_status_old
  END;

ALTER TABLE parlays ALTER COLUMN status TYPE parlay_status_type USING 
  CASE 
    WHEN status::text = 'not_resolved' THEN 'in_progress'::parlay_status_type
    ELSE status::text::parlay_status_type
  END;

-- Set the original defaults for the old types
ALTER TABLE parlay_picks ALTER COLUMN status SET DEFAULT 'in_progress'::pick_status_old;
ALTER TABLE parlays ALTER COLUMN status SET DEFAULT 'in_progress'::parlay_status_type;

-- Drop the new types and rename the old pick_status type back
DROP TYPE pick_status;
DROP TYPE parlay_status;
ALTER TYPE pick_status_old RENAME TO pick_status;
