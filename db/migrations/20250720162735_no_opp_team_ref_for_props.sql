-- migrate:up

alter table props drop constraint fk_opp_team;
alter table props drop column opp_team_id;

-- migrate:down

