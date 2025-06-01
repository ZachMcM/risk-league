SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: nba_games; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.nba_games (
    id text NOT NULL,
    team_id text,
    pts integer,
    game_date timestamp with time zone,
    wl text,
    matchup text,
    min integer,
    fgm integer,
    fga integer,
    fta integer,
    ftm integer,
    three_pa integer,
    three_pm integer,
    oreb integer,
    dreb integer,
    reb integer,
    ast integer,
    stl integer,
    blk integer,
    tov integer,
    pf integer,
    plus_minus integer,
    game_id text
);


--
-- Name: nba_players; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.nba_players (
    id text NOT NULL,
    name text,
    team_id text,
    "position" text,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    height text,
    weight text,
    number text
);


--
-- Name: nba_teams; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.nba_teams (
    id text NOT NULL,
    full_name text,
    abbreviation text,
    nickname text,
    city text,
    state text,
    year_founded integer
);


--
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schema_migrations (
    version character varying NOT NULL
);


--
-- Name: nba_games nba_games_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nba_games
    ADD CONSTRAINT nba_games_pkey PRIMARY KEY (id);


--
-- Name: nba_players nba_players_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nba_players
    ADD CONSTRAINT nba_players_pkey PRIMARY KEY (id);


--
-- Name: nba_teams nba_teams_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nba_teams
    ADD CONSTRAINT nba_teams_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: nba_players fk_team; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nba_players
    ADD CONSTRAINT fk_team FOREIGN KEY (team_id) REFERENCES public.nba_teams(id);


--
-- Name: nba_games fk_team; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nba_games
    ADD CONSTRAINT fk_team FOREIGN KEY (team_id) REFERENCES public.nba_teams(id);


--
-- PostgreSQL database dump complete
--


--
-- Dbmate schema migrations
--

INSERT INTO public.schema_migrations (version) VALUES
    ('20250531064414'),
    ('20250531072205'),
    ('20250531072849'),
    ('20250531080346'),
    ('20250531084812'),
    ('20250531213836'),
    ('20250531224140'),
    ('20250601014450'),
    ('20250601014520'),
    ('20250601015005');
