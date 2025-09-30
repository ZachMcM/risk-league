import { authClient } from "./lib/auth-client";
import { BATTLE_PASS_ID, League } from "./lib/config";
import { Cosmetic, UserBattlePassProgress } from "./types/battlePass";
import { DynastyLeague, DynastyLeagueUser } from "./types/dynastyLeague";
import { LeaderboardPage } from "./types/leaderboard";
import { ExtendedMatch, FriendlyMatchRequest, Match } from "./types/match";
import { Message } from "./types/message";
import { Parlay, Pick } from "./types/parlay";
import { Game, Prop, TodayPlayerProps } from "./types/prop";
import { Rank } from "./types/rank";
import { Career, Friendship, User } from "./types/user";

export type serverRequestParams = {
  endpoint: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: string;
  formData?: FormData;
  tokenOverride?: string;
};

export async function serverRequest({
  endpoint,
  method,
  body,
  formData,
}: serverRequestParams) {
  const cookies = authClient.getCookie();

  const headers = {
    Cookie: cookies,
  } as any;

  // Only add Content-Type if body is provided (not for FormData)
  if (body !== undefined && !formData) {
    headers["Content-Type"] = "application/json";
  }

  const fetchOptions: RequestInit = {
    method,
    headers,
  };

  // Use formData if provided, otherwise use body
  if (formData !== undefined) {
    fetchOptions.body = formData;
  } else if (body !== undefined) {
    fetchOptions.body = body;
  }

  const res = await fetch(
    `${process.env.EXPO_PUBLIC_API_URL}${endpoint}`,
    fetchOptions
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error);
  }

  return data;
}

export async function patchUserExpoPushToken(value: string) {
  await serverRequest({
    endpoint: `/users/expo-push-token?value=${value}`,
    method: "PATCH",
  });
}

export async function getUser(id: string): Promise<User> {
  const user = await serverRequest({ endpoint: `/users/${id}`, method: "GET" });
  return user;
}

export async function getBattlePassProgress(): Promise<UserBattlePassProgress> {
  const battlePassProgress = await serverRequest({
    endpoint: `/battle-pass/${BATTLE_PASS_ID}/progress`,
    method: "GET",
  });

  return battlePassProgress;
}

export async function postUserBattlePass() {
  await serverRequest({
    endpoint: `/battle-pass/${BATTLE_PASS_ID}`,
    method: "POST",
  });
}

export async function postClaimBattlePassTier(tierId: number) {
  await serverRequest({
    endpoint: `/battle-pass/${BATTLE_PASS_ID}/tier/${tierId}/claim`,
    method: "POST",
  });
}

export async function getAllUserCosmetics(): Promise<{ cosmeticId: number }[]> {
  const all = await serverRequest({
    endpoint: "/users/cosmetics/all",
    method: "GET",
  });

  return all;
}

export async function patchUserBanner(banner: string) {
  return await serverRequest({
    endpoint: `/users/banner`,
    method: "PATCH",
    body: JSON.stringify({ banner }),
  });
}

export async function getTodayGames(league: League): Promise<Game[]> {
  const todayGames = await serverRequest({
    endpoint: `/games/league/${league}/today`,
    method: "GET",
  });

  return todayGames;
}

export async function getUserRank(): Promise<{
  rank: Rank;
  nextRank: Rank;
  progression: number;
  points?: number;
}> {
  const user = await serverRequest({
    endpoint: "/users/rank",
    method: "GET",
  });

  return user;
}

export async function getUserCosmetics(
  cosmeticType: "banner" | "image"
): Promise<Cosmetic[]> {
  const cosmetics = await serverRequest({
    endpoint: `/users/cosmetics/${cosmeticType}`,
    method: "GET",
  });

  return cosmetics;
}

export async function getUsers(query: string): Promise<User[]> {
  const users = await serverRequest({
    endpoint: `/users/search?query=${query}`,
    method: "GET",
  });

  return users;
}

export async function getCareer(id: string): Promise<Career> {
  const career = await serverRequest({
    endpoint: `/users/${id}/career`,
    method: "GET",
  });

  return career;
}

export async function getMatchIds(resolved: boolean): Promise<number[]> {
  const matchIds = await serverRequest({
    endpoint: `/matches?resolved=${resolved}`,
    method: "GET",
  });

  return matchIds;
}

