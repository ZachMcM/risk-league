import {
  boolean,
  doublePrecision,
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
export const choiceType = pgEnum("choice_type", ["over", "under"]);

export const friendshipStatus = pgEnum("friendship_status", [
  "pending",
  "accepted",
]);

export const friendlyMatchRequestStatus = pgEnum(
  "friendly_match_request_status",
  ["pending", "accepted", "declined"]
);

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
    () => /* @__PURE__ */ new Date()
  ),
  updatedAt: timestamp("updated_at").$defaultFn(
    () => /* @__PURE__ */ new Date()
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
});

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
});

export const team = pgTable("team", {
  id: integer().primaryKey().notNull(),
  fullName: text("full_name").notNull(),
  abbreviation: text().notNull(),
  nickname: text().notNull(),
  city: text().notNull(),
  state: text().notNull(),
  yearFounded: integer("year_founded").notNull(),
  league: text().notNull(),
});

export const player = pgTable("player", {
  id: integer().primaryKey().notNull(),
  name: text().notNull(),
  teamId: integer("team_id")
    .notNull()
    .references(() => team.id, { onDelete: "cascade" }),
  position: text().notNull(),
  updatedAt: timestamp("updated_at", {
    withTimezone: true,
    mode: "string",
  })
    .defaultNow()
    .notNull(),
  height: text().notNull(),
  weight: text().notNull(),
  number: text().notNull(),
  league: text().notNull(),
});

export const game = pgTable("game", {
  id: integer().primaryKey().notNull(),
  startTime: timestamp("start_time", {
    withTimezone: true,
    mode: "string",
  }),
  homeTeamId: integer("home_team_id")
    .notNull()
    .references(() => team.id, { onDelete: "cascade" }),
  awayteamId: integer("away_team_id")
    .notNull()
    .references(() => team.id, { onDelete: "cascade" }),
  league: text().notNull(),
});

export const prop = pgTable("prop", {
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
  league: text().notNull(),
  resolved: boolean().default(false).notNull(),
  choices: text().array().default(["over", "under"]).notNull(),
  id: serial().primaryKey().notNull(),
  playerId: integer("player_id")
    .notNull()
    .references(() => player.id, { onDelete: "cascade" }),
  gameId: integer("game_id")
    .notNull()
    .references(() => game.id, { onDelete: "cascade" }),
});

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
});

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
});

export const match = pgTable("match", {
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "string",
  })
    .defaultNow()
    .notNull(),
  resolved: boolean().default(false).notNull(),
  id: serial().primaryKey().notNull(),
  league: text().notNull(),
  type: text().default("competitive").notNull(),
});

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
  (table) => [primaryKey({ columns: [table.outgoingId, table.incomingId] })]
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
  league: text().notNull(),
});
