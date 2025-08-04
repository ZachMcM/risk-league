import { QueryClient, QueryKey } from "@tanstack/react-query";

export function invalidateQueries(
  queryClient: QueryClient,
  ...keys: QueryKey[]
) {
  for (const key of keys) {
    queryClient.invalidateQueries({
      queryKey: key,
    });
  }
}
