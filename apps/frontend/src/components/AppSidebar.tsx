import { Link, useLocation } from "@tanstack/react-router"

import { DesignIcon } from "@/components/DesignIcon"
import { cn } from "@/lib/utils"

export function AppSidebar({ user, isTrainer }: { user: { name: string }; isTrainer: boolean }) {
  const { pathname } = useLocation()
  const isAccountActive = pathname === "/account" || pathname.startsWith("/account/")
  const items = isTrainer
    ? ([
        { to: "/dashboard", label: "Přehled", icon: "Home" },
        { to: "/clients", label: "Klienti", icon: "Users" },
        { to: "/history", label: "Historie", icon: "List" },
      ] as const)
    : ([
        { to: "/dashboard", label: "Dnes", icon: "Home" },
        { to: "/week", label: "Týden", icon: "Cal" },
        ...(!isTrainer ? [{ to: "/dogs" as const, label: "Moji psi", icon: "Paw1" }] : []),
        { to: "/history", label: "Historie", icon: "List" },
      ] as const)
  return (
    <aside className="sticky top-0 hidden h-dvh w-sidebar shrink-0 flex-col gap-1.5 bg-sidebar px-4 py-6 text-sidebar-foreground md:flex">
      <Link
        to="/dashboard"
        className="flex items-center gap-2.5 rounded-control px-2 pb-6 transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        aria-label={isTrainer ? "TrainLoop – přehled" : "TrainLoop – dnes"}
      >
        <span className="flex size-9 items-center justify-center rounded-field bg-primary">
          <DesignIcon name="sidebar-Paw" />
        </span>
        <span className="text-xl font-extrabold">TrainLoop</span>
      </Link>
      <nav
        className="space-y-1.5"
        aria-label="Hlavní navigace"
      >
        {items.map((item) => {
          const isActive = pathname === item.to || pathname.startsWith(`${item.to}/`)
          return (
            <Link
              key={item.to}
              to={item.to}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex min-h-touch items-center gap-3 rounded-control px-3 text-sm font-semibold",
                isActive
                  ? "bg-primary font-bold text-primary-foreground"
                  : "text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground",
              )}
            >
              <DesignIcon name={`sidebar-${item.icon}`} />
              {item.label}
            </Link>
          )
        })}
      </nav>
      <Link
        to="/account"
        aria-current={isAccountActive ? "page" : undefined}
        aria-label="Účet"
        className={cn(
          "mt-auto flex min-h-touch items-center gap-3 rounded-field p-2.5 transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
          isAccountActive
            ? "bg-primary text-primary-foreground"
            : "bg-sidebar-accent text-sidebar-foreground hover:bg-sidebar-accent/80",
        )}
      >
        <span
          aria-hidden
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-extrabold",
            isAccountActive
              ? "bg-primary-foreground text-primary"
              : "bg-primary text-primary-foreground",
          )}
        >
          {user.name.trim().charAt(0)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-label font-bold">{user.name}</p>
          <p
            className={cn(
              "text-xs",
              isAccountActive ? "text-primary-foreground/80" : "text-sidebar-muted",
            )}
          >
            {isTrainer ? "Trenér" : "Psovod"} · Účet
          </p>
        </div>
        <DesignIcon name="sidebar-User" />
      </Link>
    </aside>
  )
}
