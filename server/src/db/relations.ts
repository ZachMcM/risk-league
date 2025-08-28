import { relations } from "drizzle-orm";
import {
  baseballPlayerStats,
  baseballTeamStats,
  basketballPlayerStats,
  basketballTeamStats,
  dynastyLeague,
  dynastyLeagueInvitation,
  dynastyLeagueUser,
  footballPlayerStats,
  footballTeamStats,
  friendlyMatchRequest,
  friendship,
  game,
  match,
  matchUser,
  message,
  parlay,
  pick,
  player,
  prop,
  team,
  user,
} from "./schema";

export const userRelations = relations(user, ({ many }) => ({
  matchUsers: many(matchUser),
  incomingFriendships: many(friendship, {
    relationName: "incomingFriendships",
  }),
  outgoingFriendships: many(friendship, {
    relationName: "outgoingFriendships",
  }),
  outgoingFriendlyMatchRequests: many(friendlyMatchRequest, {
    relationName: "outgoingFriendlyMatchRequests",
  }),
  incomingFriendlyMatchRequests: many(friendlyMatchRequest, {
    relationName: "incomingFriendlyMatchRequests",
  }),
  dynastyLeagueUsers: many(dynastyLeagueUser),
  outgoingDynastyLeagueInvitations: many(dynastyLeagueInvitation, {
    relationName: "outgoingDynastyLeagueInvitations",
  }),
  incomingDynastyLeagueInvitations: many(dynastyLeagueInvitation, {
    relationName: "incomingDynastyLeagueInvitations",
  }),
}));

export const matchRelations = relations(match, ({ many }) => ({
  matchUsers: many(matchUser),
  messages: many(message),
}));

export const messageRelations = relations(message, ({ one }) => ({
  user: one(user, {
    fields: [message.userId],
    references: [user.id],
  }),
  match: one(match, {
    fields: [message.matchId],
    references: [match.id],
  }),
  dynastyLeague: one(dynastyLeague, {
    fields: [message.dynastyLeagueId],
    references: [dynastyLeague.id],
  }),
}));

export const dynastyLeagueRelations = relations(dynastyLeague, ({ many }) => ({
  dynastyLeagueUsers: many(dynastyLeagueUser),
  messages: many(message),
}));

export const dynastyLeagueUserRelations = relations(
  dynastyLeagueUser,
  ({ one, many }) => ({
    user: one(user, {
      fields: [dynastyLeagueUser.userId],
      references: [user.id],
    }),
    dynastyLeague: one(dynastyLeague, {
      fields: [dynastyLeagueUser.dynastyLeagueId],
      references: [dynastyLeague.id],
    }),
    parlays: many(parlay),
  })
);

export const gameRelations = relations(game, ({ one, many }) => ({
  awayTeam: one(team, {
    fields: [game.awayTeamId, game.league],
    references: [team.teamId, team.league],
  }),
  homeTeam: one(team, {
    fields: [game.homeTeamId, game.league],
    references: [team.teamId, team.league],
  }),
  props: many(prop),
  baseballPlayerStats: many(baseballPlayerStats),
  baseballTeamStats: many(baseballTeamStats),
  basketballPlayerStats: many(basketballPlayerStats),
  basketballTeamStats: many(basketballTeamStats),
  footballPlayerStats: many(footballPlayerStats),
  footballTeamStats: many(footballTeamStats),
}));

export const pickRelations = relations(pick, ({ one }) => ({
  parlay: one(parlay, {
    fields: [pick.parlayId],
    references: [parlay.id],
  }),
  prop: one(prop, {
    fields: [pick.propId],
    references: [prop.id],
  }),
}));

export const playerRelations = relations(player, ({ one, many }) => ({
  team: one(team, {
    fields: [player.teamId, player.league],
    references: [team.teamId, team.league],
  }),
  props: many(prop),
  baseballPlayerStats: many(baseballPlayerStats),
  basketballPlayerStats: many(basketballPlayerStats),
  footballPlayerStats: many(footballPlayerStats),
}));

export const teamRelations = relations(team, ({ many }) => ({
  baseballTeamStats: many(baseballTeamStats),
  basketballTeamStats: many(basketballTeamStats),
  footballTeamStats: many(footballTeamStats),
  players: many(player),
  basketballPlayerStats: many(basketballPlayerStats),
  baseballPlayerStats: many(baseballPlayerStats),
  footballPlayerStats: many(footballPlayerStats),
}));

export const propRelations = relations(prop, ({ one, many }) => ({
  player: one(player, {
    fields: [prop.playerId, prop.league],
    references: [player.playerId, player.league],
  }),
  game: one(game, {
    fields: [prop.gameId, prop.league],
    references: [game.gameId, game.league],
  }),
  picks: many(pick),
}));

