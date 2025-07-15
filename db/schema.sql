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
-- Name: match_game_mode; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.match_game_mode AS ENUM (
    'nba',
    'nfl',
    'mlb'
);


--
-- Name: match_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.match_status AS ENUM (
    'not_resolved',
    'loss',
    'win',
    'draw',
    'disqualified'
);


--
-- Name: parlay_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.parlay_status AS ENUM (
    'hit',
    'missed',
    'not_resolved'
);


--
-- Name: pick_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.pick_status AS ENUM (
    'hit',
    'missed',
    'not_resolved'
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
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    content text NOT NULL,
    id integer NOT NULL,
    user_id integer,
    match_id integer
);


--
-- Name: match_messages_new_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.match_messages_new_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: match_messages_new_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.match_messages_new_id_seq OWNED BY public.match_messages.id;


--
-- Name: match_users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.match_users (
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    balance double precision DEFAULT 100 NOT NULL,
    elo_delta double precision DEFAULT 0 NOT NULL,
    status public.match_status DEFAULT 'not_resolved'::public.match_status NOT NULL,
    id integer NOT NULL,
    user_id integer,
    match_id integer
);


--
-- Name: match_users_new_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.match_users_new_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: match_users_new_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.match_users_new_id_seq OWNED BY public.match_users.id;


--
-- Name: matches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.matches (
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    resolved boolean DEFAULT false NOT NULL,
    id integer NOT NULL,
    game_mode public.match_game_mode NOT NULL
);


--
-- Name: matches_new_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.matches_new_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: matches_new_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.matches_new_id_seq OWNED BY public.matches.id;


--
-- Name: mlb_games; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mlb_games (
    id text NOT NULL,
    team_id integer,
    game_date timestamp with time zone,
    game_type character varying(10) NOT NULL,
    venue_id integer,
    venue_name text,
    opponent_team_id integer,
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
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    id integer NOT NULL,
    player_id integer
);


--
-- Name: mlb_player_stats_new_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.mlb_player_stats_new_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: mlb_player_stats_new_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.mlb_player_stats_new_id_seq OWNED BY public.mlb_player_stats.id;


--
-- Name: nba_games; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.nba_games (
    id text NOT NULL,
    team_id integer,
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
    tov_ratio double precision,
    id integer NOT NULL,
    player_id integer
);


--
-- Name: nba_player_stats_new_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.nba_player_stats_new_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: nba_player_stats_new_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.nba_player_stats_new_id_seq OWNED BY public.nba_player_stats.id;


--
-- Name: parlay_picks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.parlay_picks (
    pick public.pick_type NOT NULL,
    status public.pick_status DEFAULT 'not_resolved'::public.pick_status NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    id integer NOT NULL,
    parlay_id integer,
    prop_id integer
);


--
-- Name: parlay_picks_new_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.parlay_picks_new_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: parlay_picks_new_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.parlay_picks_new_id_seq OWNED BY public.parlay_picks.id;


--
-- Name: parlays; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.parlays (
    status public.parlay_status DEFAULT 'not_resolved'::public.parlay_status NOT NULL,
    stake double precision NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    id integer NOT NULL,
    match_user_id integer
);


--
-- Name: parlays_new_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.parlays_new_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: parlays_new_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.parlays_new_id_seq OWNED BY public.parlays.id;


--
-- Name: players; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.players (
    id integer NOT NULL,
    name text,
    team_id integer,
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
    line double precision NOT NULL,
    current_value double precision DEFAULT 0 NOT NULL,
    raw_game_id text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    stat text NOT NULL,
    game_start_time timestamp with time zone,
    league public.league_type NOT NULL,
    resolved boolean DEFAULT false NOT NULL,
    pick_options text[] DEFAULT ARRAY['over'::text, 'under'::text],
    id integer NOT NULL,
    player_id integer,
    opp_team_id integer
);


--
-- Name: props_new_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.props_new_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: props_new_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.props_new_id_seq OWNED BY public.props.id;


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
    id integer NOT NULL,
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
    username text NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    image text,
    name text,
    is_bot boolean,
    elo_rating double precision DEFAULT 1200 NOT NULL,
    id integer NOT NULL
);


--
-- Name: users_new_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_new_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_new_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_new_id_seq OWNED BY public.users.id;


--
-- Name: match_messages id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match_messages ALTER COLUMN id SET DEFAULT nextval('public.match_messages_new_id_seq'::regclass);


--
-- Name: match_users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match_users ALTER COLUMN id SET DEFAULT nextval('public.match_users_new_id_seq'::regclass);


--
-- Name: matches id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matches ALTER COLUMN id SET DEFAULT nextval('public.matches_new_id_seq'::regclass);


--
-- Name: mlb_player_stats id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mlb_player_stats ALTER COLUMN id SET DEFAULT nextval('public.mlb_player_stats_new_id_seq'::regclass);


--
-- Name: nba_player_stats id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nba_player_stats ALTER COLUMN id SET DEFAULT nextval('public.nba_player_stats_new_id_seq'::regclass);


--
-- Name: parlay_picks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parlay_picks ALTER COLUMN id SET DEFAULT nextval('public.parlay_picks_new_id_seq'::regclass);


--
-- Name: parlays id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parlays ALTER COLUMN id SET DEFAULT nextval('public.parlays_new_id_seq'::regclass);


--
-- Name: props id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.props ALTER COLUMN id SET DEFAULT nextval('public.props_new_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_new_id_seq'::regclass);


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
-- Name: mlb_player_stats mlb_player_stats_player_game_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mlb_player_stats
    ADD CONSTRAINT mlb_player_stats_player_game_unique UNIQUE (player_id, game_id);


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
-- Name: nba_player_stats nba_player_stats_player_game_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nba_player_stats
    ADD CONSTRAINT nba_player_stats_player_game_unique UNIQUE (player_id, game_id);


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
-- Name: props fk_opp_team; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.props
    ADD CONSTRAINT fk_opp_team FOREIGN KEY (opp_team_id) REFERENCES public.teams(id);


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
-- Name: props fk_player; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.props
    ADD CONSTRAINT fk_player FOREIGN KEY (player_id) REFERENCES public.players(id);


--
-- Name: nba_player_stats fk_player; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nba_player_stats
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
-- Name: mlb_games fk_team; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mlb_games
    ADD CONSTRAINT fk_team FOREIGN KEY (team_id) REFERENCES public.teams(id);


--
-- Name: players fk_team; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.players
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
    ('20250711082421'),
    ('20250713025517'),
    ('20250713194535'),
    ('20250715010515');
