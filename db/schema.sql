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
    id text DEFAULT gen_random_uuid() NOT NULL,
    home_team_id text,
    away_team_id text,
    home_score integer,
    away_score integer,
    game_date timestamp with time zone,
    is_playoff boolean DEFAULT false,
    round text,
    season_year integer,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: nba_player_stats; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.nba_player_stats (
    id text DEFAULT gen_random_uuid() NOT NULL,
    player_id text,
    game_id text,
    minutes integer,
    points integer,
    rebounds integer,
    assists integer,
    steals integer,
    blocks integer,
    turnovers integer,
    fga integer,
    fgm integer,
    fta integer,
    ftm integer,
    three_pa integer,
    three_pm integer,
    plus_minus integer,
    usg_rate numeric,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: nba_players; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.nba_players (
    id text DEFAULT gen_random_uuid() NOT NULL,
    name text,
    team_id text,
    "position" text,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: nba_teams; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.nba_teams (
    id text DEFAULT gen_random_uuid() NOT NULL,
    name text,
    pace_rating numeric,
    def_rating numeric,
    off_rating numeric,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
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
-- Name: nba_games fk_away_team; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nba_games
    ADD CONSTRAINT fk_away_team FOREIGN KEY (away_team_id) REFERENCES public.nba_teams(id);


--
-- Name: nba_player_stats fk_game; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nba_player_stats
    ADD CONSTRAINT fk_game FOREIGN KEY (game_id) REFERENCES public.nba_games(id);


--
-- Name: nba_games fk_home_team; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nba_games
    ADD CONSTRAINT fk_home_team FOREIGN KEY (home_team_id) REFERENCES public.nba_teams(id);


--
-- Name: nba_player_stats fk_player; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nba_player_stats
    ADD CONSTRAINT fk_player FOREIGN KEY (player_id) REFERENCES public.nba_players(id);


--
-- Name: nba_players fk_team; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nba_players
    ADD CONSTRAINT fk_team FOREIGN KEY (team_id) REFERENCES public.nba_teams(id);


--
-- PostgreSQL database dump complete
--


--
-- Dbmate schema migrations
--

INSERT INTO public.schema_migrations (version) VALUES
    ('20250530043202');