export async function getMatch(id: number): Promise<ExtendedMatch> {
  const match = await serverRequest({
    endpoint: `/matches/${id}`,
    method: "GET",
  });

  return match;
}

export async function postDynastyLeague(
  dynastyLeague: Omit<
    DynastyLeague,
    | "id"
    | "createdAt"
    | "resolved"
    | "userCount"
    | "dynastyLeagueUsers"
    | "adminCup"
    | "cashPrize"
    | "maxUsers"
  >
) {
  const newLeague: { id: number } = await serverRequest({
    endpoint: "/dynastyLeagues",
    method: "POST",
    body: JSON.stringify(dynastyLeague),
  });

  return newLeague;
}

export async function patchDynastyLeagueUsersBonus({
  dynastyLeagueId,
  bonusValue,
}: {
  dynastyLeagueId: number;
  bonusValue: number;
}) {
  await serverRequest({
    endpoint: `/dynastyLeagues/${dynastyLeagueId}/users/bonus`,
    method: "PATCH",
    body: JSON.stringify({ bonusValue }),
  });
}

export async function getDynastyLeague(id: number): Promise<DynastyLeague> {
  const league = await serverRequest({
    endpoint: `/dynastyLeagues/${id}`,
    method: "GET",
  });

  return league;
}

export async function getDynastyLeagueIds(): Promise<number[]> {
  const leagueIds = await serverRequest({
    endpoint: `/dynastyLeagues`,
    method: "GET",
  });

  return leagueIds;
}

export async function getDynastyLeagueUsers(
  id: number
): Promise<DynastyLeagueUser[]> {
  const users = await serverRequest({
    endpoint: `/dynastyLeagues/${id}/users`,
    method: "GET",
  });

  return users;
}

export async function searchDynastyLeagues(
  query: string
): Promise<DynastyLeague[]> {
  const dynastyLeagues = await serverRequest({
    endpoint: `/dynastyLeagues/search?query=${query}`,
    method: "GET",
  });

  return dynastyLeagues;
}

export async function patchDynastyLeagueJoin({
  dynastyLeagueId,
  inviteId,
}: {
  dynastyLeagueId: number;
  inviteId?: string;
}) {
  await serverRequest({
    endpoint: `/dynastyLeagues/${dynastyLeagueId}/join${
      inviteId ? `?inviteId=${inviteId}` : ""
    }`,
    method: "POST",
  });
}

export async function postDynastLeagueInvite(id: number) {
  const newInvite: { id: string } = await serverRequest({
    endpoint: `/dynastyLeagues/${id}/invite`,
    method: "POST",
  });

  return newInvite;
}

export async function patchDynastyLeagueDemoteUser(
  dynastyLeagueId: number,
  userId: string
) {
  await serverRequest({
    endpoint: `/dynastyLeagues/${dynastyLeagueId}/users/${userId}/demote`,
    method: "PATCH",
  });
}

export async function patchDynastyLeaguePromoteUser(
  dynastyLeagueId: number,
  userId: string
) {
  await serverRequest({
    endpoint: `/dynastyLeagues/${dynastyLeagueId}/users/${userId}/promote`,
    method: "PATCH",
  });
}

export async function patchDynastyLeagueKickUser(
  dynastyLeagueId: number,
  userId: string
) {
  await serverRequest({
    endpoint: `/dynastyLeagues/${dynastyLeagueId}/users/${userId}/kick`,
    method: "DELETE",
  });
}

export async function getMessages({
  matchId,
  dynastyLeagueId,
}: {
  matchId?: number;
  dynastyLeagueId?: number;
}): Promise<Message[]> {
  const messages = await serverRequest({
    endpoint: `/${matchId ? "matches" : "dynastyLeagues"}/${
      matchId ?? dynastyLeagueId
    }/messages`,
    method: "GET",
  });

  return messages;
}

export async function postMessage({
  matchId,
  dynastyLeagueId,
  content,
}: {
  matchId?: number;
  dynastyLeagueId?: number;
  content: string;
}) {
  await serverRequest({
    endpoint: `/${matchId ? "matches" : "dynastyLeagues"}/${
      matchId ?? dynastyLeagueId
    }/messages`,
    method: "POST",
    body: JSON.stringify({ content }),
  });
}

export async function getTodayPropsCount(
  league: League
): Promise<{ availableProps: number; totalGames: number }> {
  const propsCount = await serverRequest({
    endpoint: `/props/today/count?league=${league}`,
    method: "GET",
  });

  return propsCount;
}

