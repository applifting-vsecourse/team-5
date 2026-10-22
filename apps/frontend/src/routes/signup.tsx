import { useState } from "react"
import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router"
import { z } from "zod"

import { ROUTES } from "@/app/routes"
import { AuthLayout } from "@/components/AuthLayout"
import { Seo } from "@/components/Seo"

import { authSessionQueryOptions } from "@/features/auth/api/authSessionQueryOptions"
import { SignUpForm } from "@/features/auth/components/SignUpForm"
import { useSignUp, type SignUpInput } from "@/features/auth/hooks/useSignUp"
import { RegistrationError, registrationError } from "@/features/auth/lib/registration-errors"

export const Route = createFileRoute("/signup")({
  component: SignUpPage,
  validateSearch: z.object({ code: z.string().optional() }),
  loader: async ({ context }) => {
    const session = await context.queryClient.ensureQueryData(authSessionQueryOptions())
    if (!session) return
    throw redirect({ to: ROUTES.dogs })
  },
})

function SignUpPage() {
  const navigate = useNavigate()
  const signUp = useSignUp()
  const [error, setError] = useState<RegistrationError | null>(null)

  const handleSubmit = async (values: SignUpInput) => {
    setError(null)
    try {
      await signUp.mutateAsync(values)
      await navigate({ to: ROUTES.dogs })
    } catch (error) {
      setError(error instanceof RegistrationError ? error : registrationError())
    }
  }

  return (
    <>
      <Seo title="Registrace" />
      <AuthLayout
        title="Registrace psovoda"
        description="Založte si účet zdarma. Pozvánku od trenéra nepotřebujete."
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
