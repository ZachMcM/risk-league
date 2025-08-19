import {
  boolean,
  doublePrecision,
  foreignKey,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const matchStatus = pgEnum("match_status", [
  "not_resolved",
  "loss",
  "win",
  "draw",
  "disqualified",
]);
export const parlayType = pgEnum("parlay_type", ["perfect", "flex"]);
export const pickStatus = pgEnum("pick_status", [
  "hit",
  "missed",
  "not_resolved",
  "did_not_play",
  "tie",
]);
export const propStatus = pgEnum("prop_status", ["resolved", "not_resolved", "did_not_play"])
export const choiceType = pgEnum("choice_type", ["over", "under"]);

export const friendshipStatus = pgEnum("friendship_status", [
  "pending",
  "accepted",
]);

export const friendlyMatchRequestStatus = pgEnum(
  "friendly_match_request_status",
  ["pending", "accepted", "declined"],
);

export const leagueType = pgEnum("league_type", [
  "MLB",
  "NBA",
  "NFL",
  "NCAAFB",
  "NCAABB",
]);

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified")
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  username: text("username").unique(),
  displayUsername: text("display_username"),
  points: doublePrecision().default(1000).notNull(),
  header: text(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").$defaultFn(
    () => /* @__PURE__ */ new Date(),
  ),
  updatedAt: timestamp("updated_at").$defaultFn(
    () => /* @__PURE__ */ new Date(),
  ),
});

export const message = pgTable("message", {
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
    .defaultNow()
    .notNull(),
  content: text().notNull(),
  id: serial().primaryKey().notNull(),
  matchId: integer("match_id")
    .notNull()
    .references(() => match.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
}, (table) => [
  index("idx_message_match_id").on(table.matchId),
  index("idx_message_created_at").on(table.createdAt),
]);

export const pick = pgTable("pick", {
  choice: choiceType().notNull(),
  status: pickStatus().default("not_resolved").notNull(),
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "string",
  })
    .defaultNow()
    .notNull(),
  id: serial().primaryKey().notNull(),
  parlayId: integer("parlay_id")
    .notNull()
    .references(() => parlay.id, { onDelete: "cascade" }),
  propId: integer("prop_id")
    .notNull()
    .references(() => prop.id, { onDelete: "cascade" }),
}, (table) => [
  index("idx_pick_parlay_id").on(table.parlayId),
  index("idx_pick_prop_id").on(table.propId),
  index("idx_pick_status").on(table.status),
]);

export const team = pgTable(
  "team",
  {
    teamId: integer("team_id").notNull(),
    league: leagueType().notNull(),
    fullName: text("full_name").notNull(),
    abbreviation: text(),
    location: text(),
    mascot: text(),
    arena: text(),
  },
  (table) => [primaryKey({ columns: [table.teamId, table.league] })],
);

export const player = pgTable(
  "player",
  {
    playerId: integer("player_id").notNull(),
    status: text().notNull(),
    name: text().notNull(),
    teamId: integer("team_id").notNull(),
    league: leagueType().notNull(),
    position: text().notNull(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "string",
    })
      .defaultNow()
      .notNull(),
    height: text(),
    weight: integer(),
    number: integer(),
  },
  (table) => [
    primaryKey({ columns: [table.playerId, table.league] }),
    foreignKey({
      columns: [table.teamId, table.league],
      foreignColumns: [team.teamId, team.league],
      name: "fk_team_player",
    }).onDelete("cascade"),
    index("idx_player_position_league").on(table.position, table.league),
  ],
);

export const game = pgTable(
  "game",
  {
    gameId: text("game_id").notNull(),
    startTime: timestamp("start_time", {
      withTimezone: true,
      mode: "string",
    }),
    homeTeamId: integer("home_team_id").notNull(),
    awayTeamId: integer("away_team_id").notNull(),
    league: leagueType().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.gameId, table.league] }),
    foreignKey({
      columns: [table.homeTeamId, table.league],
      foreignColumns: [team.teamId, team.league],
      name: "fk_home_team_game",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.awayTeamId, table.league],
      foreignColumns: [team.teamId, team.league],
      name: "fk_away_team_game",
    }).onDelete("cascade"),
    index("idx_game_start_time_league").on(table.startTime, table.league),
  ],
);

