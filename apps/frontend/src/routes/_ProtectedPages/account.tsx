import { createFileRoute } from "@tanstack/react-router"

import { Seo } from "@/components/Seo"

export const Route = createFileRoute("/_ProtectedPages/account")({
  component: AccountPage,
})

function AccountPage() {
  return (
    <>
      <Seo title="Účet" />
      <section className="mx-auto w-full max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Účet</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Nastavení vašeho profilu a správa propojení s trenérem.
        </p>
      </section>
    </>
  )
}
