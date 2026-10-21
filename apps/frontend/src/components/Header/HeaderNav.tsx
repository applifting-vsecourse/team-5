import { ROUTES } from "@/app/routes"
import { HeaderNavLink } from "@/components/Header/HeaderNavLink"

// The logo already links home, so "Home" would be a duplicate.
export function HeaderNav() {
  return (
    <nav className="flex items-center gap-1">
      <HeaderNavLink to={ROUTES.dogs}>Psi</HeaderNavLink>
      <HeaderNavLink to={ROUTES.week}>Týden</HeaderNavLink>
      <HeaderNavLink to={ROUTES.clients}>Klienti</HeaderNavLink>
    </nav>
  )
}