export const prop = pgTable(
  "prop",
  {
    id: serial().primaryKey().notNull(),
    line: doublePrecision().notNull(),
    currentValue: doublePrecision("current_value").default(0).notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    })
      .defaultNow()
      .notNull(),
    statName: text("stat_name").notNull(),
    statDisplayName: text("stat_display_name").notNull(),
    status: propStatus().default("not_resolved").notNull(),
    choices: text().array().default(["over", "under"]).notNull(),
    playerId: integer("player_id").notNull(),
    league: leagueType().notNull(),
    gameId: text("game_id").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.gameId, table.league],
      foreignColumns: [game.gameId, game.league],
      name: "fk_game_prop",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.playerId, table.league],
      foreignColumns: [player.playerId, player.league],
      name: "fk_player_prop",
    }).onDelete("cascade"),
    index("idx_prop_game_league").on(table.gameId, table.league),
    index("idx_prop_player_league").on(table.playerId, table.league),
    index("idx_prop_league_status").on(table.league, table.status),
  ],
);

export const parlay = pgTable("parlay", {
  stake: doublePrecision().notNull(),
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "string",
  })
    .defaultNow()
    .notNull(),
  id: serial().primaryKey().notNull(),
  matchUserId: integer("match_user_id")
    .notNull()
    .references(() => matchUser.id, { onDelete: "cascade" }),
  resolved: boolean().default(false).notNull(),
  profit: doublePrecision().default(0).notNull(),
  type: parlayType().notNull(),
}, (table) => [
  index("idx_parlay_match_user_id").on(table.matchUserId),
  index("idx_parlay_resolved").on(table.resolved),
]);

export const matchUser = pgTable("match_user", {
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "string",
  })
    .defaultNow()
    .notNull(),
  balance: doublePrecision().default(200).notNull(),
  pointsDelta: doublePrecision("points_delta").default(0).notNull(),
  status: matchStatus().default("not_resolved").notNull(),
  id: serial().primaryKey().notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  matchId: integer("match_id")
    .notNull()
    .references(() => match.id, { onDelete: "cascade" }),
  startingBalance: doublePrecision("starting_balance").default(100).notNull(),
  pointsSnapshot: doublePrecision("points_snapshot").notNull(),
}, (table) => [
  index("idx_match_user_user_status").on(table.userId, table.status),
  index("idx_match_user_created_at").on(table.createdAt),
  index("idx_match_user_match_id").on(table.matchId),
]);

export const match = pgTable("match", {
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "string",
  })
    .defaultNow()
    .notNull(),
  resolved: boolean().default(false).notNull(),
  id: serial().primaryKey().notNull(),
  league: leagueType().notNull(),
  type: text().default("competitive").notNull(),
}, (table) => [
  index("idx_match_resolved").on(table.resolved),
  index("idx_match_league").on(table.league),
]);

export const friendship = pgTable(
  "friendship",
  {
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "string",
    })
      .defaultNow()
      .notNull(),
    incomingId: text("incoming_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    outgoingId: text("outgoing_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    status: friendshipStatus().default("pending").notNull(),
  },
  (table) => [primaryKey({ columns: [table.outgoingId, table.incomingId] })],
);

export const friendlyMatchRequest = pgTable("friendly_match_request", {
  id: serial().primaryKey().notNull(),
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "string",
  })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", {
    withTimezone: true,
    mode: "string",
  })
    .defaultNow()
    .notNull(),
  incomingId: text("incoming_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  outgoingId: text("outgoing_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  status: friendlyMatchRequestStatus().default("pending").notNull(),
  league: leagueType().notNull(),
});

