import { useState } from "react"
import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router"
import { X } from "lucide-react"
import { z } from "zod"

import { LandingPage } from "@/app/LandingPage"
import { ROUTES } from "@/app/routes"
import { Seo } from "@/components/Seo"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { authSessionQueryOptions } from "@/features/auth/api/authSessionQueryOptions"
import { SignInForm } from "@/features/auth/components/SignInForm"
import { useSignIn } from "@/features/auth/hooks/useSignIn"
import { loginHome } from "@/features/auth/lib/account-home"
import { decodeRedirectUri } from "@/features/auth/lib/redirect"
import { SIGN_IN_FAILED_MESSAGE, SignInError } from "@/features/auth/lib/sign-in-error"

export const Route = createFileRoute("/login")({
  component: LoginPage,
  validateSearch: z.object({ from: z.string().optional() }),
  loaderDeps: ({ search }) => ({ from: search.from }),
  loader: async ({ context, deps }) => {
    const session = await context.queryClient.ensureQueryData(authSessionQueryOptions())
    if (!session) return
    throw redirect({ href: decodeRedirectUri(deps.from) ?? loginHome(session.user) })
  },
})

function LoginPage() {
  const { from } = Route.useSearch()
  const navigate = useNavigate()
  const signIn = useSignIn()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (values: { email: string; password: string }) => {
    setErrorMessage(null)
    try {
      const session = await signIn.mutateAsync(values)
      await navigate({ href: decodeRedirectUri(from) ?? loginHome(session.user), replace: true })
    } catch (error) {
      setErrorMessage(error instanceof SignInError ? error.message : SIGN_IN_FAILED_MESSAGE)
    }
  }

  return (
    <>
      <LandingPage />
      <Seo title="Přihlášení" />
      <Dialog
        open
        onOpenChange={(isOpen) => {
          if (!isOpen && !signIn.isPending) void navigate({ to: ROUTES.home, replace: true })
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="tracking-tight">Přihlášení</DialogTitle>
            <DialogDescription>Přihlaste se e-mailem a heslem ke svému účtu.</DialogDescription>
          </DialogHeader>
          <DialogClose asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2"
              aria-label="Zavřít přihlášení"
              disabled={signIn.isPending}
            >
              <X
                aria-hidden="true"
                className="size-4"
              />
            </Button>
          </DialogClose>
          <SignInForm
            isLoading={signIn.isPending}
            errorMessage={errorMessage}
            onSubmit={handleSubmit}
          />
          <p className="text-sm text-muted-foreground">
            Ještě nemáte účet?{" "}
            <Link
              to={ROUTES.signup}
              className="font-medium text-foreground underline underline-offset-4"
            >
              Registrace
            </Link>
          </p>
        </DialogContent>
      </Dialog>
    </>
  )
}
