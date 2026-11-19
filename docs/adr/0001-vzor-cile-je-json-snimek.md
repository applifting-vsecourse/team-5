# ADR 0001: Vzor cíle je JSON snímek s verzí

## Stav

Navrženo, 2026-11-16. Z přípravy refinementu [#94 Vzory cílů podle disciplíny](https://github.com/applifting-vsecourse/team-5/issues/94) a navazující story Správa vzorů. Po potvrzení na refinementu se přepne na _Přijato_.

## Kontext

Trenér chce osvědčený cíl uložit jako vzor a převzít ho u jiného psa se stejnou disciplínou (#94). Ve správě vzorů chce vzor na desktopu i upravovat, včetně tréninků a kroků.

Cíl je dnes strom tří tabulek: `TrainingGoal` → `GoalTraining` → `PlanBlock` (krok). Na ně jsou navázané `ScheduledTraining`, `WorkoutLog`, `currentStepId` a zámek `lockEditableGoal` (`hierarchy.repository.ts`). Vzor potřebuje jen obsah stromu, žádnou z těchto vazeb:

- Kopíruje se název, princip, kritérium a aktivní tréninky s kroky (název, délka, instrukce, kritérium).
- Nekopíruje se termín, výsledky kroků (`outcome`) ani archivované tréninky.
- Vzor patří trenérovi a nesmí viset na psovi klienta. Trenérovi zůstává i po ukončení spolupráce.
- Vzor se nikdy nehledá podle jednotlivých kroků, jen se celý přečte, zobrazí, upraví a zkopíruje.

## Rozhodnutí

Vzor je jeden řádek `GoalTemplate`. Obsah stromu je ve sloupci `content Json`:

```prisma
model GoalTemplate {
  id           String     @id @default(cuid())
  trainerId    String
  trainer      User       @relation(fields: [trainerId], references: [id], onDelete: Cascade)
  disciplineId String
  discipline   Discipline @relation(fields: [disciplineId], references: [id], onDelete: Restrict)
  title        String     @db.VarChar(100)
  content      Json
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @default(now()) @updatedAt

  @@index([trainerId, disciplineId])
  @@map("goal_template")
}
```

```jsonc
// content, version 1
{
  "version": 1,
  "principle": "…",
  "criterion": "…",
  "trainings": [
    {
      "title": "…",
      "steps": [
        {
          "title": "…",
          "durationMinutes": 5,
          "instruction": "…",
          "criterion": "…",
        },
      ],
    },
  ],
}
```

Pravidla:

- **Obsah hlídá zod schéma v kódu**, ne databáze. Validuje se při zápisu i čtení.
- **`version` určuje tvar obsahu.** Starší verze převádí funkce v kódu při čtení. Žádná migrace dat nepřepisuje JSON.
- **Vzor neobsahuje žádná ID z cíle.** Převzetí vytvoří nové řádky `TrainingGoal`, `GoalTraining` a `PlanBlock` v jedné transakci a aktuální krok nastaví na první krok.
- **Úprava vzoru ukládá vždy celý obsah**, žádné částečné úpravy jednotlivých kroků. Při souběžných úpravách vyhraje poslední uložení. Vzor upravuje jen jeho trenér, takže to stačí.
- Jedinečnost názvu v rámci trenéra a disciplíny hlídá služba, ne unikátní index, protože názvy se porovnávají bez ohledu na velikost písmen.

## Zvažované možnosti

1. **JSON snímek v jednom řádku (zvoleno).** Jedna tabulka a jedna migrace. Vzor se nemůže změnit „pod rukama“, když se mění cíle, a kopírování je jedno čtení. Cenou je, že tvar obsahu hlídá jen kód.
2. **Tři tabulky jako u cíle: `GoalTemplate` → `TemplateTraining` → `TemplateStep` (zamítnuto).** Strukturu by hlídala databáze a editor by mohl ukládat po jednotlivých krocích. Znamenalo by to ale trojnásobek tabulek, repository kódu a řazení (`position`) pro data, která se jen čtou a kopírují. Přechod z možnosti 1 na tuto je mechanická migrace, opačný směr je dražší.
3. **Příznak `isTemplate` na `TrainingGoal` (zamítnuto).** Žádná nová tabulka, ale vzor by visel na konkrétním psovi klienta. Míchal by se do cílů psa, statistik, `dog-access.service` i zámků editace a po ukončení spolupráce by trenér ke vzoru ztratil přístup.

## Důsledky

Pro celou aplikaci, ne jen pro vzory:

- **Každá změna polí, která se kopírují** (`TrainingGoal.principle`, `criterion`, `GoalTraining.title`, pole `PlanBlock`), musí upravit zod schéma vzoru, převzetí a editor vzoru. Pokud změna mění tvar obsahu, zvýší se `version` a přibude převod ze starší verze. Když se na to zapomene, nic nespadne, nové pole se jen do vzorů tiše nepřenese.
- **Nové pole cíle se do vzoru nepřenáší automaticky.** Musí se rozhodnout, jestli patří do vzoru (obsah plánu), nebo k psovi (termín, výsledky, rozvrh).
- **Editor vzoru nemůže volat API cíle.** Komponenty editoru cíle musí umět pracovat s lokálním stavem a celý výsledek uložit jedním požadavkem. API cíle (`hierarchy`, `plan-blocks`) se kvůli vzorům nemění.
- **Dotazy dovnitř obsahu nejsou podporované.** Funkce typu „který krok ze vzorů se nejčastěji používá“ nebo vyhledávání v krocích vzorů znamená nejdřív přejít na možnost 2, ne psát raw SQL nad JSON.
- **Disciplíny se z katalogu nesmí mazat, dokud na ně odkazuje vzor** (`onDelete: Restrict`). Dnes se nemažou nikdy.
- **Smazání trenéra smaže jeho vzory** (`onDelete: Cascade`). Cíle, které ze vzorů vznikly, zůstávají, protože na vzor neodkazují.
