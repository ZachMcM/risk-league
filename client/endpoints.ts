import { authClient } from "./lib/auth-client";
import { League } from "./lib/config";
import * as ImagePicker from "expo-image-picker";
import { LeaderboardPage } from "./types/leaderboard";
import { ExtendedMatch, FriendlyMatchRequest, Match } from "./types/match";
import { Parlay, Pick } from "./types/parlay";
import { Game, Prop, TodayPlayerProps } from "./types/prop";
import { Rank } from "./types/rank";
import { Career, Friendship, User } from "./types/user";
import { Message } from "./types/message";

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

export async function getUser(id: string): Promise<User> {
  const user = await serverRequest({ endpoint: `/users/${id}`, method: "GET" });
  return user;
}

export async function patchUserImage(
  userId: string,
  asset: ImagePicker.ImagePickerAsset
) {
  const formData = new FormData();

  // In React Native, append the image with uri, type, and name
  formData.append("image", {
    uri: asset.uri,
    type: asset.mimeType || "image/jpeg",
    name: asset.fileName || "image.jpg",
  } as any);

  return await serverRequest({
    endpoint: `/users/${userId}/image`,
    method: "PATCH",
    formData,
  });
}

export async function updateUserProfile(
  userId: string,
  data: {
    username: string;
    name: string;
    image: ImagePicker.ImagePickerAsset | null;
  }
) {
  const formData = new FormData();

  // Add text fields
  formData.append("username", data.username);
  formData.append("name", data.name);

  if (data.image) {
    formData.append("image", {
      uri: data.image.uri,
      type: data.image.mimeType || "image/jpeg",
      name: data.image.fileName || "image.jpg",
    } as any);
  }

  return await serverRequest({
    endpoint: `/users/${userId}`,
    method: "PUT",
    formData,
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

export async function getMatches(resolved: boolean): Promise<Match[]> {
  const matches = await serverRequest({
    endpoint: `/matches?resolved=${resolved}`,
    method: "GET",
  });

  return matches;
}

export async function getMatch(id: number): Promise<ExtendedMatch> {
  const match = await serverRequest({
    endpoint: `/matches/${id}`,
    method: "GET",
  });

  return match;
}

export async function getMessages(id: number): Promise<Message[]> {
  const messages = await serverRequest({
    endpoint: `/matches/${id}/messages`,
    method: "GET",
  });

  return messages;
}

export async function postMessage(matchId: number, content: string) {
  await serverRequest({
    endpoint: `/matches/${matchId}/messages`,
    method: "POST",
    body: JSON.stringify({ content }),
  });
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
}): Promise<{ id: number }> {
  return await serverRequest({
    endpoint: `/parlays?${
      matchId ? `matchId=${matchId}` : `dynastyLeagueId=${dynastyLeagueId}`
    }`,
    method: "POST",
    body: JSON.stringify(parlay),
  });
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
