import { authClient } from "./lib/auth-client";
import { League } from "./lib/config";
import { LeaderboardPage } from "./types/leaderboard";
import { ExtendedMatch, FriendlyMatchRequest } from "./types/match";
import { Pick } from "./types/pick";
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
}: {
  league?: League;
  matchId?: number;
}): Promise<Prop[]> {
  const todayProps = await serverRequest({
    endpoint: `/props/today?${
      matchId ? `matchId=${matchId}` : `league=${league}`
    }`,
    method: "GET",
  });

  return todayProps;
}

export async function getTodayPlayerProps({
  playerId,
  matchId,
}: {
  playerId: number;
  matchId: number;
}): Promise<TodayPlayerProps> {
  const todayPlayerProps = await serverRequest({
    endpoint: `/props/today/players/${playerId}?matchId=${matchId}`,
    method: "GET",
  });
  return todayPlayerProps;
}

export async function getPick(id: number): Promise<Pick> {
  const pick = await serverRequest({
    endpoint: `/picks/${id}`,
    method: "GET",
  });

  return pick;
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
