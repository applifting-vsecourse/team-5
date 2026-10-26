import { Link } from "@tanstack/react-router"

import { ROUTES } from "@/app/routes"

export function HeaderLogo() {
  return (
    <Link
      to={ROUTES.home}
      // A 44 px tall touch target on a phone (#89).
      className="inline-flex min-h-11 items-center font-semibold tracking-tight"
    >
      TrainLoop
    </Link>
  )
}
