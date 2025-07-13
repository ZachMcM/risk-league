import { pgTable, varchar, foreignKey, text, integer, timestamp, doublePrecision, unique, serial, boolean, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const leagueType = pgEnum("league_type", ['nba', 'nfl', 'mlb'])
export const matchStatus = pgEnum("match_status", ['not_resolved', 'loss', 'win', 'draw', 'disqualified'])
export const parlayStatus = pgEnum("parlay_status", ['hit', 'missed', 'not_resolved'])
export const pickStatus = pgEnum("pick_status", ['hit', 'missed', 'not_resolved'])
export const pickType = pgEnum("pick_type", ['over', 'under'])


export const schemaMigrations = pgTable("schema_migrations", {
	version: varchar().primaryKey().notNull(),
});

export const nbaGames = pgTable("nba_games", {
	id: text().primaryKey().notNull(),
	teamId: integer("team_id"),
	pts: integer(),
	gameDate: timestamp("game_date", { withTimezone: true, mode: 'string' }),
	wl: text(),
	matchup: text(),
	min: integer(),
	fgm: integer(),
	fga: integer(),
	fta: integer(),
	ftm: integer(),
	threePa: integer("three_pa"),
	threePm: integer("three_pm"),
	oreb: integer(),
	dreb: integer(),
	reb: integer(),
	ast: integer(),
	stl: integer(),
	blk: integer(),
	tov: integer(),
	pf: integer(),
	plusMinus: integer("plus_minus"),
	gameType: varchar("game_type", { length: 20 }).notNull(),
	season: text(),
	pace: doublePrecision(),
	tovRatio: doublePrecision("tov_ratio"),
	tovPct: doublePrecision("tov_pct"),
	offRating: doublePrecision("off_rating"),
	defRating: doublePrecision("def_rating"),
}, (table) => [
	foreignKey({
			columns: [table.teamId],
			foreignColumns: [teams.id],
			name: "fk_team"
		}),
]);

export const nbaPlayerStats = pgTable("nba_player_stats", {
	gameId: text("game_id"),
	pts: integer(),
	min: integer(),
	fgm: integer(),
	fga: integer(),
	fta: integer(),
	ftm: integer(),
	threePa: integer("three_pa"),
	threePm: integer("three_pm"),
	oreb: integer(),
	dreb: integer(),
	reb: integer(),
	ast: integer(),
	stl: integer(),
	blk: integer(),
	tov: integer(),
	pf: integer(),
	plusMinus: integer("plus_minus"),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	season: text(),
	trueShooting: doublePrecision("true_shooting"),
	usageRate: doublePrecision("usage_rate"),
	rebPct: doublePrecision("reb_pct"),
	drebPct: doublePrecision("dreb_pct"),
	orebPct: doublePrecision("oreb_pct"),
	astPct: doublePrecision("ast_pct"),
	astRatio: doublePrecision("ast_ratio"),
	tovRatio: doublePrecision("tov_ratio"),
	id: serial().primaryKey().notNull(),
	playerId: integer("player_id"),
}, (table) => [
	foreignKey({
			columns: [table.gameId],
			foreignColumns: [nbaGames.id],
			name: "fk_game"
		}),
	foreignKey({
			columns: [table.playerId],
			foreignColumns: [players.id],
			name: "fk_player"
		}),
	unique("nba_player_stats_player_game_unique").on(table.gameId, table.playerId),
]);

export const mlbGames = pgTable("mlb_games", {
	id: text().primaryKey().notNull(),
	teamId: integer("team_id"),
	gameDate: timestamp("game_date", { withTimezone: true, mode: 'string' }),
	gameType: varchar("game_type", { length: 10 }).notNull(),
	venueId: integer("venue_id"),
	venueName: text("venue_name"),
	opponentTeamId: integer("opponent_team_id"),
	isHome: boolean("is_home").notNull(),
	status: text(),
	runs: integer(),
	opponentRuns: integer("opponent_runs"),
	winLoss: varchar("win_loss", { length: 1 }),
	hits: integer(),
	doubles: integer(),
	triples: integer(),
	homeRuns: integer("home_runs"),
	rbi: integer(),
	stolenBases: integer("stolen_bases"),
	caughtStealing: integer("caught_stealing"),
	walks: integer(),
	strikeouts: integer(),
	leftOnBase: integer("left_on_base"),
	battingAvg: doublePrecision("batting_avg"),
	onBasePct: doublePrecision("on_base_pct"),
	sluggingPct: doublePrecision("slugging_pct"),
	ops: doublePrecision(),
	atBats: integer("at_bats"),
	plateAppearances: integer("plate_appearances"),
	totalBases: integer("total_bases"),
	hitByPitch: integer("hit_by_pitch"),
	sacFlies: integer("sac_flies"),
	sacBunts: integer("sac_bunts"),
	inningsPitched: doublePrecision("innings_pitched"),
	earnedRuns: integer("earned_runs"),
	pitchingHits: integer("pitching_hits"),
	pitchingHomeRuns: integer("pitching_home_runs"),
	pitchingWalks: integer("pitching_walks"),
	pitchingStrikeouts: integer("pitching_strikeouts"),
	era: doublePrecision(),
	whip: doublePrecision(),
	pitchesThrown: integer("pitches_thrown"),
	strikes: integer(),
	balls: integer(),
	errors: integer(),
	assists: integer(),
	putouts: integer(),
	fieldingChances: integer("fielding_chances"),
	passedBalls: integer("passed_balls"),
	season: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	foreignKey({
			columns: [table.opponentTeamId],
			foreignColumns: [teams.id],
			name: "fk_opponent_team"
		}),
	foreignKey({
			columns: [table.teamId],
			foreignColumns: [teams.id],
			name: "fk_team"
		}),
]);

export const mlbPlayerStats = pgTable("mlb_player_stats", {
	gameId: text("game_id").notNull(),
	atBats: integer("at_bats"),
	runs: integer(),
	hits: integer(),
	doubles: integer(),
	triples: integer(),
	homeRuns: integer("home_runs"),
	rbi: integer(),
	stolenBases: integer("stolen_bases"),
	caughtStealing: integer("caught_stealing"),
	walks: integer(),
	strikeouts: integer(),
	leftOnBase: integer("left_on_base"),
	hitByPitch: integer("hit_by_pitch"),
	sacFlies: integer("sac_flies"),
	sacBunts: integer("sac_bunts"),
	battingAvg: doublePrecision("batting_avg"),
	onBasePct: doublePrecision("on_base_pct"),
	sluggingPct: doublePrecision("slugging_pct"),
	ops: doublePrecision(),
	inningsPitched: doublePrecision("innings_pitched"),
	pitchingHits: integer("pitching_hits"),
	pitchingRuns: integer("pitching_runs"),
	earnedRuns: integer("earned_runs"),
	pitchingWalks: integer("pitching_walks"),
	pitchingStrikeouts: integer("pitching_strikeouts"),
	pitchingHomeRuns: integer("pitching_home_runs"),
	pitchesThrown: integer("pitches_thrown"),
	strikes: integer(),
	balls: integer(),
	season: text(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	id: serial().primaryKey().notNull(),
	playerId: integer("player_id"),
}, (table) => [
	foreignKey({
			columns: [table.gameId],
			foreignColumns: [mlbGames.id],
			name: "fk_game"
		}),
	foreignKey({
			columns: [table.playerId],
			foreignColumns: [players.id],
			name: "fk_player"
		}),
	unique("mlb_player_stats_player_game_unique").on(table.gameId, table.playerId),
]);

export const matches = pgTable("matches", {
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	resolved: boolean().default(false).notNull(),
	id: serial().primaryKey().notNull(),
});

export const matchUsers = pgTable("match_users", {
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	balance: doublePrecision().default(100).notNull(),
	eloDelta: doublePrecision("elo_delta").default(0).notNull(),
	status: matchStatus().default('not_resolved').notNull(),
	id: serial().primaryKey().notNull(),
	userId: integer("user_id"),
	matchId: integer("match_id"),
}, (table) => [
	foreignKey({
			columns: [table.matchId],
			foreignColumns: [matches.id],
			name: "fk_match"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "fk_user"
		}),
]);

export const matchMessages = pgTable("match_messages", {
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	content: text().notNull(),
	id: serial().primaryKey().notNull(),
	userId: integer("user_id"),
	matchId: integer("match_id"),
}, (table) => [
	foreignKey({
			columns: [table.matchId],
			foreignColumns: [matches.id],
			name: "fk_match"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "fk_user"
		}),
]);

export const parlays = pgTable("parlays", {
	status: parlayStatus().default('not_resolved').notNull(),
	stake: doublePrecision().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	id: serial().primaryKey().notNull(),
	matchUserId: integer("match_user_id"),
}, (table) => [
	foreignKey({
			columns: [table.matchUserId],
			foreignColumns: [matchUsers.id],
			name: "fk_match_user"
		}),
]);

export const teams = pgTable("teams", {
	id: integer().primaryKey().notNull(),
	fullName: text("full_name"),
	abbreviation: text(),
	nickname: text(),
	city: text(),
	state: text(),
	yearFounded: integer("year_founded"),
	league: leagueType().notNull(),
});

export const parlayPicks = pgTable("parlay_picks", {
	pick: pickType().notNull(),
	status: pickStatus().default('not_resolved').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	id: serial().primaryKey().notNull(),
	parlayId: integer("parlay_id"),
	propId: integer("prop_id"),
}, (table) => [
	foreignKey({
			columns: [table.parlayId],
			foreignColumns: [parlays.id],
			name: "fk_parlay"
		}),
	foreignKey({
			columns: [table.propId],
			foreignColumns: [props.id],
			name: "fk_prop"
		}),
]);

export const players = pgTable("players", {
	id: integer().primaryKey().notNull(),
	name: text(),
	teamId: integer("team_id"),
	position: text(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	height: text(),
	weight: text(),
	number: text(),
	league: leagueType().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.teamId],
			foreignColumns: [teams.id],
			name: "fk_team"
		}),
]);

export const props = pgTable("props", {
	line: doublePrecision().notNull(),
	currentValue: doublePrecision("current_value").default(0).notNull(),
	rawGameId: text("raw_game_id").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	stat: text().notNull(),
	gameStartTime: timestamp("game_start_time", { withTimezone: true, mode: 'string' }),
	league: leagueType().notNull(),
	resolved: boolean().default(false).notNull(),
	pickOptions: text("pick_options").array().default(["RAY['over'::text", "'under'::tex"]),
	id: serial().primaryKey().notNull(),
	playerId: integer("player_id"),
}, (table) => [
	foreignKey({
			columns: [table.playerId],
			foreignColumns: [players.id],
			name: "fk_player"
		}),
]);

export const users = pgTable("users", {
	username: text().notNull(),
	email: text().notNull(),
	passwordHash: text("password_hash").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	image: text(),
	name: text(),
	isBot: boolean("is_bot"),
	eloRating: doublePrecision("elo_rating").default(1200).notNull(),
	id: serial().primaryKey().notNull(),
}, (table) => [
	unique("users_username_key").on(table.username),
	unique("users_email_key").on(table.email),
]);
