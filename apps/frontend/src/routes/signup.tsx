import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router"
import { z } from "zod"

import { ROUTES } from "@/app/routes"
import { AuthLayout } from "@/components/AuthLayout"
import { Seo } from "@/components/Seo"

import { authSessionQueryOptions } from "@/features/auth/api/authSessionQueryOptions"
import { SignUpForm } from "@/features/auth/components/SignUpForm"
import { useSignUp, type SignUpInput } from "@/features/auth/hooks/useSignUp"
import { accountHome } from "@/features/auth/lib/account-home"
import { RegistrationError, registrationError } from "@/features/auth/lib/registration-errors"

export const Route = createFileRoute("/signup")({
  component: SignUpPage,
  validateSearch: z.object({ code: z.string().optional() }),
  loader: async ({ context }) => {
    const session = await context.queryClient.ensureQueryData(authSessionQueryOptions())
    if (!session) return
    throw redirect({ to: accountHome(session.user) })
  },
})

function SignUpPage() {
  const navigate = useNavigate()
  const signUp = useSignUp()
  const queryClient = useQueryClient()
  const [error, setError] = useState<RegistrationError | null>(null)

  const handleSubmit = async (values: SignUpInput) => {
    setError(null)
    try {
      await signUp.mutateAsync(values)
      const session = await queryClient.ensureQueryData(authSessionQueryOptions())
      if (!session) throw registrationError()
      await navigate({ to: accountHome(session.user) })
    } catch (error) {
      setError(error instanceof RegistrationError ? error : registrationError())
    }
  }

  return (
    <>
      <Seo title="Registrace" />
      <AuthLayout
        title="Registrace"
        description="Založte si účet psovoda nebo trenéra zdarma. Pozvánku nepotřebujete."
        footer={
          <>
            Už máte účet?{" "}
            <Link
              to={ROUTES.login}
              className="font-medium text-foreground underline underline-offset-4"
            >
              Přihlásit se
            </Link>
          </>
        }
      >
        <SignUpForm
          isLoading={signUp.isPending}
          error={error}
          onSubmit={handleSubmit}
        />
      </AuthLayout>
    </>
  )
}
