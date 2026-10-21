import { createFileRoute } from "@tanstack/react-router"
import { LogOut, Moon, Sun } from "lucide-react"

import { Seo } from "@/components/Seo"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/hooks/useTheme"

import { useSession } from "@/features/auth/hooks/useSession"
import { useSignOut } from "@/features/auth/hooks/useSignOut"

export const Route = createFileRoute("/_ProtectedPages/account")({
  component: AccountPage,
})

function AccountPage() {
  const { user } = useSession()
  const signOut = useSignOut()
  const { theme, setTheme } = useTheme()

  return (
    <>
      <Seo title="Účet" />
      <section className="mx-auto w-full max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Účet</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Nastavení vašeho profilu a správa propojení s trenérem.
        </p>

        {user && (
          <div className="mt-8 space-y-6">
            <div className="rounded-lg border border-border p-4">
              <div className="text-sm font-medium text-muted-foreground">Přihlášený uživatel</div>
              <div className="mt-1 text-lg font-semibold text-foreground">{user.name}</div>
              <div className="text-sm text-muted-foreground">{user.email}</div>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                variant="outline"
                className="min-h-11 w-full justify-start gap-2"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
                Přepnout vzhled ({theme === "dark" ? "Tmavý" : "Světlý"})
              </Button>

              <Button
                variant="outline"
                className="min-h-11 w-full justify-start gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => signOut.mutate()}
                disabled={signOut.isPending}
              >
                <LogOut className="size-4" />
                Odhlásit se
              </Button>
            </div>
          </div>
        )}
      </section>
    </>
  )
}
