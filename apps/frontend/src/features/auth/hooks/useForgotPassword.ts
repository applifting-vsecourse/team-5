import { useMutation } from "@tanstack/react-query"

import { authClient } from "@/features/auth/lib/auth-client"

type ForgotPasswordInput = {
  email: string
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: async ({ email }: ForgotPasswordInput) => {
      const { data, error } = await authClient.requestPasswordReset({
        email,
      })
      if (error) {
        throw new Error(error.message ?? "Odeslání se nezdařilo.")
      }
      return data
    },
  })
}
