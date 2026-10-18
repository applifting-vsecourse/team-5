import { useMutation, useQueryClient } from "@tanstack/react-query"

import { authSessionQueryOptions } from "@/features/auth/api/authSessionQueryOptions"
import { authClient } from "@/features/auth/lib/auth-client"
import { registrationError } from "@/features/auth/lib/registration-errors"

export type SignUpInput = {
  name: string
  email: string
  password: string
  privacyConsent: boolean
  isTrainer: boolean
}

export function useSignUp() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: SignUpInput) => {
      // BetterAuth handles the whole flow (and signs the user in by default)
      const { error } = await authClient.signUp.email({
        name: input.name,
        email: input.email,
        password: input.password,
        // Request-only value, validated by the BetterAuth registration hook.
        fetchOptions: {
          body: { privacyConsent: input.privacyConsent, isTrainer: input.isTrainer },
        },
      })
      if (error) throw registrationError(error.code)
    },
    onSuccess: async () => {
      const options = authSessionQueryOptions()
      await queryClient.invalidateQueries({ queryKey: options.queryKey })
      // Refresh even an inactive anonymous query before protected route loaders run.
      await queryClient.fetchQuery({ ...options, staleTime: 0 })
    },
  })
}
