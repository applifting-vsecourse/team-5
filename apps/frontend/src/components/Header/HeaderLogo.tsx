import { Link } from "@tanstack/react-router"

import { ROUTES } from "@/app/routes"

type HeaderLogoProps = {
  to?: string
}

export function HeaderLogo({ to = ROUTES.dashboard }: HeaderLogoProps) {
  return (
    <Link
      to={to}
      // A 44 px tall touch target on a phone (#89).
      className="inline-flex min-h-11 items-center font-semibold tracking-tight"
    >
      TrainLoop
    </Link>
  )
}
