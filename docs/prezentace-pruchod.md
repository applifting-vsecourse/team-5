# Scénář Sprint Review 3 (9 minut) – TrainLoop

Scénář a tahák pro živou prezentaci 16. 11. 2026. Ukazuje jen to, co je od 26. 10. 2026 nasazené na stagingu (`main`, commit `8cb7d82`). Funkce ze sprintu 2 (pozvánka kódem, fotka psa, registrace) znovu neprocházíme.

Podklady: [UX report](ux-report.md), [Security report](security-report.md), [rozbor vizuálu Týdne](vystupy/figma-redesign-kontrola.md).

---

## Časový plán

| Čas       | Blok                                          | Kdo                               |
| --------- | --------------------------------------------- | --------------------------------- |
| 0:00–0:30 | Úvod a reakce na feedback ze sprintu 2        | 1 člověk                          |
| 0:30–2:30 | UX audit: pain points a jejich náprava        | 1 člověk                          |
| 2:30–3:15 | Brand a design systém                         | stejný                            |
| 3:15–6:45 | Živé demo na mobilu: psovod a trenér          | 2 lidi (jeden kliká, druhý mluví) |
| 6:45–8:15 | Security audit a testy, ukázka spadlého testu | 1 člověk                          |
| 8:15–9:00 | Co zbývá a kde najdete reporty                | 1 člověk                          |

---

## 1. Úvod (0:00–0:30)

> „Na konci sprintu 2 jsme slyšeli, že funkčně je to super, ale appka je nepřehledná. Tenhle sprint jsme proto nepřidávali hromadu funkcí. Prošli jsme celou aplikaci očima psovoda na cvičáku s mobilem v ruce a psem na vodítku. Nejdřív jsme navrhli, jak má vypadat Týden, Trénink, Detail psa a Cíl, a teprve potom to postavili.“

## 2. UX audit: pain points a náprava (0:30–2:30)

Ukazovat **před a po** vedle sebe (screenshoty staré verze vs. staging).

| Co bylo špatně                                                                                           | Co jsme udělali                                                                                                                                                                |
| -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Nebylo poznat hlavní akci.** Karty v kartách, všechny akce stejně důležité.                            | Každá obrazovka má jednu hlavní akci. Na **Dnes** tmavá karta nahoře s tlačítkem **„Začít trénink“**.                                                                          |
| **Nebylo vidět, kde pes v plánu je.**                                                                    | Cíl ukazuje **aktuální krok**. Posun řídí člověk: **zvládnuto / zpět / přeskočit**, nic se neposune samo ani podle procent. Trénink z kalendáře začne u aktuálního kroku.      |
| **Záznamy a komentáře v malých vyskakovacích oknech.** Na mobilu se v nich nedalo psát ani poslat odkaz. | Záznam tréninku má vlastní stránku a adresu. **„Odpovědět“** otevře záznam rovnou u pole pro zprávu.                                                                           |
| **Odpověď trenéra se dala přehlédnout.**                                                                 | **Zvonek s oznámeními** a karta **„Zpráva od trenéra“** na Dnes. Poznámka psovoda je první zprávou konverzace, chat jde začít z komentáře. Zprávy a historie jsou jedno místo. |
| **Trénink venku byl neovladatelný.** Malá tlačítka, hodně textu, stopky v jiné appce.                    | Průchod tréninkem na celou obrazovku, časovač přímo v něm, tlačítka 44–56 px, kritérium jako věc k odškrtnutí.                                                                 |
| **Všechno bylo napořád.**                                                                                | Cíl **dokončit / archivovat** (budoucí tréninky z kalendáře zmizí, historie zůstane). Pes do **archivu** a zpět. **Ukončení disciplíny**.                                      |
| **Navigace na mobilu se hledala.**                                                                       | Spodní lišta podle role: psovod Dnes · Týden · Psi · Účet, trenér Přehled · Klienti · Cíle · Účet. Potvrzovací dialogy jako panely zespodu.                                    |
| **Trenér plánoval naslepo.**                                                                             | Plánování krok za krokem: klient → pes → cíl → trénink. U cíle je vidět, kolik tréninků je odcvičeno a kolik naplánováno.                                                      |

> Pointa: **„Dřív aplikace uměla všechno, ale člověk musel vědět kde. Teď mu každá obrazovka sama řekne, co má udělat dál.“**

## 3. Brand a design systém (2:30–3:15)

Ukazovat přímo v běžící appce (Dnes, Týden, detail psa), Figmu neotevírat.

