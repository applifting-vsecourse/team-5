import { createFileRoute, Link } from "@tanstack/react-router"
import { Calendar, PawPrint } from "lucide-react"

import { ROUTES } from "@/app/routes"
import { Seo } from "@/components/Seo"
import { Button } from "@/components/ui/button"

import { useSession } from "@/features/auth/hooks/useSession"
import { TodayView } from "@/features/week/components/TodayView"

export const Route = createFileRoute("/_ProtectedPages/dashboard")({
  component: DashboardPage,
})

export function DashboardPage() {
  const { user } = useSession()
  const isTrainer = user?.role === "trainer" || user?.role === "admin"

  if (isTrainer) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-6 md:py-8">
        <Seo title="Přehled" />
        <h1 className="text-page font-extrabold tracking-tight text-foreground">Přehled</h1>
        <p className="mt-2 text-sm font-medium text-muted-foreground">
          Kalendář a vlastní psi zůstávají dostupné z přehledu.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button
            asChild
            size="lg"
            className="w-full sm:flex-1"
          >
            <Link to={ROUTES.week}>
              <Calendar className="size-4" />
              Kalendář
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="w-full sm:flex-1"
          >
            <Link to={ROUTES.dogs}>
              <PawPrint className="size-4" />
              Moji psi
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      <Seo title="Dnes" />
      <TodayView userName={user?.name} />
    </>
  )
}
