import { Link, useLocation } from "@tanstack/react-router"
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
import { cn } from "@/lib/utils"

import { useSession } from "@/features/auth/hooks/useSession"
import { useSignOut } from "@/features/auth/hooks/useSignOut"

export function HeaderMenu({ isNavigation = false }: { isNavigation?: boolean }) {
  const { user } = useSession()
  const signOut = useSignOut()
  const { pathname } = useLocation()
  const isAccountActive =
    isNavigation && (pathname === ROUTES.account || pathname.startsWith(`${ROUTES.account}/`))

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
          size={isNavigation ? "default" : "icon"}
          aria-label={isNavigation ? undefined : "Uživatelské menu"}
          aria-current={isAccountActive ? "page" : undefined}
          className={
            isNavigation
              ? cn(
                  "h-auto min-h-touch w-full min-w-touch flex-col items-center justify-center gap-1 rounded-md px-0 py-1 text-xs whitespace-normal transition-colors hover:bg-transparent",
                  isAccountActive
                    ? "font-extrabold text-primary hover:text-primary"
                    : "font-semibold text-muted-foreground hover:text-foreground",
                )
              : "size-11 rounded-full"
          }
        >
          {isNavigation ? (
            <>
              <span
                className={cn(
                  "flex size-8 items-center justify-center rounded-2xl",
                  isAccountActive && "bg-accent",
                )}
              >
                <UserRound
                  className="size-5"
                  aria-hidden
                />
              </span>
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
