import { createFileRoute } from "@tanstack/react-router"

import { Seo } from "@/components/Seo"

export const Route = createFileRoute("/_ProtectedPages/week")({ component: WeekPage })

function WeekPage() {
  return (
    <section className="mx-auto w-full max-w-2xl px-4 py-8">
      <Seo title="Týden" />
      <h1 className="text-2xl font-semibold tracking-tight">Týden</h1>
      <p className="mt-4 text-muted-foreground">Zde uvidíte naplánované tréninky svých psů.</p>
    </section>
  )
}
