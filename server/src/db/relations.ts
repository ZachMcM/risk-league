import { relations } from "drizzle-orm";
import {
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
}));

export const gameRelations = relations(game, ({ one, many }) => ({
  awayTeam: one(team, {
    fields: [game.awayteamId],
    references: [team.id],
  }),
  homeTeam: one(team, {
    fields: [game.homeTeamId],
    references: [team.id],
  }),
  props: many(prop),
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
    fields: [player.teamId],
    references: [team.id],
  }),
  props: many(prop),
}));

export const propRelations = relations(prop, ({ one, many }) => ({
  player: one(player, {
    fields: [prop.playerId],
    references: [player.id],
  }),
  game: one(game, {
    fields: [prop.gameId],
    references: [game.id],
  }),
  picks: many(pick),
}));

export const parlayRelations = relations(parlay, ({ one, many }) => ({
  matchUser: one(matchUser, {
    fields: [parlay.matchUserId],
    references: [matchUser.id],
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
