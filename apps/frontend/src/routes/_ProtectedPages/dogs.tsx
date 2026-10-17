import { createFileRoute } from "@tanstack/react-router"

import { Seo } from "@/components/Seo"

export const Route = createFileRoute("/_ProtectedPages/dogs")({
  component: DogsPage,
})

function DogsPage() {
  return (
    <section className="mx-auto w-full max-w-2xl px-4 py-8">
      <Seo title="Psi" />
      <h1 className="text-2xl font-semibold tracking-tight">Psi</h1>
      <p className="mt-4 text-muted-foreground">Přidejte prvního psa</p>
    </section>
  )
}
