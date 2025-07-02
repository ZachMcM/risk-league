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

--
-- Name: league_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.league_type AS ENUM (
    'nba',
    'nfl',
    'mlb'
);


--
-- Name: match_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.match_status AS ENUM (
    'in_progress',
    'loss',
    'win',
    'draw'
);


--
-- Name: parlay_status_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.parlay_status_type AS ENUM (
    'in_progress',
    'hit',
    'missed'
);


--
-- Name: pick_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.pick_status AS ENUM (
    'in_progress',
    'hit',
    'missed'
);


--
-- Name: pick_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.pick_type AS ENUM (
    'over',
    'under'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: match_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.match_messages (
    id text DEFAULT gen_random_uuid() NOT NULL,
    user_id text NOT NULL,
    match_id text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    content text NOT NULL
);


--
-- Name: match_users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.match_users (
    id text DEFAULT gen_random_uuid() NOT NULL,
    match_id text,
    user_id text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    balance double precision DEFAULT 100 NOT NULL,
    elo_delta double precision DEFAULT 0 NOT NULL,
    status public.match_status DEFAULT 'in_progress'::public.match_status NOT NULL
);


--
-- Name: matches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.matches (
    id text DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    resolved boolean DEFAULT false NOT NULL
);


--
-- Name: mlb_games; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mlb_games (
    id text NOT NULL,
    team_id text,
    game_date timestamp with time zone,
    game_type character varying(10) NOT NULL,
    venue_id integer,
    venue_name text,
    opponent_team_id text,
    is_home boolean NOT NULL,
    status text,
    runs integer,
    opponent_runs integer,
    win_loss character varying(1),
    hits integer,
    doubles integer,
    triples integer,
    home_runs integer,
    rbi integer,
    stolen_bases integer,
    caught_stealing integer,
    walks integer,
    strikeouts integer,
    left_on_base integer,
    batting_avg double precision,
    on_base_pct double precision,
    slugging_pct double precision,
    ops double precision,
    at_bats integer,
    plate_appearances integer,
    total_bases integer,
    hit_by_pitch integer,
    sac_flies integer,
    sac_bunts integer,
    innings_pitched double precision,
    earned_runs integer,
    pitching_hits integer,
    pitching_home_runs integer,
    pitching_walks integer,
    pitching_strikeouts integer,
    era double precision,
    whip double precision,
    pitches_thrown integer,
    strikes integer,
    balls integer,
    errors integer,
    assists integer,
    putouts integer,
    fielding_chances integer,
    passed_balls integer,
    season text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: mlb_player_stats; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mlb_player_stats (
    id text DEFAULT gen_random_uuid() NOT NULL,
    player_id text,
    game_id text NOT NULL,
    at_bats integer,
    runs integer,
    hits integer,
    doubles integer,
    triples integer,
    home_runs integer,
    rbi integer,
    stolen_bases integer,
    caught_stealing integer,
    walks integer,
    strikeouts integer,
    left_on_base integer,
    hit_by_pitch integer,
    sac_flies integer,
    sac_bunts integer,
    batting_avg double precision,
    on_base_pct double precision,
    slugging_pct double precision,
    ops double precision,
    innings_pitched double precision,
    pitching_hits integer,
    pitching_runs integer,
    earned_runs integer,
    pitching_walks integer,
    pitching_strikeouts integer,
    pitching_home_runs integer,
    pitches_thrown integer,
    strikes integer,
    balls integer,
    season text,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
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
-- Name: parlay_picks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.parlay_picks (
    id text DEFAULT gen_random_uuid() NOT NULL,
    parlay_id text NOT NULL,
    prop_id text NOT NULL,
    pick public.pick_type NOT NULL,
    status public.pick_status DEFAULT 'in_progress'::public.pick_status NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: parlays; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.parlays (
    id text DEFAULT gen_random_uuid() NOT NULL,
    match_user_id text NOT NULL,
    status public.parlay_status_type DEFAULT 'in_progress'::public.parlay_status_type NOT NULL,
    stake double precision NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: players; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.players (
    id text NOT NULL,
    name text,
    team_id text,
    "position" text,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    height text,
    weight text,
    number text,
    league public.league_type NOT NULL
);


--
-- Name: props; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.props (
    id text DEFAULT gen_random_uuid() NOT NULL,
    line double precision NOT NULL,
    current_value double precision DEFAULT 0 NOT NULL,
    raw_game_id text NOT NULL,
    player_id text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    stat_type text NOT NULL,
    game_start_time timestamp with time zone,
    league public.league_type NOT NULL,
    resolved boolean DEFAULT false NOT NULL,
    pick_options text[] DEFAULT ARRAY['over'::text, 'under'::text]
);


--
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schema_migrations (
    version character varying NOT NULL
);


--
-- Name: teams; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.teams (
    id text NOT NULL,
    full_name text,
    abbreviation text,
    nickname text,
    city text,
    state text,
    year_founded integer,
    league public.league_type NOT NULL
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
-- Name: match_messages match_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match_messages
    ADD CONSTRAINT match_messages_pkey PRIMARY KEY (id);


--
-- Name: match_users match_users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match_users
    ADD CONSTRAINT match_users_pkey PRIMARY KEY (id);


--
-- Name: matches matches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_pkey PRIMARY KEY (id);


--
-- Name: mlb_games mlb_games_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mlb_games
    ADD CONSTRAINT mlb_games_pkey PRIMARY KEY (id);


--
-- Name: mlb_player_stats mlb_player_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mlb_player_stats
    ADD CONSTRAINT mlb_player_stats_pkey PRIMARY KEY (id);


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
-- Name: players nba_players_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.players
    ADD CONSTRAINT nba_players_pkey PRIMARY KEY (id);


--
-- Name: teams nba_teams_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT nba_teams_pkey PRIMARY KEY (id);


--
-- Name: parlay_picks parlay_picks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parlay_picks
    ADD CONSTRAINT parlay_picks_pkey PRIMARY KEY (id);


--
-- Name: parlays parlays_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parlays
    ADD CONSTRAINT parlays_pkey PRIMARY KEY (id);


--
-- Name: props props_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.props
    ADD CONSTRAINT props_pkey PRIMARY KEY (id);


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
-- Name: mlb_player_stats fk_game; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mlb_player_stats
    ADD CONSTRAINT fk_game FOREIGN KEY (game_id) REFERENCES public.mlb_games(id);


--
-- Name: match_users fk_match; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match_users
    ADD CONSTRAINT fk_match FOREIGN KEY (match_id) REFERENCES public.matches(id);


--
-- Name: match_messages fk_match; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match_messages
    ADD CONSTRAINT fk_match FOREIGN KEY (match_id) REFERENCES public.matches(id);


--
-- Name: parlays fk_match_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parlays
    ADD CONSTRAINT fk_match_user FOREIGN KEY (match_user_id) REFERENCES public.match_users(id);


--
-- Name: mlb_games fk_opponent_team; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mlb_games
    ADD CONSTRAINT fk_opponent_team FOREIGN KEY (opponent_team_id) REFERENCES public.teams(id);


--
-- Name: parlay_picks fk_parlay; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parlay_picks
    ADD CONSTRAINT fk_parlay FOREIGN KEY (parlay_id) REFERENCES public.parlays(id);


--
-- Name: nba_player_stats fk_player; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nba_player_stats
    ADD CONSTRAINT fk_player FOREIGN KEY (player_id) REFERENCES public.players(id);


--
-- Name: props fk_player; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.props
    ADD CONSTRAINT fk_player FOREIGN KEY (player_id) REFERENCES public.players(id);


--
-- Name: mlb_player_stats fk_player; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mlb_player_stats
    ADD CONSTRAINT fk_player FOREIGN KEY (player_id) REFERENCES public.players(id);


--
-- Name: parlay_picks fk_prop; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parlay_picks
    ADD CONSTRAINT fk_prop FOREIGN KEY (prop_id) REFERENCES public.props(id);


--
-- Name: nba_games fk_team; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nba_games
    ADD CONSTRAINT fk_team FOREIGN KEY (team_id) REFERENCES public.teams(id);


--
-- Name: players fk_team; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.players
    ADD CONSTRAINT fk_team FOREIGN KEY (team_id) REFERENCES public.teams(id);


--
-- Name: mlb_games fk_team; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mlb_games
    ADD CONSTRAINT fk_team FOREIGN KEY (team_id) REFERENCES public.teams(id);


--
-- Name: match_users fk_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match_users
    ADD CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: match_messages fk_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match_messages
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
    ('20250625021323'),
    ('20250625032311'),
    ('20250625032535'),
    ('20250625033321'),
    ('20250625235042'),
    ('20250626002642'),
    ('20250626004623'),
    ('20250626005625'),
    ('20250626005840'),
    ('20250626011259'),
    ('20250626011939'),
    ('20250626021518'),
    ('20250626025110'),
    ('20250626030106'),
    ('20250626035610'),
    ('20250627023503'),
    ('20250627031558'),
    ('20250629012546'),
    ('20250629223639'),
    ('20250630003039'),
    ('20250630014622'),
    ('20250702020658'),
    ('20250702021157'),
    ('20250702023502'),
    ('20250702031636'),
    ('20250702031842'),
    ('20250702032334'),
    ('20250702032707');