- **Identita „deník psa“:** patkovým písmem je to, co je _napsané_ (jméno psa, cíl, zápis), bezpatkovým ovládání. Žádné ilustrace navíc, charakter dělá typografie.
- **Každý pes má svou barvu (1–6),** všude stejnou: proužek v kalendáři, avatar, hlavička profilu.
- **Slovník:** deník, zápis, zadání, odcvičeno. Žádné IT slovo „aktivita“.
- **Pod kapotou:** jednotné barvy a zaoblení jako tokeny, kontrast podle WCAG, sdílený UI kit, jednotné stavy načítání, prázdna a chyby. Nová landing page, přihlášení, registrace s výběrem role, e-maily.

## 4. Živé demo (3:15–6:45)

Staging `https://team-5.vsepractical.applifting.dev`, mobilní zobrazení 390 px (F12). Dvě okna: psovod (normální) a trenér (anonymní).

| #   | Čas  | Role            | Co udělat                                                                                                                                                                                              | Co říct                                                                                                                    |
| --- | ---- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| 1   | 20 s | Psovod          | **Dnes**: ukázat hlavní kartu a tlačítko.                                                                                                                                                              | „Otevřu appku a vidím jednu věc: dnešní trénink a velké tlačítko.“                                                         |
| 2   | 15 s | Psovod          | **Týden**: barevné proužky psů, zmeškaný trénink, přesun nebo přeskočení.                                                                                                                              | „Každý pes má svou barvu, trénink přesunu nebo přeskočím jedním klepnutím.“                                                |
| 3   | 45 s | Psovod          | **Začít trénink** → začne u aktuálního kroku → spustit časovač → odškrtnout kritérium → **Dokončit** → úspěšnost a poznámka → uložit.                                                                  | „Trénink začíná tam, kde pes v plánu je. Stopky, zadání i kritérium mám před sebou, tlačítka jsou velká na jednu ruku.“    |
| 4   | 40 s | Psovod          | **Detail psa → cíl**: aktuální krok, pak _zvládnuto_, _zpět_, _přeskočit_. Pak **Dokončit cíl** a ukázat, že je pryč z aktivních, ale v historii zůstal.                                               | „Nic se neposune samo, rozhoduje člověk podle chování psa. Hotový cíl zmizí z přehledu, ale historie zůstane.“             |
| 5   | 30 s | Psovod          | **Detail psa**: poznámka z lekce (datum, název, text), ukončení disciplíny, archiv psa a vrácení.                                                                                                      | „Co slyším na lekci, mám u psa a vidím to jen já. Psa ani disciplínu nemažu, archivuju.“                                   |
| 6   | 60 s | Trenér → psovod | **Trenér:** Přehled → Klienti (barevná úspěšnost) → klient → záznam, který psovod právě zapsal → odpovědět. **Psovod:** Dnes → karta „Zpráva od trenéra“ a zvonek → klepnout → záznam → **Odpovědět**. | „Trenér nemusí psát na WhatsApp. Zpětná vazba je přímo u konkrétního tréninku a psovod ji uvidí hned na úvodní obrazovce.“ |

Tip: projet demo předem 2× se stopkami a zkontrolovat, že Jan Novák má na stagingu cíl rozjetý uprostřed a dnešní trénink.

## 5. Security audit a testy (6:45–8:15)

