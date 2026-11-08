import { Link } from "@tanstack/react-router"

import { ROUTES } from "@/app/routes"
import { DesignIcon } from "@/components/DesignIcon"
import { InviteCodeDialog } from "@/components/InviteCodeDialog"
import { Seo } from "@/components/Seo"
import { Button } from "@/components/ui/button"

export function LandingPage() {
  return (
    <main className="public-flow min-h-svh bg-background">
      <Seo title="TrainLoop" />
      <div className="mx-auto w-full md:grid md:min-h-svh md:max-w-6xl md:grid-cols-2 md:items-center md:gap-12 md:px-8 md:py-12">
        <section className="rounded-b-sheet bg-primary px-6 pt-3 pb-8 text-primary-foreground md:rounded-sheet md:pt-6">
          <Link
            to={ROUTES.home}
            className="inline-flex min-h-touch items-center gap-2.5 text-brand font-extrabold"
          >
            <span className="flex size-10 items-center justify-center rounded-brand bg-card">
              <DesignIcon name="landing-Paw" />
            </span>
            TrainLoop
          </Link>
          <h1 className="mt-5 text-title leading-tight font-extrabold tracking-tight">
            Trénink psa, který nekončí na lekci.
          </h1>
          <p className="mt-5 text-public-body leading-normal font-medium">
            Zadání od trenéra máš v telefonu u konkrétního psa. Po tréninku zapíšeš, jak to šlo, a
            trenér ti odpoví přímo u něj.
          </p>
          <div
            className="relative mt-5 h-64"
            aria-label="Ukázka aplikace: Rex, úspěšnost 82 %, týdenní plán 3 z 5 a zpráva od trenéra"
          >
            <div className="absolute top-5 left-0 w-40 rotate-6 space-y-2 rounded-card bg-dog-2 p-3.5 text-dog-foreground">
              <div className="flex items-center justify-between">
                <span className="flex size-8 items-center justify-center rounded-full bg-card text-sm font-extrabold text-dog-2">
                  R
                </span>
                <span className="text-sm font-extrabold">82 %</span>
              </div>
              <p className="text-lg font-extrabold">Rex</p>
              <div
                className="flex h-7 items-end gap-1"
                aria-hidden="true"
              >
                {[3, 4, 3.5, 5, 4.5, 6, 7].map((height, index) => (
                  <span
                    key={index}
                    className="w-2 rounded bg-dog-foreground"
                    style={{ height: `${height * 4}px`, opacity: index === 6 ? 1 : 0.45 }}
                  />
                ))}
              </div>
            </div>
            <div className="absolute top-0 right-0 flex w-44 -rotate-5 items-center gap-2.5 rounded-card bg-card p-3 text-foreground">
              <span className="relative flex size-12 shrink-0 items-center justify-center text-xs font-extrabold">
                <img
                  src="/assets/design/landing-Ring.svg"
                  alt=""
                  className="absolute inset-0"
                />
                <img
                  src="/assets/design/landing-RingProgress.svg"
                  alt=""
                  className="absolute top-0 right-0"
                />
                3/5
              </span>
              <div>
                <p className="text-xs text-muted-foreground">Týdenní plán</p>
                <p className="text-sm font-extrabold">hotové 3 z 5</p>
              </div>
            </div>
            <div className="absolute right-3 bottom-6 w-56 rotate-2 space-y-1 rounded-card bg-accent p-3 text-foreground">
              <p className="text-xs font-bold text-primary">Marek · trenér</p>
              <p className="text-sm font-semibold">Skvělá práce s přivoláním! 👏</p>
            </div>
          </div>
        </section>
        <section className="flex flex-col gap-6 px-5 pt-7 pb-10 md:px-0">
          <ol
            className="space-y-3"
            aria-label="Jak TrainLoop funguje"
          >
            {[
              "Trenér nastaví cíle a tréninky psa",
              "Trénuješ venku podle kroků",
              "Zapíšeš výsledek, trenér odpoví",
            ].map((text, index) => (
              <li
                key={text}
                className="flex items-center gap-3"
              >
                <span
                  className={`flex size-9 shrink-0 items-center justify-center rounded-field font-extrabold text-dog-foreground ${["bg-dog-2", "bg-primary", "bg-dog-3"][index]}`}
                >
                  {index + 1}
                </span>
                <span className="text-sm font-bold">{text}</span>
              </li>
            ))}
          </ol>
          <div className="flex flex-col gap-2.5">
            <Button
              asChild
              size="lg"
            >
              <Link to={ROUTES.signup}>
                <DesignIcon name="landing-ArrowR" />
                Začít zdarma
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
            >
              <Link to={ROUTES.login}>Přihlásit se</Link>
            </Button>
            <InviteCodeDialog
              trigger={
                <Button
                  variant="ghost"
                  className="text-primary"
                >
                  <DesignIcon name="landing-Ticket" />
                  Mám pozvánku od trenéra
                </Button>
              }
            />
          </div>
        </section>
      </div>
    </main>
  )
}
