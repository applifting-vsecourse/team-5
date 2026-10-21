import { useMutation, useQueryClient } from "@tanstack/react-query"

import { authSessionQueryOptions } from "@/features/auth/api/authSessionQueryOptions"
import { authClient } from "@/features/auth/lib/auth-client"
import { clearPrivateQueries } from "@/features/auth/lib/clear-private-queries"
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
      // A request started before login must not restore the previous session.
      await queryClient.cancelQueries({ queryKey: options.queryKey })
      await clearPrivateQueries(queryClient)
      const session = await queryClient.fetchQuery({ ...options, staleTime: 0 })
      if (!session) throw signInError()
      return session
    },
  })
}
