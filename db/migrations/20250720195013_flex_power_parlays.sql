-- migrate:up

ALTER TABLE parlays DROP COLUMN status;
DROP TYPE parlay_status;

ALTER TABLE parlays ADD COLUMN resolved BOOLEAN DEFAULT false;
ALTER TABLE parlays ADD COLUMN delta double precision DEFAULT 0; 

CREATE TYPE parlay_type AS ENUM (
    'perfect',
    'flex'
);

ALTER TABLE parlays ADD COLUMN type parlay_type NOT NULL;

-- migrate:down

