import { deleteItemAsync, getItemAsync, setItemAsync } from "expo-secure-store";
import { Session } from "./types/session";

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

export async function sessionRequest(): Promise<Session> {
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

  if (!res?.ok) {
    throw new Error(data.message);
  }

  return {
    user: data,
  };
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
