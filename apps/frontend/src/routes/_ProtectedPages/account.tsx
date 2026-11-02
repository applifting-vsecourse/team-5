import { useState } from "react"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { ChevronDown, LogOut, Monitor, Moon, Sparkles, Sun } from "lucide-react"
import { toast } from "sonner"

import { ROUTES } from "@/app/routes"
import { Seo } from "@/components/Seo"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useTheme } from "@/hooks/useTheme"

import { DeleteAccountDialog } from "@/features/auth/components/DeleteAccountDialog"
import { useSession } from "@/features/auth/hooks/useSession"
import { useSignOut } from "@/features/auth/hooks/useSignOut"

export const Route = createFileRoute("/_ProtectedPages/account")({
  component: AccountPage,
})

export function AccountPage() {
  const { user } = useSession()
  const signOut = useSignOut()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const navigate = useNavigate()

  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [inviteCode, setInviteCode] = useState("")

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedCode = inviteCode.trim().toUpperCase()
    if (!trimmedCode) return
    setIsInviteDialogOpen(false)
    setInviteCode("")
    void navigate({
      to: ROUTES.invite,
      search: { code: trimmedCode },
    })
  }

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

            {user.role !== "trainer" && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div>
                    <h2 className="text-base font-semibold text-foreground">
                      Propojení s trenérem
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Dostali jste od trenéra 6místný kód pozvánky? Zadejte jej a propojte svůj
                      účet.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="min-h-11 w-full justify-start gap-2"
                    onClick={() => setIsInviteDialogOpen(true)}
                  >
                    <Sparkles className="size-4 text-primary" />
                    Mám kód od trenéra
                  </Button>
                </div>
              </>
            )}

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
              <DeleteAccountDialog isTrainer={user.role === "trainer"} />
              <Link
                to={ROUTES.privacy}
                className="inline-flex min-h-12 items-center text-sm underline underline-offset-4"
              >
                Zásady zpracování osobních údajů
              </Link>
            </div>
          </div>
        )}

        {user && user.role !== "trainer" && (
          <Dialog
            open={isInviteDialogOpen}
            onOpenChange={(isOpenNext) => {
              setIsInviteDialogOpen(isOpenNext)
              if (!isOpenNext) setInviteCode("")
            }}
          >
            <DialogContent className="sm:max-w-md">
              <form
                onSubmit={handleInviteSubmit}
                className="space-y-4"
              >
                <DialogHeader>
                  <DialogTitle>Mám kód od trenéra</DialogTitle>
                  <DialogDescription>
                    Zadejte šestimístný kód pozvánky, který jste obdrželi od svého trenéra na lekci
                    nebo v e-mailu.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-2">
                  <Label htmlFor="account-invite-code">Kód pozvánky</Label>
                  <Input
                    id="account-invite-code"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    placeholder="např. K7M2PQ"
                    maxLength={6}
                    required
                  />
                </div>

                <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setIsInviteDialogOpen(false)
                      setInviteCode("")
                    }}
                  >
                    Zrušit
                  </Button>
                  <Button
                    type="submit"
                    disabled={!inviteCode.trim()}
                  >
                    Pokračovat
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </section>
    </>
  )
}
