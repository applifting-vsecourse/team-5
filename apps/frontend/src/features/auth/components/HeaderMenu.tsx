import { Link } from "@tanstack/react-router"
import { LogOut, UserRound } from "lucide-react"
import { toast } from "sonner"

import { ROUTES } from "@/app/routes"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { useSession } from "@/features/auth/hooks/useSession"
import { useSignOut } from "@/features/auth/hooks/useSignOut"

export function HeaderMenu({ isNavigation = false }: { isNavigation?: boolean }) {
  const { user } = useSession()
  const signOut = useSignOut()

  if (!user) {
    return (
      <Button
        asChild
        size="sm"
        variant="outline"
      >
        <Link to={ROUTES.login}>Přihlásit se</Link>
      </Button>
    )
  }

  const initials = user.name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={isNavigation ? "Účet a odhlášení" : "Uživatelské menu"}
          className={
            isNavigation
              ? "min-h-11 w-full flex-col gap-1 py-1 text-xs text-muted-foreground"
              : "size-11 rounded-full"
          }
        >
          {isNavigation ? (
            <>
              <UserRound className="size-5" />
              <span>Účet</span>
            </>
          ) : (
            <Avatar className="size-8">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        side={isNavigation ? "top" : "bottom"}
        className="w-64"
      >
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="text-sm leading-none font-medium">{user.name}</span>
            <span className="mt-1 text-xs text-muted-foreground">
              {user.username ? `@${user.username}` : user.email}
            </span>
            <span className="mt-2 text-sm text-muted-foreground">
              {user.role === "trainer"
                ? "Trenér"
                : user.role === "admin"
                  ? "Administrátor"
                  : "Psovod"}
            </span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          asChild
          className="min-h-11"
        >
          <Link to={ROUTES.account}>
            <UserRound
              aria-hidden="true"
              className="size-4"
            />
            Účet
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="min-h-11"
          disabled={signOut.isPending}
          onSelect={(event) => {
            event.preventDefault()
            signOut.mutate(undefined, {
              onError: () => toast.error("Odhlášení se nezdařilo. Zkuste to prosím znovu."),
            })
          }}
        >
          <LogOut
            aria-hidden="true"
            className="size-4"
          />
          {signOut.isPending ? "Odhlašuji…" : "Odhlásit se"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
