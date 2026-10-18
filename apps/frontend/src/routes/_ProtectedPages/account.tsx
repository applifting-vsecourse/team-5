import { createFileRoute } from "@tanstack/react-router"

import { Seo } from "@/components/Seo"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

import { useSignOut } from "@/features/auth/hooks/useSignOut"

export const Route = createFileRoute("/_ProtectedPages/account")({ component: AccountPage })

function AccountPage() {
  const { user } = Route.useRouteContext()
  const signOut = useSignOut()
  return (
    <section className="mx-auto w-full max-w-2xl space-y-6 px-4 py-8">
      <Seo title="Účet" />
      <h1 className="text-2xl font-semibold tracking-tight">Účet</h1>
      <dl className="space-y-4">
        <div>
          <dt className="text-sm text-muted-foreground">Jméno</dt>
          <dd>{user.name}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">E-mail</dt>
          <dd>{user.email}</dd>
        </div>
      </dl>
      {signOut.isError ? (
        <Alert variant="destructive">
          <AlertDescription>Odhlášení se nezdařilo. Zkuste to prosím znovu.</AlertDescription>
        </Alert>
      ) : null}
      <Button
        onClick={() => signOut.mutate()}
        disabled={signOut.isPending}
      >
        {signOut.isPending ? "Odhlašuji…" : "Odhlásit se"}
      </Button>
    </section>
  )
}
