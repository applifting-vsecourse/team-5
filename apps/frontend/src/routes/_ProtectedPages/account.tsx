import { createFileRoute } from "@tanstack/react-router"
import { ChevronDown, LogOut, Monitor, Moon, Sun } from "lucide-react"
import { toast } from "sonner"

import { Seo } from "@/components/Seo"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { useTheme } from "@/hooks/useTheme"

import { useSession } from "@/features/auth/hooks/useSession"
import { useSignOut } from "@/features/auth/hooks/useSignOut"

export const Route = createFileRoute("/_ProtectedPages/account")({
  component: AccountPage,
})

export function AccountPage() {
  const { user } = useSession()
  const signOut = useSignOut()
  const { theme, setTheme, resolvedTheme } = useTheme()

  const currentThemeLabel = theme === "system" ? "Systémový" : theme === "dark" ? "Tmavý" : "Světlý"

  const ThemeIcon = resolvedTheme === "dark" ? Moon : Sun

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
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Přihlášený uživatel</p>
              <p className="text-lg font-semibold text-foreground">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>

            <Separator />

            <div className="flex flex-col gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="min-h-11 w-full justify-between gap-2"
                  >
                    <span className="flex items-center gap-2">
                      <ThemeIcon className="size-4" />
                      <span>Vzhled: {currentThemeLabel}</span>
                    </span>
                    <ChevronDown className="size-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="w-56"
                >
                  <DropdownMenuItem onClick={() => setTheme("light")}>
                    <Sun className="size-4" /> Světlý
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("dark")}>
                    <Moon className="size-4" /> Tmavý
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("system")}>
                    <Monitor className="size-4" /> Systémový
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {signOut.isError ? (
                <Alert variant="destructive">
                  <AlertDescription>
                    Odhlášení se nezdařilo. Zkuste to prosím znovu.
                  </AlertDescription>
                </Alert>
              ) : null}
              <Button
                variant="outline"
                className="min-h-11 w-full justify-start gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() =>
                  signOut.mutate(undefined, {
                    onError: () => {
                      toast.error("Odhlášení se nezdařilo. Zkontrolujte připojení k síti.")
                    },
                  })
                }
                disabled={signOut.isPending}
              >
                <LogOut className="size-4" />
                {signOut.isPending ? "Odhlašuji…" : "Odhlásit se"}
              </Button>
            </div>
          </div>
        )}
      </section>
    </>
  )
}
