import { deleteItemAsync, getItemAsync, setItemAsync } from "expo-secure-store";
import { User } from "./types/user";
import { Match, MatchMessage } from "./types/matches";
import { Prop } from "./types/props";
import { Parlay } from "./types/parlays";

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
  tokenOverride,
}: HttpRequestParams) {
  const accessToken =
    tokenOverride != undefined
      ? tokenOverride
      : await getItemAsync("Access-Token");

  const headers: Record<string, string> = {
    "Access-Token": accessToken!,
  };

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

  return res;
}

export async function sessionRequest(): Promise<
  | {
      user: {
        id: number;
        username: string;
        email: string;
        image: string | null;
      };
    }
  | undefined
  | null
> {
  const accessToken = await getItemAsync("Access-Token");

  if (!accessToken) {
    return null;
  }

  const res = await httpRequest({
    endpoint: "/auth/session",
    method: "GET",
    tokenOverride: accessToken,
  });

  const data = await res.json();
  console.log(data);

  if (!res?.ok) {
    throw new Error(data.message);
  }

  return data;
}

export async function signInRequest({
  email,
  password,
}: {
  email: string;
  password: string;
}): Promise<{ id: string }> {
  const res = await httpRequest({
    endpoint: "/auth/signin",
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  console.log(data);

  if (!res.ok) {
    throw new Error(data.message);
  }

  await setItemAsync("Access-Token", res.headers.get("Access-Token")!);
  return data;
}

export async function signUpRequest({
  email,
  name,
  username,
  password,
}: {
  email: string;
  name: string;
  password: string;
  username: string;
}) {
  const res = await httpRequest({
    endpoint: "/auth/signup",
    method: "POST",
    body: JSON.stringify({ email, name, username, password }),
  });

  const data = await res.json();
  console.log(data);

  if (!res.ok) {
    throw new Error(data.message);
  }

  await setItemAsync("Access-Token", res.headers.get("Access-Token")!);
  return data;
}

export async function signOutRequest() {
  await deleteItemAsync("Access-Token");
}

export async function getUser(id: number): Promise<User | undefined | null> {
  const res = await httpRequest({
    endpoint: `/users/${id}`,
    method: "GET",
  });

  const data = await res.json();
  console.log(data);

  if (!res.ok) {
    throw new Error(data.message);
  }

  return data;
}

export async function getMatches(): Promise<Match[]> {
  const res = await httpRequest({
    endpoint: "/matches",
    method: "GET",
  });

  const data = await res.json();
  console.log(data);

  if (!res.ok) {
    throw new Error(data.message);
  }

  return data;
}

export async function getMatch(id: number): Promise<Match | undefined> {
  const res = await httpRequest({
    endpoint: `/matches/${id}`,
    method: "GET",
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message);
  }

  return data;
}

export async function getMatchMessages(id: number): Promise<MatchMessage[]> {
  const res = await httpRequest({
    endpoint: `/matches/${id}/messages`,
    method: "GET",
  });

  const data = await res.json();
  console.log(data);

  if (!res.ok) {
    throw new Error(data);
  }

  return data;
}

export async function getTodayProps(league: "nba" | "mlb"): Promise<Prop[]> {
  const res = await httpRequest({
    endpoint: `/props/today?league=${league}`,
    method: "GET",
  });

  const data = await res.json();
  console.log("Props", data);

  if (!res.ok) {
    throw new Error(data);
  }

  return data;
}

export async function getAllProps(league: "nba" | "mlb"): Promise<Prop[]> {
  const res = await httpRequest({
    endpoint: `/props/all?league=${league}`,
    method: "GET",
  });

  const data = await res.json();
  console.log("Props", data);

  if (!res.ok) {
    throw new Error(data);
  }

  return data;
}

export async function getActiveLeagues(): Promise<string[]> {
  const res = await httpRequest({
    endpoint: "/active-leagues",
    method: "GET",
  });

  const data = await res.json();
  console.log(data);

  if (!res.ok) {
    throw new Error(data);
  }

  return data;
}

export async function getParlays(
  matchId: string,
  userId: string
): Promise<Parlay> {
  const res = await httpRequest({
    endpoint: `/parlays/${matchId}?userId=${userId}`,
    method: "GET",
  });

  const data = await res.json();
  console.log(data);

  if (!res.ok) {
    throw new Error(data);
  }

  return data;
}

export async function postParlay(
  matchId: number,
  parlay: {
    type: string
    stake: number;
    picks: { prop: Prop; pick: string }[];
  }
) {
  const res = await httpRequest({
    endpoint: `/parlays/${matchId}`,
    method: "POST",
    body: JSON.stringify(parlay),
  });

  const data = await res.json();
  console.log(data);

  if (!data) {
    throw new Error(data);
  }
}
