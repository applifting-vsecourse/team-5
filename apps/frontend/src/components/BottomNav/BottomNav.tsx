import type { ReactNode } from "react"
import { useQuery } from "@tanstack/react-query"
import { Link, useLocation } from "@tanstack/react-router"
import { Calendar, PawPrint, User, Users } from "lucide-react"

import { unreadRepliesQueryOptions } from "@/lib/trainingReplies"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  {
    label: "Psi",
    to: "/dogs",
    icon: PawPrint,
    matchPrefix: "/dogs",
  },
  {
    label: "Týden",
    to: "/week",
    icon: Calendar,
    matchPrefix: "/week",
  },
  {
    label: "Klienti",
    to: "/clients",
    icon: Users,
    matchPrefix: "/clients",
  },
  {
    label: "Účet",
    to: "/account",
    icon: User,
    matchPrefix: "/account",
  },
] as const

type BottomNavProps = {
  isTrainer?: boolean
  accountMenu?: ReactNode
}

export function BottomNav({ isTrainer = false, accountMenu }: BottomNavProps) {
  const location = useLocation()
  const currentPath = location.pathname
  const replies = useQuery(unreadRepliesQueryOptions())

  // The walkthrough (#76) has its own fixed bottom navigation buttons;
  // hide the tab bar so it does not cover them on phones.
  if (currentPath.startsWith("/trainings")) {
    return null
  }

  const items = NAV_ITEMS.filter((item) => item.to !== "/clients" || isTrainer)

  return (
    <nav
      aria-label="Spodní navigace"
      className="fixed right-0 bottom-0 left-0 z-40 border-t border-border bg-background/95 backdrop-blur-xs md:hidden"
    >
      <div className="mx-auto flex h-16 max-w-md items-center justify-around px-2">
        {items.map((item) => {
          if (item.to === "/account" && accountMenu) {
            return (
              <div
                key="account"
                className="flex flex-1 justify-center"
              >
                {accountMenu}
              </div>
            )
          }
          const Icon = item.icon
          const isActive = currentPath.startsWith(item.matchPrefix)

          return (
            <Link
              key={item.label}
              to={item.to}
              className={cn(
                "flex min-h-11 min-w-11 flex-1 flex-col items-center justify-center gap-1 rounded-md py-1 text-xs transition-colors",
                isActive
                  ? "font-medium text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
              aria-current={isActive ? "page" : undefined}
              aria-label={
                item.to === "/week" && replies.data?.length
                  ? "Týden, nepřečtené odpovědi"
                  : undefined
              }
            >
              <span className="relative">
                <Icon className="size-5" />
                {item.to === "/week" && Boolean(replies.data?.length) && (
                  <span
                    className="absolute -top-1 -right-1 size-2 rounded-full bg-foreground"
                    aria-hidden="true"
                  />
                )}
              </span>
              <span>{item.label}</span>
              {item.to === "/week" && Boolean(replies.data?.length) && (
                <span className="sr-only"> Nepřečtené odpovědi</span>
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