export async function getTodayProps({
  league,
  matchId,
  dynastyLeagueId,
}: {
  league?: League;
  matchId?: number;
  dynastyLeagueId?: number;
}): Promise<Prop[]> {
  const todayProps = await serverRequest({
    endpoint: `/props/today?${
      matchId
        ? `matchId=${matchId}`
        : dynastyLeagueId
        ? `dynastyLeagueId=${dynastyLeagueId}`
        : `league=${league}`
    }`,
    method: "GET",
  });

  return todayProps;
}

export async function getTodayPlayerProps({
  playerId,
  matchId,
  dynastyLeagueId,
}: {
  playerId: number;
  matchId?: number;
  dynastyLeagueId?: number;
}): Promise<TodayPlayerProps> {
  const todayPlayerProps = await serverRequest({
    endpoint: `/props/today/players/${playerId}?${
      matchId ? `matchId=${matchId}` : `dynastyLeagueId=${dynastyLeagueId}`
    }`,
    method: "GET",
  });
  return todayPlayerProps;
}

export async function getParlay(id: number): Promise<Parlay> {
  const parlay = await serverRequest({
    endpoint: `/parlays/${id}`,
    method: "GET",
  });

  return parlay;
}

export async function getPick(id: number): Promise<Pick> {
  const pick = await serverRequest({
    endpoint: `/picks/${id}`,
    method: "GET",
  });

  return pick;
}

export async function getParlays({
  dynastyLeagueId,
  matchId,
}: {
  matchId?: number;
  dynastyLeagueId?: number;
}): Promise<Parlay[]> {
  const parlays = await serverRequest({
    endpoint: `/parlays?${
      matchId ? `matchId=${matchId}` : `dynastyLeagueId=${dynastyLeagueId}`
    }`,
    method: "GET",
  });

  return parlays;
}

export async function postParlay({
  parlay,
  matchId,
  dynastyLeagueId,
}: {
  parlay: {
    type: string;
    stake: number;
    picks: { prop: Prop; choice: string }[];
  };
  matchId?: number;
  dynastyLeagueId?: number;
}) {
  const newParlay: { parlayId: number } = await serverRequest({
    endpoint: `/parlays?${
      matchId ? `matchId=${matchId}` : `dynastyLeagueId=${dynastyLeagueId}`
    }`,
    method: "POST",
    body: JSON.stringify(parlay),
  });

  return newParlay;
}

export async function getFriendship(
  otherUserId: string
): Promise<Friendship | null> {
  const friendship = await serverRequest({
    endpoint: `/friendship?otherUserId=${otherUserId}`,
    method: "GET",
  });
  return friendship;
}

export async function getFriends(): Promise<Friendship[]> {
  const friends = await serverRequest({
    endpoint: "/friendships",
    method: "GET",
  });

  return friends;
}

export async function postFriendRequest(incomingId: string) {
  await serverRequest({
    endpoint: "/friendships",
    method: "POST",
    body: JSON.stringify({ incomingId }),
  });
}

export async function deleteFriendship(otherId: string) {
  await serverRequest({
    endpoint: `/friendships?otherId=${otherId}`,
    method: "DELETE",
  });
}

export async function patchFriendRequest(outgoingId: string) {
  await serverRequest({
    endpoint: "/friendships",
    method: "PATCH",
    body: JSON.stringify({ outgoingId }),
  });
}

export async function postFriendlyMatchRequest(
  incomingId: string,
  league: League
) {
  await serverRequest({
    endpoint: "/friendly-match-requests",
    method: "POST",
    body: JSON.stringify({ incomingId, league }),
  });
}

export async function patchFriendlyMatchRequest(
  id: number,
  status: "declined" | "accepted"
) {
  await serverRequest({
    endpoint: `/friendly-match-requests/${id}`,
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function getFriendlyMatchRequests(): Promise<
  FriendlyMatchRequest[]
> {
  const friendlyMatchRequests = await serverRequest({
    endpoint: "/friendly-match-requests",
    method: "GET",
  });

  return friendlyMatchRequests;
}

export async function getLeaderboardPage(
  page: number
): Promise<LeaderboardPage> {
  const leaderboardPage = await serverRequest({
    endpoint: `/leaderboard?page=${page}`,
    method: "GET",
  });
  return leaderboardPage;
}
