import { QueryClient, QueryKey } from "@tanstack/react-query";

export async function invalidateQueries(
  queryClient: QueryClient,
  ...keys: QueryKey[]
) {
  for (const key of keys) {
    await queryClient.invalidateQueries({
      queryKey: key,
    });
  }
}
