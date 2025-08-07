import { authClient } from "./lib/auth-client";
import { Match, Message } from "./types/match";
import { Parlay } from "./types/parlay";
import { Prop } from "./types/prop";
import { Rank } from "./types/rank";
import { Career, Friendship, User } from "./types/user";

export type HttpRequestParams = {
  endpoint: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: string;
  tokenOverride?: string;
};

export async function httpRequest({
  endpoint,
  method,
  body,
}: HttpRequestParams) {
  const cookies = authClient.getCookie();

  const headers = {
    Cookie: cookies,
  } as any;

  // Only add Content-Type if body is provided
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const fetchOptions: RequestInit = {
    method,
    headers,
  };

  // Only add body if it's not undefined
  if (body !== undefined) {
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

export async function getUserRank(): Promise<{
  rank: Rank;
  nextRank: Rank;
  progression: number;
  points: number;
}> {
  const user = await httpRequest({
    endpoint: "/users/rank",
    method: "GET",
  });

  return user;
}

export async function getUsers(searchQuery: string): Promise<User[]> {
  const users = await httpRequest({
    endpoint: `/users?searchQuery=${searchQuery}`,
    method: "GET",
  });

  return users;
}

export async function getCareer(): Promise<Career> {
  const career = await httpRequest({
    endpoint: "/users/career",
    method: "GET",
  });

  return career;
}

export async function getMatches(): Promise<Match[]> {
  const matches = await httpRequest({
    endpoint: "/matches",
    method: "GET",
  });

  return matches;
}

export async function getMatch(id: number): Promise<Match> {
  const match = await httpRequest({
    endpoint: `/matches/${id}`,
    method: "GET",
  });

  return match;
}

export async function getMessages(id: number): Promise<Message[]> {
  const messages = await httpRequest({
    endpoint: `/matches/${id}/messages`,
    method: "GET",
  });

  return messages;
}

export async function postMessage(matchId: number, content: string) {
  await httpRequest({
    endpoint: `/matches/${matchId}/messages`,
    method: "POST",
    body: JSON.stringify({ content }),
  });
}

export async function getTodayProps(league: string): Promise<Prop[]> {
  const todayProps = await httpRequest({
    endpoint: `/props/today?league=${league}`,
    method: "GET",
  });

  return todayProps;
}

export async function getParlay(id: number): Promise<Parlay> {
  const parlay = await httpRequest({
    endpoint: `/parlays/${id}`,
    method: "GET",
  });

  return parlay;
}

export async function getParlays(matchId: number): Promise<Parlay[]> {
  const parlays = await httpRequest({
    endpoint: `/parlays?matchId=${matchId}`,
    method: "GET",
  });

  return parlays;
}

export async function postParlay(
  matchId: number,
  parlay: {
    type: string;
    stake: number;
    picks: { prop: Prop; choice: string }[];
  }
) {
  await httpRequest({
    endpoint: `/parlays/${matchId}`,
    method: "POST",
    body: JSON.stringify(parlay),
  });
}

export async function getFriends(): Promise<Friendship[]> {
  const friends = await httpRequest({
    endpoint: "/users/friendships",
    method: "GET",
  });

  return friends;
}

export async function postFriendRequest(incomingId: string) {
  await httpRequest({
    endpoint: "/users/friendships",
    method: "POST",
    body: JSON.stringify({ incomingId }),
  });
}

export async function deleteFriendship(otherId: string) {
  await httpRequest({
    endpoint: `/users/friendships?otherId=${otherId}`,
    method: "DELETE",
  });
}

export async function patchFriendRequest(outgoingId: string) {
  await httpRequest({
    endpoint: `/users/friendships`,
    method: "PATCH",
    body: JSON.stringify({ outgoingId }),
  });
}