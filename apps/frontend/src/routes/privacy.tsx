import { createFileRoute, Link } from "@tanstack/react-router"

import { ROUTES } from "@/app/routes"
import { DesignIcon } from "@/components/DesignIcon"
import { Seo } from "@/components/Seo"
import { Button } from "@/components/ui/button"

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
})

function PrivacyPage() {
  return (
    <>
      <Seo title="Zásady zpracování osobních údajů" />
      <main className="mx-auto w-full max-w-2xl space-y-6 px-5 py-6 text-sm leading-relaxed text-muted-foreground">
        <Button
          asChild
          variant="outline"
          size="icon"
        >
          <Link
            to={ROUTES.home}
            aria-label="Zpět do aplikace"
          >
            <DesignIcon name="auth-235-1107-IconChevL" />
          </Link>
        </Button>
        <div className="space-y-3">
          <h1 className="text-page font-extrabold tracking-tight text-foreground">
            Zásady zpracování osobních údajů
          </h1>
          <p className="text-sm text-muted-foreground">
            Pracovní návrh pro školní projekt TrainLoop · 22. října 2026
          </p>
          <p>
            Tento text čeká na schválení. Před spuštěním služby pro veřejnost musí provozovatel
            doplnit svou identitu a kontakt, právní základy zpracování, dodavatele a pravidla
            uchovávání údajů včetně záloh.
          </p>
        </div>
        <section className="space-y-3">
          <h2 className="text-lg font-extrabold tracking-tight text-foreground">
            Jaké údaje aplikace používá
          </h2>
          <p>
            Pro vedení účtu používáme jméno, e-mail, roli psovoda nebo trenéra a zabezpečený otisk
            hesla. Přihlášení zajišťují relační cookies a údaje o relaci, které mohou zahrnovat IP
            adresu a informace o prohlížeči.
          </p>
          <p>
            Při používání deníku ukládáme údaje o psech, cíle, plány, tréninky, výsledky, poznámky a
            odkazy na videa. Funkce spolupráce používají také propojení s trenérem a zprávy u
            tréninkových záznamů.
          </p>
        </section>
        <section className="space-y-3">
          <h2 className="text-lg font-extrabold tracking-tight text-foreground">
            K čemu údaje slouží
          </h2>
          <p>
            Údaje slouží k přihlášení, vedení tréninkového deníku a spolupráci psovoda s trenérem.
            Při sdílení psa jsou jeho tréninkové údaje dostupné připojenému trenérovi. Soukromé
            poznámky v deníku jsou určeny psovodovi.
          </p>
          <p>
            Odkazy na videa vedou na externí služby, které mají vlastní zásady zpracování údajů. Do
            poznámek a zpráv nevkládejte údaje jiných lidí, které k tréninku nepotřebujete.
          </p>
        </section>
        <section className="space-y-3">
          <h2 className="text-lg font-extrabold tracking-tight text-foreground">
            Souhlas a smazání účtu
          </h2>
          <p>
            Registrace vyžaduje výslovné zaškrtnutí souhlasu se zpracováním osobních údajů. Účet
            můžete kdykoli smazat v záložce Účet volbou Smazat účet a potvrzením heslem. Smazání je
            nevratné a ukončí přihlášení na všech zařízeních.
          </p>
          <p>
            Smazáním účtu psovoda se odstraní jeho psi, cíle, plány, tréninky, záznamy, poznámky a
            zprávy v jejich vláknech. Smazáním účtu trenéra se ukončí propojení se všemi klienty a
            zruší sdílení i pozvánky. Data klientů zůstanou zachována; u zpráv a zadání smazaného
            trenéra se místo jeho jména zobrazí „smazaný uživatel“.
          </p>
        </section>
      </main>
    </>
  )
}
