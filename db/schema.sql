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
-- Name: match_user_nba_picks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.match_user_nba_picks (
    id text DEFAULT gen_random_uuid() NOT NULL,
    pick text NOT NULL,
    match_user_id text,
    nba_prop_id text
);


--
-- Name: match_users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.match_users (
    id text DEFAULT gen_random_uuid() NOT NULL,
    match_id text,
    user_id text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    balance double precision DEFAULT 100,
    elo_gained double precision DEFAULT 0
);


--
-- Name: match_winners; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.match_winners (
    id text DEFAULT gen_random_uuid() NOT NULL,
    match_id text,
    winner_id text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: matches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.matches (
    id text DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    resolved boolean DEFAULT false
);


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
    pace double precision,
    tov_ratio double precision,
    tov_pct double precision,
    off_rating double precision,
    def_rating double precision
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
    true_shooting double precision,
    usage_rate double precision,
    reb_pct double precision,
    dreb_pct double precision,
    oreb_pct double precision,
    ast_pct double precision,
    ast_ratio double precision,
    tov_ratio double precision
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
    line double precision NOT NULL,
    current_value double precision,
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
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id text DEFAULT gen_random_uuid() NOT NULL,
    username text NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    image text,
    name text,
    is_bot boolean,
    elo_rating double precision DEFAULT 1200 NOT NULL
);


--
-- Name: match_user_nba_picks match_user_nba_picks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match_user_nba_picks
    ADD CONSTRAINT match_user_nba_picks_pkey PRIMARY KEY (id);


--
-- Name: match_users match_users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match_users
    ADD CONSTRAINT match_users_pkey PRIMARY KEY (id);


--
-- Name: match_winners match_winners_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match_winners
    ADD CONSTRAINT match_winners_pkey PRIMARY KEY (id);


--
-- Name: matches matches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_pkey PRIMARY KEY (id);


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
-- Name: match_users fk_match; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match_users
    ADD CONSTRAINT fk_match FOREIGN KEY (match_id) REFERENCES public.matches(id);


--
-- Name: match_winners fk_match; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match_winners
    ADD CONSTRAINT fk_match FOREIGN KEY (match_id) REFERENCES public.matches(id);


--
-- Name: match_user_nba_picks fk_match_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match_user_nba_picks
    ADD CONSTRAINT fk_match_user FOREIGN KEY (match_user_id) REFERENCES public.match_users(id);


--
-- Name: match_user_nba_picks fk_nba_prop; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match_user_nba_picks
    ADD CONSTRAINT fk_nba_prop FOREIGN KEY (nba_prop_id) REFERENCES public.nba_props(id);


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
-- Name: match_users fk_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match_users
    ADD CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: match_winners fk_winner; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match_winners
    ADD CONSTRAINT fk_winner FOREIGN KEY (winner_id) REFERENCES public.users(id);


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
    ('20250609061907'),
    ('20250614161657'),
    ('20250614184158'),
    ('20250620015043'),
    ('20250620020835'),
    ('20250621024817'),
    ('20250621025156'),
    ('20250621025736'),
    ('20250621052839'),
    ('20250623024227'),
    ('20250624014156'),
    ('20250625021323');
