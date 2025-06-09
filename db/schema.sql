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
    game_type character varying(20) NOT NULL,
    season text,
    pace numeric,
    tov_ratio numeric,
    tov_pct numeric,
    off_rating numeric,
    def_rating numeric
);


--
-- Name: nba_player_stats; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.nba_player_stats (
    id text NOT NULL,
    player_id text,
    game_id text,
    pts integer,
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
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    season text,
    true_shooting numeric,
    usage_rate numeric,
    reb_pct numeric,
    dreb_pct numeric,
    oreb_pct numeric,
    ast_pct numeric,
    ast_ratio numeric,
    tov_ratio numeric
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
-- Name: nba_props; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.nba_props (
    id text DEFAULT gen_random_uuid() NOT NULL,
    stat_type text NOT NULL,
    player_id text NOT NULL,
    raw_game_id text NOT NULL,
    line numeric NOT NULL,
    current_value numeric,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    game_start_time timestamp with time zone
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
-- Name: user_nba_prop_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_nba_prop_entries (
    id text DEFAULT gen_random_uuid() NOT NULL,
    user_id text NOT NULL,
    prop_id text NOT NULL,
    over_under text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    status text
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id text DEFAULT gen_random_uuid() NOT NULL,
    username text NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    image text
);


--
-- Name: nba_games nba_games_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nba_games
    ADD CONSTRAINT nba_games_pkey PRIMARY KEY (id);


--
-- Name: nba_player_stats nba_player_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nba_player_stats
    ADD CONSTRAINT nba_player_stats_pkey PRIMARY KEY (id);


--
-- Name: nba_players nba_players_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nba_players
    ADD CONSTRAINT nba_players_pkey PRIMARY KEY (id);


--
-- Name: nba_props nba_props_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nba_props
    ADD CONSTRAINT nba_props_pkey PRIMARY KEY (id);


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
-- Name: user_nba_prop_entries user_nba_prop_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_nba_prop_entries
    ADD CONSTRAINT user_nba_prop_entries_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: nba_player_stats fk_game; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nba_player_stats
    ADD CONSTRAINT fk_game FOREIGN KEY (game_id) REFERENCES public.nba_games(id);


--
-- Name: nba_player_stats fk_player; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nba_player_stats
    ADD CONSTRAINT fk_player FOREIGN KEY (player_id) REFERENCES public.nba_players(id);


--
-- Name: nba_props fk_player; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nba_props
    ADD CONSTRAINT fk_player FOREIGN KEY (player_id) REFERENCES public.nba_players(id);


--
-- Name: user_nba_prop_entries fk_prop; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_nba_prop_entries
    ADD CONSTRAINT fk_prop FOREIGN KEY (prop_id) REFERENCES public.nba_props(id);


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
-- Name: user_nba_prop_entries fk_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_nba_prop_entries
    ADD CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES public.users(id);


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
    ('20250601015005'),
    ('20250602002306'),
    ('20250602012549'),
    ('20250602013946'),
    ('20250602015050'),
    ('20250602030726'),
    ('20250602031100'),
    ('20250602031458'),
    ('20250602034407'),
    ('20250607021119'),
    ('20250607224529'),
    ('20250607231439'),
    ('20250607232925'),
    ('20250608211241'),
    ('20250608213533'),
    ('20250608213707'),
    ('20250608222102'),
    ('20250609061907');
