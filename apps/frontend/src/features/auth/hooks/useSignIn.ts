import { useMutation, useQueryClient } from "@tanstack/react-query"

import { authSessionQueryOptions } from "@/features/auth/api/authSessionQueryOptions"
import { authClient } from "@/features/auth/lib/auth-client"
import { signInError } from "@/features/auth/lib/sign-in-error"

type SignInInput = {
  email: string
  password: string
}

export function useSignIn() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ email, password }: SignInInput) => {
      const { error } = await authClient.signIn.email({ email, password, rememberMe: true })
      if (error) throw signInError(error.code)
      const options = authSessionQueryOptions()
      await queryClient.invalidateQueries({ queryKey: options.queryKey })
      // Replace the cached anonymous session before protected route guards run.
      const session = await queryClient.fetchQuery({ ...options, staleTime: 0 })
      if (!session) throw signInError()
      return session
    },
  })
}