export const baseballPlayerStats = pgTable(
  "baseball_player_stats",
  {
    id: serial().primaryKey().notNull(),
    errors: integer().default(0).notNull(),
    hits: integer().default(0).notNull(),
    runs: integer().default(0).notNull(),
    singles: integer().default(0).notNull(),
    doubles: integer().default(0).notNull(),
    triples: integer().default(0).notNull(),
    atBats: integer("at_bats").default(0).notNull(),
    walks: integer().default(0).notNull(),
    caughtStealing: integer("caught_stealing").default(0).notNull(),
    homeRuns: integer("home_runs").default(0).notNull(),
    putouts: integer().default(0).notNull(),
    stolenBases: integer("stolen_bases").default(0).notNull(),
    strikeouts: integer().default(0).notNull(),
    hitByPitch: integer("hit_by_pitch").default(0).notNull(),
    intentionalWalks: integer("intentional_walks").default(0).notNull(),
    rbis: integer().default(0).notNull(),
    outs: integer().default(0).notNull(),
    hitsAllowed: integer("hits_allowed").default(0).notNull(),
    pitchingStrikeouts: integer("pitching_strikeouts").default(0).notNull(),
    losses: integer().default(0).notNull(),
    earnedRuns: integer("earned_runs").default(0).notNull(),
    saves: integer().default(0).notNull(),
    runsAllowed: integer("runs_allowed").default(0).notNull(),
    wins: integer().default(0).notNull(),
    singlesAllowed: integer("singles_allowed").default(0).notNull(),
    doublesAllowed: integer("doubles_allowed").default(0).notNull(),
    triplesAllowed: integer("triples_allowed").default(0).notNull(),
    pitchingWalks: integer("pitching_walks").default(0).notNull(),
    balks: integer().default(0).notNull(),
    blownSaves: integer("blown_saves").default(0).notNull(),
    pitchingCaughtStealing: integer("pitching_caught_stealing")
      .default(0)
      .notNull(),
    homeRunsAllowed: integer("home_runs_allowed").default(0).notNull(),
    inningsPitched: doublePrecision("innings_pitched").default(0).notNull(),
    pitchingPutouts: integer("pitching_putouts").default(0).notNull(),
    stolenBasesAllowed: integer("stolen_bases_allowed").default(0).notNull(),
    wildPitches: integer("wild_pitches").default(0).notNull(),
    pitchingHitByPitch: integer("pitching_hit_by_pitch").default(0).notNull(),
    holds: integer().default(0).notNull(),
    pitchingIntentionalWalks: integer("pitching_intentional_walks")
      .default(0)
      .notNull(),
    pitchesThrown: integer("pitches_thrown").default(0).notNull(),
    strikes: integer().default(0).notNull(),
    gameId: text("game_id").notNull(),
    playerId: integer("player_id").notNull(),
    teamId: integer("team_id").notNull(),
    league: leagueType().notNull(),
    status: text().notNull(),
    // Extended batting stats
    battingAvg: doublePrecision("batting_avg").default(0.0).notNull(),
    obp: doublePrecision().default(0.0).notNull(),
    sluggingPct: doublePrecision("slugging_pct").default(0.0).notNull(),
    ops: doublePrecision().default(0.0).notNull(),
    hitsRunsRbis: integer("hits_runs_rbis").default(0).notNull(),
    // Extended pitching stats
    era: doublePrecision().default(0.0).notNull(),
    whip: doublePrecision().default(0.0).notNull(),
    kPerNine: doublePrecision("k_per_nine").default(0.0).notNull(),
    strikePct: doublePrecision("strike_pct").default(0.0).notNull()
  },
  (table) => [
    foreignKey({
      columns: [table.playerId, table.league],
      foreignColumns: [player.playerId, player.league],
      name: "fk_player_baseball_player_stats",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.gameId, table.league],
      foreignColumns: [game.gameId, game.league],
      name: "fk_game_baseball_player_stats",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.teamId, team.league],
      foreignColumns: [team.teamId, team.league],
      name: "fk_team_baseball_player_stats"
    }),
    index("idx_baseball_player_stats_player_league").on(table.playerId, table.league),
    index("idx_baseball_player_stats_game_league").on(table.gameId, table.league),
    index("idx_baseball_player_stats_league_status").on(table.league, table.status),
    index("idx_baseball_player_stats_team_league").on(table.teamId, table.league),
  ],
);

