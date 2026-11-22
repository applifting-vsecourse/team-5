import { queryOptions } from "@tanstack/react-query"

import { authKeys } from "@/lib/auth-keys"

import { authClient } from "@/features/auth/lib/auth-client"

export type LinkedAccount = {
  providerId: string
}

export function authAccountsQueryOptions() {
  return queryOptions<LinkedAccount[] | null>({
    queryKey: authKeys.accounts(),
    queryFn: async () => {
      if (typeof authClient.listAccounts !== "function") return null
      const result = await authClient.listAccounts()
      if (result?.error || !Array.isArray(result?.data)) return null
      return result.data
    },
    staleTime: 60_000,
  })
}
