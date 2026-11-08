import { useEffect, useState } from "react"
import { createFileRoute, Link } from "@tanstack/react-router"

import { ROUTES } from "@/app/routes"
import { AuthLayout } from "@/components/AuthLayout"
import { DesignIcon } from "@/components/DesignIcon"
import { Seo } from "@/components/Seo"
import { Button } from "@/components/ui/button"

import { ForgotPasswordForm } from "@/features/auth/components/ForgotPasswordForm"
import { useForgotPassword } from "@/features/auth/hooks/useForgotPassword"

export const Route = createFileRoute("/forgot-password")({ component: ForgotPasswordPage })
function ForgotPasswordPage() {
  const forgotPassword = useForgotPassword()
  const [submittedEmail, setSubmittedEmail] = useState("")
  const [seconds, setSeconds] = useState(0)
  useEffect(() => {
    if (!seconds) return
    const timer = window.setTimeout(() => setSeconds(seconds - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [seconds])
  async function submit({ email }: { email: string }) {
    try {
      await forgotPassword.mutateAsync({ email })
    } finally {
      setSubmittedEmail(email)
      setSeconds(45)
    }
  }
  return (
    <>
      <Seo title="Zapomenuté heslo" />
      <AuthLayout
        title="Zapomenuté heslo"
        description="Pošleme ti odkaz pro nastavení nového hesla. Tvoje data i záznamy psů zůstanou, jak jsou."
        icon="auth-142-1449-IconKey"
        footer={
          <Link
            to={ROUTES.login}
            className="inline-flex min-h-touch items-center font-bold text-primary"
          >
            Zpět na přihlášení
          </Link>
        }
      >
        <ForgotPasswordForm
          isLoading={forgotPassword.isPending || seconds > 0}
          onSubmit={async (values) => {
            await submit(values).catch(() => undefined)
          }}
        />
        {submittedEmail && (
          <div
            role="status"
            className="flex items-start gap-3 rounded-card bg-success p-4 text-success-foreground"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-success-foreground">
              <DesignIcon name="auth-142-1449-IconCheck" />
            </span>
            <div className="min-w-0 space-y-1">
              <h2 className="font-extrabold">Odkaz je na cestě</h2>
              <p className="text-sm">Pokud účet existuje, poslali jsme e-mail.</p>
              <p className="text-sm">Zkontroluj i spam.</p>
              <Button
                variant="ghost"
                className="h-auto px-0 text-success-foreground"
                disabled={seconds > 0 || forgotPassword.isPending}
                onClick={() => {
                  void submit({ email: submittedEmail }).catch(() => undefined)
                }}
              >
                {seconds > 0
                  ? `Poslat znovu za 0:${String(seconds).padStart(2, "0")}`
                  : "Poslat znovu"}
              </Button>
            </div>
          </div>
        )}
      </AuthLayout>
    </>
  )
}