export const baseballTeamStats = pgTable(
  "baseball_team_stats",
  {
    id: serial().primaryKey().notNull(),
    errors: integer().default(0).notNull(),
    hits: integer().default(0).notNull(),
    runs: integer().default(0).notNull(),
    doubles: integer().default(0).notNull(),
    triples: integer().default(0).notNull(),
    atBats: integer("at_bats").default(0).notNull(),
    walks: integer().default(0).notNull(),
    caughtStealing: integer("caught_stealing").default(0).notNull(),
    homeRuns: integer().default(0).notNull(),
    stolenBases: integer("stolen_bases").default(0).notNull(),
    strikeouts: integer().default(0).notNull(),
    rbis: integer().default(0).notNull(),
    teamId: integer("team_id").notNull(),
    league: leagueType().notNull(),
    gameId: text("game_id").notNull(),
    // Extended baseball team stats
    homeRunsAllowed: integer("home_runs_allowed").default(0).notNull(),
    doublesAllowed: integer("doubles_allowed").default(0).notNull(),
    triplesAllowed: integer("triples_allowed").default(0).notNull(),
    hitsAllowed: integer().default(0).notNull(),
    runsAllowed: integer().default(0).notNull(),
    strikes: integer().default(0).notNull(),
    pitchingWalks: integer("pitching_walks").default(0).notNull(),
    pitchesThrown: integer().default(0).notNull(),
    pitchingStrikeouts: integer("pitching_strikeouts").default(0).notNull(),
    battingAvg: doublePrecision("batting_avg").default(0.0).notNull(),
    obp: doublePrecision("on_base_percentage").default(0.0).notNull(),
    pitchingCaughtStealing: integer("pitching_caught_stealing").default(0).notNull(),
    sluggingPct: doublePrecision("slugging_pct").default(0.0).notNull(),
    ops: doublePrecision().default(0.0).notNull(),
    stolenBasesAllowed: integer("stolen_bases_allowed").default(0).notNull(),
    earnedRuns: integer("earned_runs").default(0).notNull()
  },
  (table) => [
    foreignKey({
      columns: [table.teamId, table.league],
      foreignColumns: [team.teamId, team.league],
      name: "fk_team_baseball_team_stats",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.gameId, table.league],
      foreignColumns: [game.gameId, game.league],
      name: "fk_game_baseball_team_stats",
    }).onDelete("cascade"),
    index("idx_baseball_team_stats_team_league").on(table.teamId, table.league),
    index("idx_baseball_team_stats_game_league").on(table.gameId, table.league),
  ],
);

