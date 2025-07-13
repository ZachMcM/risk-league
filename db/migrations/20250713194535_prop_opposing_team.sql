-- migrate:up

ALTER TABLE props ADD COLUMN opp_team_id INTEGER;
ALTER TABLE ONLY public.props
    ADD CONSTRAINT fk_opp_team FOREIGN KEY (opp_team_id) REFERENCES teams(id);

-- migrate:down

