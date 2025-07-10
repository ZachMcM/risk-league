import { relations } from "drizzle-orm/relations";
import { teams, players, nbaGames, nbaPlayerStats, users, matchUsers, matches, matchMessages, parlays, parlayPicks, props, mlbGames, mlbPlayerStats } from "./schema";

export const playersRelations = relations(players, ({one, many}) => ({
	team: one(teams, {
		fields: [players.teamId],
		references: [teams.id]
	}),
	nbaPlayerStats: many(nbaPlayerStats),
	props: many(props),
	mlbPlayerStats: many(mlbPlayerStats),
}));

export const teamsRelations = relations(teams, ({many}) => ({
	players: many(players),
	nbaGames: many(nbaGames),
	mlbGames_teamId: many(mlbGames, {
		relationName: "mlbGames_teamId_teams_id"
	}),
	mlbGames_opponentTeamId: many(mlbGames, {
		relationName: "mlbGames_opponentTeamId_teams_id"
	}),
}));

export const nbaGamesRelations = relations(nbaGames, ({one, many}) => ({
	team: one(teams, {
		fields: [nbaGames.teamId],
		references: [teams.id]
	}),
	nbaPlayerStats: many(nbaPlayerStats),
}));

export const nbaPlayerStatsRelations = relations(nbaPlayerStats, ({one}) => ({
	nbaGame: one(nbaGames, {
		fields: [nbaPlayerStats.gameId],
		references: [nbaGames.id]
	}),
	player: one(players, {
		fields: [nbaPlayerStats.playerId],
		references: [players.id]
	}),
}));

export const matchUsersRelations = relations(matchUsers, ({one, many}) => ({
	user: one(users, {
		fields: [matchUsers.userId],
		references: [users.id]
	}),
	match: one(matches, {
		fields: [matchUsers.matchId],
		references: [matches.id]
	}),
	parlays: many(parlays),
}));

export const usersRelations = relations(users, ({many}) => ({
	matchUsers: many(matchUsers),
	matchMessages: many(matchMessages),
}));

export const matchesRelations = relations(matches, ({many}) => ({
	matchUsers: many(matchUsers),
	matchMessages: many(matchMessages),
}));

export const matchMessagesRelations = relations(matchMessages, ({one}) => ({
	user: one(users, {
		fields: [matchMessages.userId],
		references: [users.id]
	}),
	match: one(matches, {
		fields: [matchMessages.matchId],
		references: [matches.id]
	}),
}));

export const parlaysRelations = relations(parlays, ({one, many}) => ({
	matchUser: one(matchUsers, {
		fields: [parlays.matchUserId],
		references: [matchUsers.id]
	}),
	parlayPicks: many(parlayPicks),
}));

export const parlayPicksRelations = relations(parlayPicks, ({one}) => ({
	parlay: one(parlays, {
		fields: [parlayPicks.parlayId],
		references: [parlays.id]
	}),
	prop: one(props, {
		fields: [parlayPicks.propId],
		references: [props.id]
	}),
}));

export const propsRelations = relations(props, ({one, many}) => ({
	parlayPicks: many(parlayPicks),
	player: one(players, {
		fields: [props.playerId],
		references: [players.id]
	}),
}));

export const mlbPlayerStatsRelations = relations(mlbPlayerStats, ({one}) => ({
	mlbGame: one(mlbGames, {
		fields: [mlbPlayerStats.gameId],
		references: [mlbGames.id]
	}),
	player: one(players, {
		fields: [mlbPlayerStats.playerId],
		references: [players.id]
	}),
}));

export const mlbGamesRelations = relations(mlbGames, ({one, many}) => ({
	mlbPlayerStats: many(mlbPlayerStats),
	team_teamId: one(teams, {
		fields: [mlbGames.teamId],
		references: [teams.id],
		relationName: "mlbGames_teamId_teams_id"
	}),
	team_opponentTeamId: one(teams, {
		fields: [mlbGames.opponentTeamId],
		references: [teams.id],
		relationName: "mlbGames_opponentTeamId_teams_id"
	}),
}));