export const basketballPlayerStats = pgTable(
  "basketball_player_stats",
  {
    id: serial().primaryKey().notNull(),
    playerId: integer("player_id").notNull(),
    gameId: text("game_id").notNull(),
    teamId: integer("team_id").notNull(),
    league: leagueType().notNull(),
    fouls: integer().default(0).notNull(),
    blocks: integer().default(0).notNull(),
    points: integer().default(0).notNull(),
    steals: integer().default(0).notNull(),
    assists: integer().default(0).notNull(),
    minutes: doublePrecision().default(0.0).notNull(),
    turnovers: integer().default(0).notNull(),
    rebounds: integer().default(0).notNull(),
    twoPointsMade: integer("two_points_made").default(0).notNull(),
    fieldGoalsMade: integer("field_goals_made").default(0).notNull(),
    freeThrowsMade: integer("free_throws_made").default(0).notNull(),
    threePointsMade: integer("three_points_made").default(0).notNull(),
    defensiveRebounds: integer("defensive_rebounds").default(0).notNull(),
    offensiveRebounds: integer("offensive_rebounds").default(0).notNull(),
    twoPointPercentage: doublePrecision("two_point_percentage")
      .default(0.0)
      .notNull(),
    twoPointsAttempted: integer("two_points_attempted").default(0).notNull(),
    fieldGoalsAttempted: integer("field_goals_attempted").default(0).notNull(),
    freeThrowsAttempted: integer("free_throws_attempted").default(0).notNull(),
    threePointsAttempted: integer("three_points_attempted")
      .default(0)
      .notNull(),
    status: text().notNull(),
    // Extended basketball player stats
    trueShootingPct: doublePrecision("true_shooting_pct").default(0.0).notNull(),
    usageRate: doublePrecision("usage_rate").default(0.0).notNull(),
    reboundsPct: doublePrecision("rebounds_pct").default(0.0).notNull(),
    assistsPct: doublePrecision("assists_pct").default(0.0).notNull(),
    blocksPct: doublePrecision("blocks_pct").default(0.0).notNull(),
    stealsPct: doublePrecision("steals_pct").default(0.0).notNull(),
    threePct: doublePrecision("three_pct").default(0.0).notNull(),
    freeThrowPct: doublePrecision("free_throw_pct").default(0.0).notNull(),
    pointsReboundsAssists: integer("points_rebounds_assists").default(0).notNull(),
    pointsRebounds: integer("points_rebounds").default(0).notNull(),
    pointsAssists: integer("points_assists").default(0).notNull(),
    reboundsAssists: integer("rebounds_assists").default(0).notNull()
  },
  (table) => [
    foreignKey({
      columns: [table.playerId, table.league],
      foreignColumns: [player.playerId, player.league],
      name: "fk_player_basketball_player_stats",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.gameId, table.league],
      foreignColumns: [game.gameId, game.league],
      name: "fk_game_basketball_player_stats",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.teamId, table.league],
      foreignColumns: [team.teamId, team.league],
      name: "fk_team_basketball_player_stats"
    }),
    index("idx_basketball_player_stats_player_league").on(table.playerId, table.league),
    index("idx_basketball_player_stats_game_league").on(table.gameId, table.league),
    index("idx_basketball_player_stats_league_status").on(table.league, table.status),
    index("idx_basketball_player_stats_team_league").on(table.teamId, table.league),
  ],
);

export const basketballTeamStats = pgTable(
  "basketball_team_stats",
  {
    id: serial().primaryKey().notNull(),
    teamId: integer("team_id").notNull(),
    gameId: text("game_id").notNull(),
    league: leagueType().notNull(),
    score: integer().default(0).notNull(),
    fouls: integer().default(0).notNull(),
    blocks: integer().default(0).notNull(),
    steals: integer().default(0).notNull(),
    assists: integer().default(0).notNull(),
    turnovers: integer().default(0).notNull(),
    rebounds: integer().default(0).notNull(),
    twoPointsMade: integer("two_points_made").default(0).notNull(),
    fieldGoalsMade: integer("field_goals_made").default(0).notNull(),
    freeThrowsMade: integer("free_throws_made").default(0).notNull(),
    threePointsMade: integer("three_points_made").default(0).notNull(),
    defensiveRebounds: integer("defensive_rebounds").default(0).notNull(),
    offensiveRebounds: integer("offensive_rebounds").default(0).notNull(),
    twoPointPercentage: doublePrecision("two_point_percentage")
      .default(0.0)
      .notNull(),
    twoPointsAttempted: integer("two_points_attempted").default(0).notNull(),
    fieldGoalsAttempted: integer("field_goals_attempted").default(0).notNull(),
    freeThrowsAttempted: integer("free_throws_attempted").default(0).notNull(),
    threePointsAttempted: integer("three_points_attempted")
      .default(0)
      .notNull(),
    // Extended basketball team stats
    pace: doublePrecision().default(0.0).notNull(),
    offensiveRating: doublePrecision("offensive_rating").default(0.0).notNull(),
    defensiveRating: doublePrecision("defensive_rating").default(0.0).notNull()
  },
  (table) => [
    foreignKey({
      columns: [table.teamId, table.league],
      foreignColumns: [team.teamId, team.league],
      name: "fk_team_basketball_team_stats",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.gameId, table.league],
      foreignColumns: [game.gameId, game.league],
      name: "fk_game_basketball_team_stats",
    }).onDelete("cascade"),
    index("idx_basketball_team_stats_team_league").on(table.teamId, table.league),
    index("idx_basketball_team_stats_game_league").on(table.gameId, table.league),
  ],
);

