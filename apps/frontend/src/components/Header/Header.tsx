import type { ReactNode } from "react"

import { HeaderLogo } from "@/components/Header/HeaderLogo"
import { HeaderNav } from "@/components/Header/HeaderNav"
import { ThemeSwitcher } from "@/components/Header/ThemeSwitcher"
import { cn } from "@/lib/utils"

type HeaderProps = {
  // Auth-aware menu (sign-in CTA / user dropdown). Passed as a slot so
  // `components/` doesn't have to import from `features/auth`.
  userMenu: ReactNode
  nav?: ReactNode
  className?: string
}

export function Header({ userMenu, nav = <HeaderNav />, className }: HeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur",
        className,
      )}
    >
      <div className="mx-auto flex h-14 w-full max-w-4xl items-center gap-4 px-4">
        <HeaderLogo />
        {nav}
        <div className="ml-auto flex items-center gap-2">
          <ThemeSwitcher />
          {userMenu}
        </div>
      </div>
    </header>
  )
}
