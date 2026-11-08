import { useState } from "react"
import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router"
import { toast } from "sonner"
import { z } from "zod"

import { ROUTES } from "@/app/routes"
import { AuthLayout } from "@/components/AuthLayout"
import { Seo } from "@/components/Seo"
import { Button } from "@/components/ui/button"

import { authSessionQueryOptions } from "@/features/auth/api/authSessionQueryOptions"
import { verifyResetPasswordToken } from "@/features/auth/api/verifyResetPasswordToken"
import { ResetPasswordForm } from "@/features/auth/components/ResetPasswordForm"
import { useResetPassword } from "@/features/auth/hooks/useResetPassword"
import { loginHome } from "@/features/auth/lib/account-home"

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
  validateSearch: z.object({ token: z.string().optional() }),
  loaderDeps: ({ search }) => ({ token: search.token }),
  loader: async ({ context, deps }) => {
    const session = await context.queryClient.ensureQueryData(authSessionQueryOptions())
    if (session) {
      throw redirect({ href: loginHome(session.user) })
    }
    const token = deps.token?.trim() ?? ""
    const isValid = token ? await verifyResetPasswordToken(token) : false
    return { token, isValid }
  },
})

function ResetPasswordPage() {
  const { token, isValid } = Route.useLoaderData()
  const navigate = useNavigate()
  const resetPassword = useResetPassword()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (values: { password: string }) => {
    setErrorMessage(null)
    try {
      const { session } = await resetPassword.mutateAsync({
        token,
        newPassword: values.password,
      })
      toast.success("Heslo bylo úspěšně změněno. Byli jste přihlášeni.")
      await navigate({ href: session ? loginHome(session.user) : ROUTES.home, replace: true })
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Změna hesla se nepodařila. Zkontrolujte prosím připojení.",
      )
    }
  }

  if (!isValid) {
    return (
      <>
        <Seo title="Obnova hesla" />
        <AuthLayout
          title="Odkaz už neplatí"
          icon="auth-235-1063-IconKey"
          description="Odkaz pro nastavení hesla vypršel, byl už použit nebo není správný."
          footer={
            <Link
              to={ROUTES.login}
              className="font-medium text-foreground underline underline-offset-4"
            >
              Zpět na přihlášení
            </Link>
          }
        >
          <div className="space-y-4">
            <Button
              asChild
              className="w-full"
            >
              <Link to={ROUTES.forgotPassword}>Poslat nový odkaz</Link>
            </Button>
          </div>
        </AuthLayout>
      </>
    )
  }

  return (
    <>
      <Seo title="Nové heslo" />
      <AuthLayout
        title="Nové heslo"
        icon="auth-235-1019-IconKey"
        description="Zvol si nové heslo. Po uložení tě přihlásíme do TrainLoop."
        footer={
          <Link
            to={ROUTES.login}
            className="font-medium text-foreground underline underline-offset-4"
          >
            Zpět na přihlášení
          </Link>
        }
      >
        <ResetPasswordForm
          isLoading={resetPassword.isPending}
          errorMessage={errorMessage}
          onSubmit={handleSubmit}
        />
      </AuthLayout>
    </>
  )
}
