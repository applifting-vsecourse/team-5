import type { QueryClient } from "@tanstack/react-query"

import { authKeys } from "@/lib/auth-keys"

export async function clearPrivateQueries(queryClient: QueryClient) {
  // Keep the session query alive while it establishes the next identity.
  const filters = {
    predicate: (query: { queryKey: readonly unknown[] }) => query.queryKey[0] !== authKeys.all()[0],
  }
  await queryClient.cancelQueries(filters)
  queryClient.removeQueries(filters)
}
