import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import * as SecureStore from "expo-secure-store";
import {
  inferAdditionalFields,
  usernameClient,
} from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  plugins: [
    usernameClient(),
    expoClient({
      scheme: "riskleague",
      storagePrefix: "riskleague",
      storage: SecureStore,
    }),
    inferAdditionalFields({
      user: {
        points: {
          type: "number",
          input: false,
          required: false,
        },
        header: {
          type: "string",
          input: false,
          required: false,
        },
      },
    }),
  ],
});