- **Audit závislostí:** na začátku **56 high a 10 critical**, teď **0 high a 0 critical** (ověřeno znovu 9. 11.). Zbývají 4× moderate a 1× low (glob, minimatch, deepmerge). Nejsou zneužitelné vstupem od uživatele, čekají na upstream.
- **Brotli:** Node zamčený na **24.22.2** s opravou CVE-2026-111497, v `.nvmrc` i Dockerfilech. Brotli je přímo v Node, takže samotný npm audit by opravu neověřil.
- **Sledování:** Dependabot týdně (npm, Actions, Docker), `pnpm security:audit` v CI při každé změně i každé pondělí. Dependabot už sám navrhl nginx 1.31.7 a Node 26. Node 26 jsme vrátili a major verze Node vyloučili, protože takový přechod chce řízený upgrade.
- **Kontroly v aplikaci:** cizí pes vrací 404 (neprozradí ani existenci), validace vstupů, limity uploadu fotky, rate limit na pozvánkové kódy.
- **Testy:** posun, návrat a přeskočení kroku, založení cíle s cviky, naplánování, průchod tréninkem, zápis, přesun a přeskočení v kalendáři. V `deploy.yml` má nasazení podmínku `needs: [security-audit, tests]`, takže **spadlý test nebo high zranitelnost zastaví nasazení na staging**.
- **Ukázka pádu testu (30 s):** viz [tahák níže](#ukázka-spadlého-testu).

## 6. Co zbývá a závěr (8:15–9:00)

- **Týden** ještě vizuálně dolaďujeme (tlačítko „Dnes“, nadpis, progress bar).
- **Vlastní psi trenéra** jsou zatím skrytí, dokud nenavrhneme přepínání rolí (#211).
- **Tmavý režim** je po domluvě s PO odložený.
- **Security:** 4 moderate čekají na upstream, chybí skenování Docker obrazů na úrovni OS a globální rate limit a bezpečnostní hlavičky.

> „UX report a security report jsou v repozitáři a pošleme je do kanálu hned po review. Děkujeme, máte dotazy?“

---

# Tahák

## Účty (staging, základní seed)

```text
Trenér:  trener@trainloop.cz / password1   (Marek)
Psovod:  jan.novak@seznam.cz / password1   (Jan Novák, psi Rex a Baryk)
```

## Text do poznámky po tréninku

```text
Rex reagoval na povely výborně. U odložení udržel klid napoprvé, v zatáčkách už nepředbíhá.
```

## Odpověď trenéra

```text
Super! Příště zkuste odložení se vzdálením na 5 kroků.
```

## Ukázka spadlého testu

Test logiky posunu kroku v cíli (`apps/backend/src/modules/dog/domain/current-step.spec.ts`, 10 testů).

1. Zelený běh (~20 s):

   ```bash
   pnpm backend test -- current-step
   ```

   ```text
   Test Suites: 1 passed, 1 total
   Tests:       10 passed, 10 total
   ```

2. Rozbít jedno očekávání, například v testu „marks the current step mastered or skipped and moves to the next“ změnit `currentStepId: 'c'` u `advance` na `'a'`, a spustit znovu. Jest ukáže název testu, rozdíl _Expected / Received_, přesný řádek a skončí s nenulovým kódem.

3. Co říct:

   > „V CI by tenhle pád zastavil merge pull requestu i nasazení na staging, protože deploy čeká na úspěšné testy a security audit.“

4. Vrátit změnu:

   ```bash
   git checkout apps/backend/src/modules/dog/domain/current-step.spec.ts
   ```

**Zastavený deploy v GitHub Actions** (připravený běh, stačí otevřít): <https://github.com/applifting-vsecourse/team-5/actions/runs/42634611572>

- Workflow _Build & Deploy_ spuštěný ručně na větvi `demo/failing-deploy` (kód z `main` + jeden schválně rozbitý test, nikam nemergováno).
- Ukázat: `tests` ❌ (1 failed, 358 passed), `security-audit` ✅, **`build-and-deploy` přeskočeno**, na staging se nic nenasadilo.
- Kliknout na `tests` → krok _Run pnpm backend test_ → `● moveCurrentStep › marks the current step mastered or skipped and moves to the next` s rozdílem _Expected / Received_.

---

# Zprávy do týmových kanálů

## UX/UI audit

```markdown
Ahoj, posíláme výstup UX/UI auditu TrainLoop ze sprintu 3.

Hlavní pain points a náprava:

- Na každé obrazovce jedna hlavní akce (Dnes: „Začít trénink“).
- Cíl ukazuje aktuální krok, posun řídí člověk (zvládnuto / zpět / přeskočit), trénink začíná u aktuálního kroku.
- Záznam tréninku má vlastní stránku, zprávy trenér ↔ psovod přímo u záznamu, zvonek a „Zpráva od trenéra“ na Dnes.
- Průchod tréninkem pro mobil v terénu: časovač, velká tlačítka, kritérium k odškrtnutí.
- Archiv psa, dokončení a archiv cíle, ukončení disciplíny; historie zůstává.
- Nový design systém „deník psa“: barvy psů, typografie, sdílený UI kit, spodní navigace podle role.

Celý report: docs/ux-report.md
```

## Security audit

```markdown
Ahoj, posíláme výsledky security auditu TrainLoop.

- Závislosti: z 56 high a 10 critical na 0 high a 0 critical. Zbývají 4× moderate a 1× low bez možnosti zneužití vstupem uživatele, čekají na upstream.
- Node 24.22.2 s opravou Brotli (CVE-2026-111497), aktualizované Docker obrazy a GitHub Actions.
- Sledování: Dependabot týdně, `pnpm security:audit` v CI při každé změně i každé pondělí. High/critical nález nebo spadlý test zastaví nasazení na staging.
- Zbývá: skenování Docker obrazů na úrovni OS, globální rate limit a bezpečnostní hlavičky.

Celý report: docs/security-report.md
```