export const footballPlayerStats = pgTable(
  "football_player_stats",
  {
    id: serial().primaryKey().notNull(),
    playerId: integer("player_id").notNull(),
    teamId: integer("team_id").notNull(),
    gameId: text("game_id").notNull(),
    league: leagueType().notNull(),
    completions: integer().default(0).notNull(),
    fumblesLost: integer("fumbles_lost").default(0).notNull(),
    rushingLong: doublePrecision("rushing_long").default(0).notNull(),
    receivingLong: doublePrecision("receiving_long").default(0.0).notNull(),
    passerRating: doublePrecision("passer_rating").default(0.0).notNull(),
    passingYards: doublePrecision("passing_yards").default(0.0).notNull(),
    rushingYards: doublePrecision("rushing_yards").default(0.0).notNull(),
    receivingYards: doublePrecision("receiving_yards").default(0.0).notNull(),
    passingAttempts: integer("passing_attempts").default(0).notNull(),
    rushingAttempts: integer("rushing_attempts").default(0).notNull(),
    fumbleRecoveries: integer("fumble_recoveries").default(0).notNull(),
    passingTouchdowns: integer("passing_touchdowns").default(0).notNull(),
    rushingTouchdowns: integer("rushing_touchdowns").default(0).notNull(),
    receivingTouchdowns: integer("receiving_touchdowns").default(0).notNull(),
    passingInterceptions: integer("passing_interceptions").default(0).notNull(),
    receptions: integer().default(0).notNull(),
    fieldGoalsAttempted: integer("field_goals_attempted").default(0).notNull(),
    fieldGoalsMade: integer("field_goals_made").default(0).notNull(),
    fieldGoalsLong: doublePrecision("field_goals_long").default(0.0).notNull(),
    extraPointsAttempted: integer("extra_points_attempted")
      .default(0)
      .notNull(),
    extraPointsMade: integer("extra_points_made").default(0).notNull(),
    status: text().notNull(),
    // Extended football player stats
    completionPct: doublePrecision("completion_pct").default(0.0).notNull(),
    yardsPerAttempt: doublePrecision("yards_per_attempt").default(0.0).notNull(),
    yardsPerCompletion: doublePrecision("yards_per_completion").default(0.0).notNull(),
    yardsPerCarry: doublePrecision("yards_per_carry").default(0.0).notNull(),
    yardsPerReception: doublePrecision("yards_per_reception").default(0.0).notNull(),
    fieldGoalPct: doublePrecision("field_goal_pct").default(0.0).notNull(),
    extraPointPct: doublePrecision("extra_point_pct").default(0.0).notNull(),
    receivingRushingTouchdowns: integer("receiving_rushing_touchdowns").default(0).notNull(),
    passingRushingTouchdowns: integer("passing_rushing_touchdowns").default(0).notNull(),
    totalYards: doublePrecision("total_yards").default(0.0).notNull()
  },
  (table) => [
    foreignKey({
      columns: [table.playerId, table.league],
      foreignColumns: [player.playerId, player.league],
      name: "fk_player_football_player_stats",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.gameId, table.league],
      foreignColumns: [game.gameId, game.league],
      name: "fk_game_football_player_stats",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.teamId, table.league],
      foreignColumns: [team.teamId, team.league],
      name: "fk_team_football_player_stats"
    }),
    index("idx_football_player_stats_player_league").on(table.playerId, table.league),
    index("idx_football_player_stats_game_league").on(table.gameId, table.league),
    index("idx_football_player_stats_league_status").on(table.league, table.status),
    index("idx_football_player_stats_team_league").on(table.teamId, table.league),
  ],
);

