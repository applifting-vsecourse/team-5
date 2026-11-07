import { Link, useLocation } from "@tanstack/react-router"

import { DesignIcon } from "@/components/DesignIcon"
import { cn } from "@/lib/utils"

export function AppSidebar({ user, isTrainer }: { user: { name: string }; isTrainer: boolean }) {
  const { pathname } = useLocation()
  const items = [
    { to: "/dashboard", label: isTrainer ? "Přehled" : "Dnes", icon: "Home" },
    ...(isTrainer ? [{ to: "/clients" as const, label: "Klienti", icon: "Users" }] : []),
    { to: "/week", label: isTrainer ? "Kalendář" : "Týden", icon: "Cal" },
    { to: "/dogs", label: "Moji psi", icon: "Paw1" },
    { to: "/account", label: "Účet", icon: "User" },
  ] as const
  return (
    <aside className="sticky top-0 hidden h-dvh w-sidebar shrink-0 flex-col gap-1.5 bg-sidebar px-4 py-6 text-sidebar-foreground md:flex">
      <div className="flex items-center gap-2.5 px-2 pb-6">
        <span className="flex size-9 items-center justify-center rounded-field bg-primary">
          <DesignIcon name="sidebar-Paw" />
        </span>
        <span className="text-xl font-extrabold">TrainLoop</span>
      </div>
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
      <div className="mt-10 flex items-center gap-2.5 rounded-field bg-sidebar-accent p-2.5">
        <span
          aria-hidden
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-extrabold text-primary-foreground"
        >
          {user.name.trim().charAt(0)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-label font-bold">{user.name}</p>
          <p className="text-xs text-sidebar-muted">{isTrainer ? "Trenér" : "Psovod"}</p>
        </div>
      </div>
    </aside>
  )
}