export const parlayRelations = relations(parlay, ({ one, many }) => ({
  matchUser: one(matchUser, {
    fields: [parlay.matchUserId],
    references: [matchUser.id],
  }),
  dynastyLeagueUser: one(dynastyLeagueUser, {
    fields: [parlay.dynastyLeagueUserId],
    references: [dynastyLeagueUser.id],
  }),
  picks: many(pick),
}));

export const matchUserRelations = relations(matchUser, ({ one, many }) => ({
  user: one(user, {
    fields: [matchUser.userId],
    references: [user.id],
  }),
  match: one(match, {
    fields: [matchUser.matchId],
    references: [match.id],
  }),
  parlays: many(parlay),
}));

export const friendshipRelations = relations(friendship, ({ one }) => ({
  incomingUser: one(user, {
    fields: [friendship.incomingId],
    references: [user.id],
    relationName: "incomingFriendships",
  }),
  outgoingUser: one(user, {
    fields: [friendship.outgoingId],
    references: [user.id],
    relationName: "outgoingFriendships",
  }),
}));

export const friendlyMatchRequestRelations = relations(
  friendlyMatchRequest,
  ({ one }) => ({
    incomingUser: one(user, {
      fields: [friendlyMatchRequest.incomingId],
      references: [user.id],
      relationName: "incomingFriendlyMatchRequests",
    }),
    outgoingUser: one(user, {
      fields: [friendlyMatchRequest.outgoingId],
      references: [user.id],
      relationName: "outgoingFriendlyMatchRequests",
    }),
  })
);

export const baseballPlayerStatsRelations = relations(
  baseballPlayerStats,
  ({ one }) => ({
    game: one(game, {
      fields: [baseballPlayerStats.gameId, baseballPlayerStats.league],
      references: [game.gameId, game.league],
    }),
    player: one(player, {
      fields: [baseballPlayerStats.playerId, baseballPlayerStats.league],
      references: [player.playerId, player.league],
    }),
    team: one(team, {
      fields: [baseballPlayerStats.teamId, baseballPlayerStats.league],
      references: [team.teamId, team.league],
    }),
  })
);

export const baseballTeamStatsRelations = relations(
  baseballTeamStats,
  ({ one }) => ({
    game: one(game, {
      fields: [baseballTeamStats.gameId, baseballTeamStats.league],
      references: [game.gameId, game.league],
    }),
    team: one(team, {
      fields: [baseballTeamStats.teamId, baseballTeamStats.league],
      references: [team.teamId, team.league],
    }),
  })
);

export const basketballPlayerStatsRelations = relations(
  basketballPlayerStats,
  ({ one }) => ({
    game: one(game, {
      fields: [basketballPlayerStats.gameId, basketballPlayerStats.league],
      references: [game.gameId, game.league],
    }),
    player: one(player, {
      fields: [basketballPlayerStats.playerId, basketballPlayerStats.league],
      references: [player.playerId, player.league],
    }),
    team: one(team, {
      fields: [basketballPlayerStats.teamId, basketballPlayerStats.league],
      references: [team.teamId, team.league],
    }),
  })
);

export const basketballTeamStatsRelations = relations(
  basketballTeamStats,
  ({ one }) => ({
    game: one(game, {
      fields: [basketballTeamStats.gameId, basketballTeamStats.league],
      references: [game.gameId, game.league],
    }),
    team: one(team, {
      fields: [basketballTeamStats.teamId, basketballTeamStats.league],
      references: [team.teamId, team.league],
    }),
  })
);

export const footballPlayerStatsRelations = relations(
  footballPlayerStats,
  ({ one }) => ({
    game: one(game, {
      fields: [footballPlayerStats.gameId, footballPlayerStats.league],
      references: [game.gameId, game.league],
    }),
    player: one(player, {
      fields: [footballPlayerStats.playerId, footballPlayerStats.league],
      references: [player.playerId, player.league],
    }),
    team: one(team, {
      fields: [footballPlayerStats.teamId, footballPlayerStats.league],
      references: [team.teamId, team.league],
    }),
  })
);

export const footballTeamStatsRelations = relations(
  footballTeamStats,
  ({ one }) => ({
    game: one(game, {
      fields: [footballTeamStats.gameId, footballTeamStats.league],
      references: [game.gameId, game.league],
    }),
    team: one(team, {
      fields: [footballTeamStats.teamId, footballTeamStats.league],
      references: [team.teamId, team.league],
    }),
  })
);
