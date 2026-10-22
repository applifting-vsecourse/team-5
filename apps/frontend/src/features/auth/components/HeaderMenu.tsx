import { Link } from "@tanstack/react-router"
import { UserRound } from "lucide-react"

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

export function HeaderMenu() {
  const { user } = useSession()

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
          aria-label="Uživatelské menu"
          className="rounded-full"
        >
          <Avatar className="size-8">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-48"
      >
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="text-sm leading-none font-medium">{user.name}</span>
            <span className="mt-1 text-xs text-muted-foreground">
              {user.username ? `@${user.username}` : user.email}
            </span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to={ROUTES.account}>
            <UserRound
              aria-hidden="true"
              className="size-4"
            />
            Účet
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
