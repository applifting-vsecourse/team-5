import { createFileRoute } from "@tanstack/react-router"

import { Seo } from "@/components/Seo"

export const Route = createFileRoute("/_ProtectedPages/week")({
  component: WeekPage,
})

function WeekPage() {
  return (
    <>
      <Seo title="Týden" />
      <section className="mx-auto w-full max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Týden</h1>
        <p className="mt-2 text-sm text-muted-foreground">Tréninkový kalendář pro tento týden.</p>
      </section>
    </>
  )
}
