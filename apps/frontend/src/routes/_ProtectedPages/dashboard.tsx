import { createFileRoute } from "@tanstack/react-router"

import { Seo } from "@/components/Seo"

import { useSession } from "@/features/auth/hooks/useSession"
import { TrainerOverview } from "@/features/client/components/TrainerOverview"
import { TodayView } from "@/features/week/components/TodayView"

export const Route = createFileRoute("/_ProtectedPages/dashboard")({
  component: DashboardPage,
})

export function DashboardPage() {
  const { user } = useSession()
  const isTrainer = user?.role === "trainer" || user?.role === "admin"

  if (isTrainer) {
    return (
      <>
        <Seo title="Přehled" />
        <TrainerOverview userName={user?.name} />
      </>
    )
  }

  return (
    <>
      <Seo title="Dnes" />
      <TodayView userName={user?.name} />
    </>
  )
}
