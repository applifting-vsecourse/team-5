import type { ReactNode } from "react"
import { Link, useLocation } from "@tanstack/react-router"
import { Calendar, Home, ListChecks, PawPrint, User, Users } from "lucide-react"

import { ROUTES } from "@/app/routes"
import { DesignIcon } from "@/components/DesignIcon"
import { cn } from "@/lib/utils"

type NavItem = {
  label: string
  to: string
  icon: typeof Home
  matchPrefix: string
}

/** Handler: Dnes · Týden · Psi · Historie · Zprávy · Účet */
const HANDLER_ITEMS: NavItem[] = [
  { label: "Dnes", to: ROUTES.dashboard, icon: Home, matchPrefix: ROUTES.dashboard },
  { label: "Týden", to: ROUTES.week, icon: Calendar, matchPrefix: ROUTES.week },
  { label: "Psi", to: ROUTES.dogs, icon: PawPrint, matchPrefix: ROUTES.dogs },
  { label: "Historie", to: ROUTES.history, icon: ListChecks, matchPrefix: ROUTES.history },
  { label: "Zprávy", to: ROUTES.inbox, icon: Home, matchPrefix: ROUTES.inbox },
  { label: "Účet", to: ROUTES.account, icon: User, matchPrefix: ROUTES.account },
]

/**
 * Trainer: Přehled · Klienti · Cíle · Historie · Zprávy · Účet
 * Cíle uses /dogs until the goals screen ticket adds its own route.
 */
const TRAINER_ITEMS: NavItem[] = [
  { label: "Přehled", to: ROUTES.dashboard, icon: Home, matchPrefix: ROUTES.dashboard },
  { label: "Klienti", to: ROUTES.clients, icon: Users, matchPrefix: ROUTES.clients },
  { label: "Cíle", to: ROUTES.dogs, icon: ListChecks, matchPrefix: ROUTES.dogs },
  { label: "Historie", to: ROUTES.history, icon: ListChecks, matchPrefix: ROUTES.history },
  { label: "Zprávy", to: ROUTES.inbox, icon: Home, matchPrefix: ROUTES.inbox },
  { label: "Účet", to: ROUTES.account, icon: User, matchPrefix: ROUTES.account },
]

type BottomNavProps = {
  isTrainer?: boolean
  accountMenu?: ReactNode
}

export function BottomNav({ isTrainer = false }: BottomNavProps) {
  const location = useLocation()
  const currentPath = location.pathname

  // The walkthrough (#76) has its own fixed bottom navigation buttons;
  // hide the tab bar so it does not cover them on phones.
  if (currentPath.startsWith("/trainings")) {
    return null
  }

  const items = isTrainer ? TRAINER_ITEMS : HANDLER_ITEMS

  return (
    <nav
      aria-label="Spodní navigace"
      className="fixed right-0 bottom-0 left-0 z-40 border-t border-border bg-background pb-safe-bottom md:hidden"
    >
      <div className="mx-auto flex min-h-tab-bar max-w-md items-stretch justify-around px-2 pt-2">
        {items.map((item) => {
          const isActive =
            currentPath === item.matchPrefix || currentPath.startsWith(`${item.matchPrefix}/`)

          return (
            <Link
              key={item.label}
              to={item.to}
              className={cn(
                "flex min-h-touch min-w-touch flex-1 flex-col items-center justify-center gap-1 rounded-md py-1 text-xs transition-colors",
                isActive
                  ? "font-extrabold text-primary"
                  : "font-semibold text-muted-foreground hover:text-foreground",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <span
                className={cn(
                  "flex h-8 w-11 items-center justify-center rounded-full transition-colors",
                  isActive && "bg-accent",
                )}
              >
                {isTrainer ? (
                  <DesignIcon
                    name={
                      item.to === ROUTES.dashboard
                        ? "trainer-Home"
                        : item.to === ROUTES.clients
                          ? "trainer-Users"
                          : item.to === ROUTES.dogs
                            ? "trainer-List"
                            : item.to === ROUTES.history
                              ? "trainer-List"
                              : item.to === ROUTES.inbox
                                ? "trainer-Msg"
                                : "trainer-User"
                    }
                  />
                ) : (
                  <DesignIcon
                    name={
                      item.to === ROUTES.dashboard
                        ? isActive
                          ? "today-Home"
                          : "dogs-Home"
                        : item.to === ROUTES.dogs
                          ? isActive
                            ? "dogs-Paw"
                            : "today-Paw"
                          : item.to === ROUTES.week
                            ? "today-Calendar"
                            : item.to === ROUTES.history
                              ? "trainer-List"
                              : item.to === ROUTES.inbox
                                ? "trainer-Msg"
                                : "today-User"
                    }
                  />
                )}
              </span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
