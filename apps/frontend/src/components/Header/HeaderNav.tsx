import { ROUTES } from "@/app/routes"
import { HeaderNavLink } from "@/components/Header/HeaderNavLink"

type HeaderNavProps = {
  isTrainer?: boolean
}

// md+ header mirrors role destinations from DESIGN.md / Figma tab bars.
export function HeaderNav({ isTrainer = false }: HeaderNavProps) {
  return (
    <nav className="hidden items-center gap-1 md:flex">
      <HeaderNavLink to={ROUTES.dashboard}>{isTrainer ? "Přehled" : "Dnes"}</HeaderNavLink>
      {!isTrainer && <HeaderNavLink to={ROUTES.week}>Týden</HeaderNavLink>}
      <HeaderNavLink to={ROUTES.dogs}>{isTrainer ? "Cíle" : "Psi"}</HeaderNavLink>
      {isTrainer && <HeaderNavLink to={ROUTES.clients}>Klienti</HeaderNavLink>}
    </nav>
  )
}
