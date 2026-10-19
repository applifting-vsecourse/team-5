import { createFileRoute } from "@tanstack/react-router"

import { Seo } from "@/components/Seo"

export const Route = createFileRoute("/_ProtectedPages/dogs")({
  component: DogsPage,
})

function DogsPage() {
  return (
    <>
      <Seo title="Psi" />
      <section className="mx-auto w-full max-w-2xl px-4 py-6 md:py-8">
        <header className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Psi</h1>
            <p className="text-sm text-muted-foreground">
              Správa psů a jejich tréninkových profilů
            </p>
          </div>
        </header>
      </section>
    </>
  )
}
