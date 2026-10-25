import { useMutation, useQueryClient } from "@tanstack/react-query"

import { authSessionQueryOptions } from "@/features/auth/api/authSessionQueryOptions"
import { authClient } from "@/features/auth/lib/auth-client"
import { clearPrivateQueries } from "@/features/auth/lib/clear-private-queries"

type ResetPasswordInput = {
  token: string
  newPassword: string
}

export function useResetPassword() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ token, newPassword }: ResetPasswordInput) => {
      const { data, error } = await authClient.resetPassword({
        token,
        newPassword,
      })
      if (error) {
        throw new Error(error.message ?? "Změna hesla se nezdařila.")
      }
      const options = authSessionQueryOptions()
      await queryClient.cancelQueries({ queryKey: options.queryKey })
      await clearPrivateQueries(queryClient)
      const session = await queryClient.fetchQuery({ ...options, staleTime: 0 })
      return { data, session }
    },
  })
}
