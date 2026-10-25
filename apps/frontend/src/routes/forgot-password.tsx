import { useState } from "react"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { CheckCircle2, X } from "lucide-react"

import { LandingPage } from "@/app/LandingPage"
import { ROUTES } from "@/app/routes"
import { Seo } from "@/components/Seo"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { ForgotPasswordForm } from "@/features/auth/components/ForgotPasswordForm"
import { useForgotPassword } from "@/features/auth/hooks/useForgotPassword"

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
})

function ForgotPasswordPage() {
  const navigate = useNavigate()
  const forgotPassword = useForgotPassword()
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (values: { email: string }) => {
    setErrorMessage(null)
    try {
      await forgotPassword.mutateAsync(values)
      setIsSubmitted(true)
    } catch {
      // Per acceptance criteria:
      // "Po odeslání se vždy ukáže stejná hláška „Pokud účet existuje, poslali jsme e-mail“."
      setIsSubmitted(true)
    }
  }

  return (
    <>
      <LandingPage />
      <Seo title="Zapomenuté heslo" />
      <Dialog
        open
        onOpenChange={(isOpen) => {
          if (!isOpen && !forgotPassword.isPending) {
            void navigate({ to: ROUTES.home, replace: true })
          }
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="tracking-tight">Zapomenuté heslo</DialogTitle>
            <DialogDescription>
              {isSubmitted
                ? "Informace k obnovení hesla byly odeslány."
                : "Zadejte svůj e-mail a my vám pošleme odkaz pro obnovu hesla."}
            </DialogDescription>
          </DialogHeader>
          <DialogClose asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2"
              aria-label="Zavřít zapomenuté heslo"
              disabled={forgotPassword.isPending}
            >
              <X
                aria-hidden="true"
                className="size-4"
              />
            </Button>
          </DialogClose>

          {isSubmitted ? (
            <div className="space-y-4">
              <Alert>
                <CheckCircle2 className="size-4 text-primary" />
                <AlertTitle>Zkontrolujte e-mail</AlertTitle>
                <AlertDescription>Pokud účet existuje, poslali jsme e-mail.</AlertDescription>
              </Alert>
              <Button
                asChild
                className="w-full"
                variant="outline"
              >
                <Link to={ROUTES.login}>Zpět na přihlášení</Link>
              </Button>
            </div>
          ) : (
            <>
              <ForgotPasswordForm
                isLoading={forgotPassword.isPending}
                errorMessage={errorMessage}
                onSubmit={handleSubmit}
              />
              <p className="text-sm text-muted-foreground">
                Vzpomněli jste si na heslo?{" "}
                <Link
                  to={ROUTES.login}
                  className="font-medium text-foreground underline underline-offset-4"
                >
                  Přihlásit se
                </Link>
              </p>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
