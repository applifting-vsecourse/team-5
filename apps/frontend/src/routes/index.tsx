import { createFileRoute, Link } from "@tanstack/react-router"

import { ROUTES } from "@/app/routes"
import { Header } from "@/components/Header/Header"
import { Seo } from "@/components/Seo"
import { Button } from "@/components/ui/button"

import { HeaderMenu } from "@/features/auth/components/HeaderMenu"
import { useSession } from "@/features/auth/hooks/useSession"

export const Route = createFileRoute("/")({
  component: LandingPage,
})

function LandingPage() {
  const { user } = useSession()

  return (
    <>
      <Seo title="TrainLoop" />
      <Header userMenu={<HeaderMenu />} />
      <main className="min-h-svh">
        <section className="mx-auto w-full max-w-2xl px-4 pt-16 pb-12 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-5xl">TrainLoop</h1>
          <p className="mx-auto mt-4 max-w-md text-lg text-pretty text-muted-foreground">
            Platforma pro trenéry a psovody.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {user ? (
              <div className="flex flex-col items-center gap-3">
                <p className="text-sm text-muted-foreground">
                  Přihlášen jako <span className="font-medium text-foreground">{user.name}</span>
                </p>
                <Button
                  asChild
                  size="lg"
                >
                  <Link to={ROUTES.dashboard}>Přejít do aplikace</Link>
                </Button>
              </div>
            ) : (
              <>
                <Button
                  asChild
                  size="lg"
                >
                  <Link to={ROUTES.signup}>Vytvořit účet</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                >
                  <Link to={ROUTES.login}>Přihlásit se</Link>
                </Button>
              </>
            )}
          </div>
        </section>
      </main>
    </>
  )
}
