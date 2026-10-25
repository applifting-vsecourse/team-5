import { ROUTES } from "@/app/routes"
import { HeaderNavLink } from "@/components/Header/HeaderNavLink"

type HeaderNavProps = {
  isTrainer?: boolean
}

// The logo already links home, so "Home" would be a duplicate.
export function HeaderNav({ isTrainer = false }: HeaderNavProps) {
  return (
    <nav className="hidden items-center gap-1 md:flex">
      <HeaderNavLink to={ROUTES.dogs}>Psi</HeaderNavLink>
      <HeaderNavLink to={ROUTES.week}>Týden</HeaderNavLink>
      {isTrainer && <HeaderNavLink to={ROUTES.clients}>Klienti</HeaderNavLink>}
    </nav>
  )
}
