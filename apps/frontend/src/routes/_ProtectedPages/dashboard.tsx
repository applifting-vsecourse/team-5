import { createFileRoute } from "@tanstack/react-router"

import { Seo } from "@/components/Seo"

export const Route = createFileRoute("/_ProtectedPages/dashboard")({
  component: DashboardPage,
})

function DashboardPage() {
  return (
    <div className="container mx-auto px-4 py-8 text-center">
      <Seo title="Dashboard" />
      <h1 className="text-2xl font-bold tracking-tight">TrainLoop</h1>
      <p className="mt-2 text-sm text-muted-foreground">Vítejte v aplikaci TrainLoop.</p>
    </div>
  )
}
