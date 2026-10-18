import { Link } from "@tanstack/react-router"
import { Dog, Users } from "lucide-react"

import { ROUTES } from "@/app/routes"

import { useSession } from "@/features/auth/hooks/useSession"

const linkClassName =
  "flex min-h-16 flex-1 flex-col items-center justify-center gap-1 rounded-md px-4 py-2 text-sm text-muted-foreground hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring data-[status=active]:bg-accent data-[status=active]:text-foreground"

export function BottomNav() {
  const { user } = useSession()
  if (!user) return null

  return (
    <nav
      aria-label="Hlavní navigace"
      className="fixed inset-x-0 bottom-0 border-t border-border bg-background"
    >
      <div className="mx-auto flex max-w-4xl">
        <Link
          to={ROUTES.dogs}
          className={linkClassName}
        >
          <Dog
            aria-hidden="true"
            className="size-6"
          />
          Psi
        </Link>
        {user.role === "trainer" ? (
          <Link
            to={ROUTES.clients}
            className={linkClassName}
          >
            <Users
              aria-hidden="true"
              className="size-6"
            />
            Klienti
          </Link>
        ) : null}
      </div>
    </nav>
  )
}
