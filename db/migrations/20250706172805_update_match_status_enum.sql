-- migrate:up

-- Create a new enum type with the updated values
CREATE TYPE public.match_status_new AS ENUM (
    'not_resolved',
    'loss',
    'win',
    'draw',
    'disqualified'
);

-- Drop the existing default value first
ALTER TABLE public.match_users 
ALTER COLUMN status DROP DEFAULT;

-- Change the column to use the new enum type, converting 'in_progress' to 'not_resolved'
ALTER TABLE public.match_users 
ALTER COLUMN status TYPE public.match_status_new 
USING CASE 
    WHEN status = 'in_progress' THEN 'not_resolved'::public.match_status_new
    ELSE status::text::public.match_status_new
END;

-- Set the new default value
ALTER TABLE public.match_users 
ALTER COLUMN status SET DEFAULT 'not_resolved'::public.match_status_new;

-- Drop the old enum type and rename the new one
DROP TYPE public.match_status;
ALTER TYPE public.match_status_new RENAME TO match_status;

-- migrate:down

-- Revert back to the original enum
CREATE TYPE public.match_status_old AS ENUM (
    'in_progress',
    'loss', 
    'win',
    'draw'
);

-- Update 'not_resolved' back to 'in_progress'
UPDATE public.match_users 
SET status = 'in_progress'::public.match_status
WHERE status = 'not_resolved'::public.match_status;

-- Remove any 'disqualified' entries (convert to 'loss' as fallback)
UPDATE public.match_users 
SET status = 'loss'::public.match_status
WHERE status = 'disqualified'::public.match_status;

-- Change the column back to the old enum type
ALTER TABLE public.match_users 
ALTER COLUMN status TYPE public.match_status_old 
USING status::text::public.match_status_old;

-- Update the default value back
ALTER TABLE public.match_users 
ALTER COLUMN status SET DEFAULT 'in_progress'::public.match_status_old;

-- Drop the new enum type and rename the old one back
DROP TYPE public.match_status;
ALTER TYPE public.match_status_old RENAME TO match_status;