export const footballTeamStats = pgTable(
  "football_team_stats",
  {
    id: serial().primaryKey().notNull(),
    teamId: integer("team_id").notNull(),
    gameId: text("game_id").notNull(),
    league: leagueType().notNull(),
    score: integer().default(0).notNull(),
    sacks: doublePrecision().default(0).notNull(),
    safeties: integer().default(0).notNull(),
    penaltiesTotal: integer("penalties_total").default(0).notNull(),
    penaltiesYards: integer("penalties_yards").default(0).notNull(),
    turnovers: integer().default(0).notNull(),
    firstDowns: integer("first_downs").default(0).notNull(),
    totalYards: integer("total_yards").default(0).notNull(),
    blockedKicks: integer("blocked_kicks").default(0).notNull(),
    blockedPunts: integer("blocked_punts").default(0).notNull(),
    kicksBlocked: integer("kicks_blocked").default(0).notNull(),
    passingYards: integer("passing_yards").default(0).notNull(),
    puntsBlocked: integer("punts_blocked").default(0).notNull(),
    rushingYards: integer("rushing_yards").default(0).notNull(),
    defenseTouchdowns: integer("defense_touchdowns").default(0).notNull(),
    defenseInterceptions: integer("defense_interceptions").default(0).notNull(),
    kickReturnTouchdowns: integer("kick_return_touchdowns")
      .default(0)
      .notNull(),
    puntReturnTouchdowns: integer("punt_return_touchdowns")
      .default(0)
      .notNull(),
    blockedKickTouchdowns: integer("blocked_kick_touchdowns")
      .default(0)
      .notNull(),
    blockedPuntTouchdowns: integer("blocked_punt_touchdowns")
      .default(0)
      .notNull(),
    interceptionTouchdowns: integer("interception_touchdowns")
      .default(0)
      .notNull(),
    fumbleReturnTouchdowns: integer("fumble_return_touchdowns")
      .default(0)
      .notNull(),
    defenseFumbleRecoveries: integer("defense_fumble_recoveries")
      .default(0)
      .notNull(),
    fieldGoalReturnTouchdowns: integer("field_goal_return_touchdowns")
      .default(0)
      .notNull(),
    twoPointConversionReturns: integer("two_point_conversion_returns")
      .default(0)
      .notNull(),
    twoPointConversionAttempts: integer("two_point_conversion_attempts")
      .default(0)
      .notNull(),
    twoPointConversionSucceeded: integer("two_point_conversion_succeeded")
      .default(0)
      .notNull(),
    pointsAgainstDefenseSpecialTeams: integer(
      "points_against_defense_special_teams",
    )
      .default(0)
      .notNull(),
    // constrained by external API
    passingTouchdowns: integer("passing_touchdowns"),
    rushingTouchdowns: integer("rushing_touchdowns"),
    specialTeamsTouchdowns: integer("special_teams_touchdowns"),
    passingYardsAllowed: integer("passing_yards_allowed"),
    rushingYardsAllowed: integer("rushing_yards_allowed"),
    offenseTouchdowns: integer("offense_touchdowns"),
    // Extended football team stats
    completionsAllowed: integer("completions_allowed").default(0).notNull(),
    passingTouchdownsAllowed: integer("passing_touchdowns_allowed").default(0).notNull(),
    rushingTouchdownsAllowed: integer("rushing_touchdowns_allowed").default(0).notNull()
  },
  (table) => [
    foreignKey({
      columns: [table.teamId, table.league],
      foreignColumns: [team.teamId, team.league],
      name: "fk_team_football_team_stats",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.gameId, table.league],
      foreignColumns: [game.gameId, game.league],
      name: "fk_game_football_team_stats",
    }).onDelete("cascade"),
    index("idx_football_team_stats_team_league").on(table.teamId, table.league),
    index("idx_football_team_stats_game_league").on(table.gameId, table.league),
  ],
);
