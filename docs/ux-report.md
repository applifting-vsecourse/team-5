# Zpráva o změnách UX a UI

**Datum**: 09. 11. 2026 (aktualizováno, první verze 08. 11. 2026)  
**Rozsah**: Všechny změny uživatelské zkušenosti (UX), uživatelského rozhraní (UI) a interakčního designu začleněné od 26. 10. 2026 a nasazené na staging (větev `main`, commity `ada5199` → `8cb7d82`, PR #227).  
**Kontext**: Kompletní redesignová vlna aplikace implementující schválené specifikace z Figmy ([DESIGN.md](../DESIGN.md)), katalog sdílených UI komponent ([ui-components.md](ui-components.md)) a základy design systému ([design-system-audit-171.md](design-system-audit-171.md)).

---

## Manažerské shrnutí

Mezi 26. říjnem a 9. listopadem 2026 proběhla v aplikaci TrainLoop rozsáhlá generální obnova UX/UI napříč všemi klíčovými obrazovkami a toky. Celkem bylo začleněno **21 pull requestů** s přímým dopadem na UX, včetně velké integrační PR **#212** (která sjednotila balík PR 200–209 a následné úpravy z review) a dolaďovacích PR #214, #223 a #226.

Cíl sprintu od PO: _„Aplikace má být na mobilu jasná a příjemná. Na každé obrazovce poznám, co je hlavní akce, a nic nepotřebuje vysvětlující text.“_ Klíčové obrazovky (Týden, Trénink, Detail psa, Cíl) vznikly nejdřív ve Figmě ([Trainloop](https://www.figma.com/design/LBlhF1wiyl639ENDDG2RWE/Trainloop)) a teprve potom v kódu.

Redesign řeší konzistenci, přístupnost, ergonomii ovládání na dotykových zařízeních a specializované toky pro jednotlivé role:

- **Základy design systému**: Sémantické barevné tokeny, vynucení světlého režimu (tmavý režim byl na základě rozhodnutí Product Ownera dočasně odložen; tmavé pozadí zůstalo vyhrazeno pouze pro karty Hero a desktopový postranní panel), standardizovaná zaoblení (`rounded-card`, `rounded-field`, `rounded-hero`, `rounded-sheet`) a kontrast odpovídající standardům WCAG.
- **Ergonomie zaměřená na mobilní zařízení a sdílené komponenty**: Zvětšení dotykových prvků (minimálně 44 px pro interaktivní prvky, 52 px pro formulářová pole, 56 px pro hlavní akční tlačítka), mobilní spodní navigační lišta (`BottomNav`) a dialogy ve formě vysouvacích spodních panelů (`Drawer` / `ConfirmDestructiveDialog`), které na mobilních zařízeních nahradily rušivá modální okna.
- **Veřejné stránky a životní cyklus účtu**: Přepracovaná úvodní stránka (Landing Page), dedikovaný výběr role (Psovod vs. Trenér) již během registrace, nový vzhled přihlášení a obnovy hesla, úprava profilu, ověření změny e-mailu a bezpečné mazání účtu vyžadující zadání hesla.
- **Prostředí psovoda (Dnes a Týden)**: Výrazná karta Hero s aktuálním tréninkem a akcí na jedno klepnutí „Začít trénink“, přepracovaný týdenní kalendář s barevnými identifikačními proužky psů a indikátory zmeškaných/opožděných tréninků.
- **Správa psů, deník a archivace**: Stabilní identifikační barvy psů (1–6) promítnuté do avatarů, hlaviček i proužků v kalendáři; soukromé poznámky psovoda (`DogNote`) z lekcí a seminářů; proces archivace a obnovy psů z archivu.
- **Cíle a průchod tréninkem**: Editor cílů krok za krokem, explicitní posun v krocích cíle (Posunout, Přeskočit, Zpět), průvodce tréninkem (walkthrough) s integrovaným časovačem a záznamem chyb a automatické promazání budoucích plánovaných tréninků při archivaci cíle.
- **Záznamy tréninků a zpětná vazba**: Přechod z vyskakovacích oken na samostatné plnohodnotné stránky záznamu (`TrainingRecordPage`), vizuální odlišení zpráv trenéra a psovoda a okamžitá možnost odpovědi z karet historie s automatickým doscrolováním k editoru zprávy.
- **Zprávy mezi trenérem a psovodem**: Funkční konverzace navázaná na každý záznam tréninku, zvonek s oznámeními a karta „Zpráva od trenéra“ na obrazovce Dnes, tlačítko „Odpovědět“ v historii i v přehledu trenéra. Zprávy a historie jsou sloučené do jednoho místa (`/messages` přesměruje na `/history`).
- **Pracovní prostor trenéra a klienti**: Dedikovaný mobilní přehled trenéra (`TrainerOverview`), přehled klientů s barevnými teplotními mapami (heatmaps) úspěšnosti, strukturovaný proces plánování a izolace osobních psů trenéra do doby zavedení plnohodnotného přepínání rolí.

---

## Výsledky auditu: pain points původní verze

Audit jsme dělali průchodem aplikace v mobilním zobrazení (390 px) v obou rolích, psovod na cvičáku a trenér mezi lekcemi, a porovnáním s Figma návrhem. Hlavní problémy stavu k 26. 10. 2026 a jejich náprava:

| #   | Pain point (původní stav)                                                                                | Proč to vadilo                                                          | Náprava                                                                                                                                                                     |
| --- | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Nebylo poznat hlavní akci.** Obrazovky skládaly karty do karet, všechny akce vypadaly stejně důležitě. | Uživatel musel číst a hledat, co má udělat.                             | Na každé obrazovce jedna hlavní akce. Na Dnes tmavá `HeroCard` s tlačítkem **„Začít trénink“**. Pravidla v [`DESIGN.md`](../DESIGN.md).                                     |
| 2   | **Nebylo vidět, kde pes v plánu je.**                                                                    | Psovod nevěděl, co má dnes cvičit, a trenér neviděl postup.             | Cíl ukazuje **aktuální krok**. Posun řídí člověk: **zvládnuto / zpět / přeskočit**, nic se neposouvá samo ani podle procent. Trénink z kalendáře začíná u aktuálního kroku. |
| 3   | **Záznamy a komentáře ve stísněných dialogových oknech.**                                                | Na mobilu se v nich špatně psalo a záznam nešlo poslat odkazem.         | Záznam tréninku má vlastní stránku a URL. Tlačítko „Odpovědět“ otevře záznam rovnou u pole pro zprávu.                                                                      |
| 4   | **Odpověď trenéra se dala snadno přehlédnout.**                                                          | Zpětná vazba mezi lekcemi, za kterou trenér platí, nedorazila.          | Zvonek s oznámeními a karta „Zpráva od trenéra“ na Dnes. Konverzaci lze začít i z komentáře k tréninku.                                                                     |
| 5   | **Trénink venku se psem byl neovladatelný.** Malá tlačítka, hodně textu, stopky v jiné aplikaci.         | Psovod má jednu ruku na vodítku.                                        | Průchod tréninkem na celou obrazovku s časovačem, dotykové plochy 44–56 px, kritérium zvládnutí jako položka k odškrtnutí.                                                  |
| 6   | **Všechno bylo navždy aktivní.** Staré cíle, psi a disciplíny zabíraly místo.                            | Přehled se zaplňoval věcmi, které už neplatí.                           | Dokončení a archiv cíle (budoucí tréninky zmizí, historie zůstane), archiv psa s návratem, ukončení disciplíny.                                                             |
| 7   | **Navigace na mobilu se hledala.**                                                                       | Uživatel nevěděl, kde je a jak se vrátit.                               | Spodní lišta podle role (psovod: Dnes · Týden · Psi · Účet, trenér: Přehled · Klienti · Cíle · Účet). Destruktivní dialogy jako spodní panely.                              |
| 8   | **Nejednotný vzhled.** Náhodná zaoblení, barvy, stíny a slovník („aktivita“, „položka“).                 | Aplikace nepůsobila jako jeden produkt.                                 | Tokeny shodné s Figmou, stabilní barva psa (1–6), identita „deník psa“ ([`design-identity-plan.md`](design-identity-plan.md)), slovník deník / zápis / zadání.              |
| 9   | **Trenér plánoval naslepo.**                                                                             | Trénink šlo zařadit, aniž by bylo jasné, ke kterému psovi a cíli patří. | Plánování vede krok za krokem: klient → pes → cíl → trénink. U cíle je vidět, kolik tréninků je odcvičeno a kolik naplánováno.                                              |

---

## Podrobný funkční a UX rozbor

### 1. Základy design systému a sdílený UI kit

- **Sladění tokenů s Figmou (PR #176)**:
  - Sjednocení stylů pod CSS proměnné v `apps/frontend/src/styles/global.css`.
  - Doplnění sémantických dvojic: `hero`/`hero-foreground`, `success`/`success-foreground`, `warning`/`warning-foreground`, `info`/`info-foreground` a `card`/`card-foreground`.
  - Vynucení světlého režimu v celé aplikaci (přepínače motivu byly skryty v hlavičce i nastavení účtu); tmavý povrch je striktně vyhrazen pouze pro `HeroCard` a desktopový `AppSidebar`.
  - Nahrazení nahodilých hodnot zaoblení třídami tokenů: `rounded-card`, `rounded-field`, `rounded-hero` a `rounded-sheet`.
- **Knihovna sdílených komponent (PR #178, #185)**:
  - Zavedení znovupoužitelných prvků popsaných v `docs/ui-components.md`:
    - `HeroCard` a `HeroChip`: Zvýrazněná plocha pro hlavní akční souhrn.
    - `StripCard`: Karta obsahu s volitelným barevným pruhem psa na levém okraji.
    - `StatusChip`: Vizuální štítky verzálkami se sémantickými tóny (`muted`, `accent`, `success`, `warning`, `info`, `danger`, `hero`).
    - `PesAvatar`: Standardizovaný kruhový odznak psa využívající barvu `text-dog-foreground`.
    - `PerformanceLegend`: Barevná škála pásem úspěšnosti (<50 %, 50–65 %, 65–80 %, ≥80 %) s přístupným kontrastem.
    - `QueryState` a `EmptyState`: Sjednocené kostry načítání (`ListSkeleton`), prázdné stavy s ikonou, vysvětlením a akcí a chybové stavy s možností opakování akce.
- **Dotykové cíle a přístupnost (a11y) (PR #178, #185)**:
  - Standardizace minimálních rozměrů interaktivních prvků na ≥44×44 px.
  - Zvětšení klikací plochy u `CheckboxField` na celý řádek kontejneru (`min-h-touch`).
  - Implementace přístupných indikátorů zaměření (focus rings) s výrazným obrysem a odsazením (`ring-2 ring-ring ring-offset-2`).
- **Mobilní navigace a spodní panely (PR #178, #212)**:
  - Trvalá spodní navigační lišta (`BottomNav`) s obsahem podle role:
    - Psovod: **Dnes** · **Týden** · **Psi** · **Účet**.
    - Trenér: **Přehled** · **Klienti** · **Cíle** · **Účet**.
  * Nahrazení desktopových potvrzovacích oken na mobilu výsuvnými spodními panely (`ConfirmDestructiveDialog` / `Drawer`).

---

### 2. Veřejné stránky, autentizace a správa účtu

- **Redesign úvodní stránky (PR #175 v rámci #212)**:
  - Přepracovaná sekce Hero, přehled přínosů aplikace, představení funkcí i patička.
  - Využití vektorové grafiky na míru, kruhových ukazatelů postupu (`ProgressRing`) a plně responzivního rozvržení.
- **Přihlašování a registrace (PR #175 v rámci #212)**:
  - **Volba role**: Registrační proces začíná explicitní volbou mezi rolí _Psovod_ a _Trenér_, což rovnou nastavuje oprávnění a navigační strukturu.
  - **Přihlášení a registrace**: Sjednocený layout `AuthLayout` s komponentami `IconInput` a `PasswordInput` (možnost zobrazení hesla).
  - **Obnova přístupu**: Přepracované obrazovky _Zapomenuté heslo_ a _Obnova hesla_ s okamžitou validací.
- **Nastavení a zabezpečení účtu (`/account`) (PR #175 v rámci #212)**:
  - **Správa profilu**: Editace údajů uživatele v dialogu `EditAccountDialog`.
  - **Změna e-mailu**: Vyžaduje potvrzení přes ověřovací odkaz zaslaný na novou adresu.
  - **Změna hesla**: Integrovaný formulář pro změnu hesla s bezpečnostní kontrolou.
  - **Smazání účtu**: Kontextové vysvětlení důsledků podle role (např. vliv na přiřazené psy klientů u trenéra vs. smazání vlastních psů u psovoda); vyžaduje potvrzení zadáním hesla; na mobilu se zobrazuje jako spodní panel.
  - **Napojení na trenéra**: Dialog pro zadání zvacího kódu trenéra (`InviteCodeDialog` / `ConnectTrainerDialog`).
- **Chybové a načítací stavy (PR #175 v rámci #212)**:
  - Nový vzhled chybové stránky 404 (Nenalezeno) i globálního zachycení chyb (`ErrorLayout`, `RootErrorBoundary`) srozumitelný pro uživatele a obsahující tlačítka pro návrat.
  - Značková načítací obrazovka (`AppLoadingScreen`).

---

### 3. Správa psů, profil, deník a archivace

- **Vizuální identita psa (PR #176, #190, #191)**:
  - Každý pes má stabilně přiřazený index barvy (1–6), který se nemění napříč zobrazeními (karty, proužky v kalendáři, avataři, hlavičky).
  - Profil psa má výraznou, plnobarevnou záhlavní kartu v barvě psa s kontrastním písmem.
- **Soukromé poznámky a deník (PR #170, #183, #184)**:
  - Psovodi mohou k jednotlivým psům ukládat soukromé poznámky z lekcí a seminářů (`DogNote`).
  - Kompletně restylovaný deník psa využívající karty ze sdíleného UI kitu, doplněný o vyhledávání a rychlé akce pro přidání záznamu.
- **Archivace a obnova psa (PR #200 v rámci #212)**:
  - Možnost archivovat psa v případě neaktivity, pauzy nebo ukončení tréninku.
  - Akce je chráněna potvrzovacím dialogem.
  - Archivovaní psi se nezobrazují v aktivních seznamech, rychlých přepínačích ani v týdenním plánu.
  - Přidána dedikovaná sekce **Archiv psů** na stránce `/dogs` s možností kdykoliv psa vrátit mezi aktivní.
  - Do detailu psa (`DogDetailView`) byl přidán přímý odkaz na historii tréninků.
- **Ukončení a obnova disciplíny (PR #214)**:
  - Disciplínu, kterou pes už nedělá, lze ukončit ve formuláři psa i v sekci cílů; historie zůstává a disciplínu lze obnovit.

---

### 4. Toky psovoda: Dnes a Týden

- **Přehled „Dnes“ (PR #179, #186, #190)**:
  - Tmavá dominantní karta `HeroCard` s naplánovaným tréninkem na dnešní den.
  - Hlavní akce: tlačítko **„Začít trénink“** pro okamžité spuštění na jedno klepnutí.
  - Přehled splněných cviků, metrika postupu a zřetelné upozornění na zmeškané či opožděné tréninky.
- **Kalendář „Týden“ (PR #179, #186, #191, #209 v rámci #212)**:
  - Sedmidenní přehled agendy podle předlohy z Figmy.
  - Vizuální rozlišení jednotlivých dnů, psů (pomocí barevných proužků `StripCard`) a stavů dokončení.
  - Zřetelnější ovládací prvky pro posun mezi týdny a návrat k aktuálnímu týdnu.
  - Přímé otevírání akcí: kliknutí na naplánovaný trénink otevře detail rovnou bez zbytečných mezikroků.

---

### 5. Cíle, sledování kroků a průchod tréninkem

- **Práce s aktuálním krokem (PR #66 / #187, PR #206 v rámci #212)**:
  - Zavedení sledování aktivního kroku u cílů tréninku.
  - Přidány explicitní akce pro **Posunout** (Advance), **Přeskočit** (Skip) a **Vrátit zpět** (Step Back) mezi fázemi cíle.
  - Aktuální krok je vizuálně označen jak v detailu cíle, tak při samotném průchodu cvičením.
- **Editor cílů a plánování (PR #189, PR #201 v rámci #212)**:
  - Editor cílů s postupným průvodcem pro strukturování dlouhodobých milníků do sekvencí cviků.
  - **Dokončení a archivace cíle**: Splněný nebo již neaktuální cíl lze označit jako hotový či archivovaný.
  - **Automatický úklid kalendáře**: Archivace cíle automaticky odstraní všechny budoucí naplánované (`PLANNED`) tréninky tohoto cíle z týdenního kalendáře.
  - **Postup cíle podle tréninků (PR #223)**: U cíle je vidět počet odcvičených a naplánovaných tréninků; přeskočené tréninky se do postupu nepočítají.
- **Průchod tréninkem – walkthrough (PR #188, #192)**:
  - Nová obrazovka pro aktivní provádění tréninku se psem.
  - Integrovaný tréninkový časovač s ovládáním spuštění, pauzy a resetu.
  - Oddělená navigace mezi lokálními cviky v rámci tréninku od globálního postupu v cíli.
  - Závěrečný formulář po dokončení tréninku pro zaznamenání délky, podrobných chyb a hodnocení náročnosti.

---

### 6. Záznamy tréninků, historie a zpětná vazba

- **Celostránkový záznam tréninku (`TrainingRecordPage`) (PR #193, #204/#205 v rámci #212)**:
  - Nahrazení stísněných dialogových oken plnohodnotnými URL adresami (`/dogs/:dogId/activities/:activityId`).
  - Strukturovaný přehled splněných cílů, jednotlivých kroků, naměřených hodnot i zapsaných poznámek.
- **Zpětná vazba a chat k tréninku (PR #163/#205 v rámci #212)**:
  - Komunikační vlákno navázané přímo na konkrétní záznam tréninku.
  - Graficky odlišené bubliny zpráv pro trenéra a psovoda.
- **Práce s historií a zkratka pro odpověď (PR #207, #209 v rámci #212)**:
  - Tlačítko **„Odpovědět“** přímo na kartách v seznamu historie.
  - Kliknutí na odpověď uživatele přesměruje do záznamu a automaticky doscrolluje k poli pro zadání zprávy.
  - Přechod z vyskakovacích oken historie na přímé routování s parametrem `activityId`.
- **Zprávy a oznámení (PR #208 v rámci #212, PR #226)**:
  - Backend: `GET /api/updates` (posledních 30 zpráv z tréninků), `GET /api/activities/:id` (záznam s konverzací) a `POST /api/activities/:id/messages` (odpověď, max. 2000 znaků). Přístup je ověřen přes oprávnění k psovi.
  - Obrazovka **Dnes**: zvonek „Oznámení“ se seznamem posledních zpráv (klepnutí otevře konkrétní záznam) a karta **„Zpráva od trenéra“** s poslední zprávou.
  - Zprávy a historie jsou jedno místo: `/messages` přesměruje na `/history`, aby uživatel nehledal mezi dvěma obrazovkami.
  - **Zjednodušený záznam (PR #226)**: Poznámka psovoda z dokončení tréninku se zobrazuje jako první zpráva konverzace, takže na ni trenér odpovídá přímo a chat lze začít z komentáře.

---

### 7. Prostředí trenéra a správa klientů

- **Mobilní přehled trenéra (PR #182, #193)**:
  - Přehledová nástěnka pro trenéry s klíčovými metrikami: aktivní klienti, aktivní psi, úspěšnost dokončení a nedávná aktivita.
  - Rychlá tlačítka pro nejčastější trenérské úkony.
- **Seznam a detail klienta (PR #182, #204 v rámci #212)**:
  - Nový design seznamu klientů (`ClientList`, `ClientCard`) a klientského detailu.
  - Teplotní mapy (heatmaps) tréninkové aktivity klientů se sémantickým barevným odlišením (<50 %, 50–65 %, 65–80 %, ≥80 %).
- **Strukturované plánování tréninků trenérem (PR #204 v rámci #212)**:
  - Upravený tok vyžadující povinný výběr klienta, psa a konkrétního cíle před zařazením lekce do kalendáře.
  - Zpřesnění plánování, karet klientů a přehledu trenéra (PR #223).
- **Oddělení rolí trenéra a psovoda (PR #211 v rámci #212)**:
  - Vlastní psi trenéra byli dočasně skryti z trenérského přehledu, dokud nebude dopracován kompletní UX návrh pro přepínání kontextu rolí ([docs/trainer-own-dogs-followup.md](trainer-own-dogs-followup.md)).

---

### 8. Transakční e-maily

- **Sjednocený vzhled e-mailů (PR #169)**:
  - Zavedení sdílené komponenty `EmailLayout` napříč všemi šablonami (potvrzení účtu, reset hesla, pozvánka klienta).
  - Vizuální sladění s typografií, barvami, rozestupy i záhlavím a zápatím aplikace.

---

## Rejstřík začleněných pull requestů (od 26. 10. 2026)

| Datum merge      | PR / Větev                                        | Commit    | Souhrn dopadu na UX                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| :--------------- | :------------------------------------------------ | :-------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **05. 11. 2026** | **PR #169** (`new-e-mail`)                        | `0098f64` | `feat(email)`: Sjednocení vzhledu e-mailových šablon s design systémem aplikace.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| **05. 11. 2026** | **PR #170** (`feature/70-dog-notes`)              | `9a6e7c7` | `feat(dog)`: Soukromé poznámky z lekcí a seminářů pro psovody.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| **05. 11. 2026** | **PR #176** (`feature/171-design-system`)         | `d878929` | Redesign: Sjednocení designového základu a tokenů podle schválené Figmy.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| **05. 11. 2026** | **PR #178** (`feature/172-shared-ui-components`)  | `afe9ec2` | `feat(ui)`: Sdílené UI komponenty, mobilní spodní navigace a mobilní spodní panely.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| **05. 11. 2026** | **PR #179** (`feature/161-dnes-tyden`)            | `6a1c3aa` | `feat(today)`: Nová obrazovka Dnes a restyling Týdne pro psovoda.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| **05. 11. 2026** | **PR #182** (`feature/173-trainer-overview`)      | `d9e33d7` | `feat(client)`: Mobilní přehled trenéra a restyling seznamu klientů.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| **05. 11. 2026** | **PR #183** (`feature/163-dogs-profile-diary`)    | `783fec9` | `feat(dog)`: Restyle seznamu, profilu a historie psů se sdíleným UI kitem.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| **06. 11. 2026** | **PR #184** (`feature/163-dog-diary-restyle`)     | `3eb48a0` | `feat(dog)`: Restyle sekce deníku psa se sdíleným UI kitem.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| **06. 11. 2026** | **PR #185** (`feature/172-shared-ui-finish`)      | `f4dd2ea` | `feat(ui)`: Dokončení katalogu komponent, a11y dotykových ploch (44 px) a CheckboxField.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| **06. 11. 2026** | **PR #186** (`feature/161-dnes-tyden-polish`)     | `0a1b541` | `feat(today)`: Tlačítko Začít trénink na kartách plánu, opožděné tréninky.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| **06. 11. 2026** | **PR #187** (`feature/66-current-step`)           | `4aa870f` | `feat(goals)`: Sledování aktuálního kroku cíle (posun, přeskočení, návrat).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| **06. 11. 2026** | **PR #188** (`feature/162-walkthrough-redesign`)  | `deba307` | `feat(training)`: Redesign průchodu tréninkem, časovač, formulář dokončení s chybami.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| **07. 11. 2026** | **PR #189** (`feature/164-goals-training-editor`) | `f8512e6` | `feat(goals)`: Redesign cílů, editoru a plánování tréninků.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| **07. 11. 2026** | **PR #190** (`feature/figma-psi-dnes`)            | `54e0a2e` | `feat(ui)`: Karty psů a metriky Dnes s reálnými daty podle Figmy.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| **07. 11. 2026** | **PR #191** (`feature/figma-tyden-profil`)        | `1c6dcbd` | `feat(ui)`: Týdenní agenda a velká barevná hlavička psa.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| **07. 11. 2026** | **PR #192** (`feature/figma-pruchod`)             | `8c002e1` | `feat(ui)`: Průchod cvičením s časovačem a karty záznamu.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| **07. 11. 2026** | **PR #193** (`feature/figma-historie-prehled`)    | `95484f7` | `feat(ui)`: Historie se záznamem a metriky přehledu trenéra.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| **08. 11. 2026** | **PR #212** (`fix/ready-prs-without-166`)         | `5815bab` | **Integrace PR 200–209 a UX opravy historie, záznamu a plánování**: <br>• **PR #200**: Archiv a návrat psa, odkaz na historii v detailu psa.<br>• **PR #201**: Dokončení a archiv cíle s odstraněním budoucích tréninků.<br>• **PR #203 (#175)**: Redesign veřejných stránek, registrace s výběrem role, přihlášení a správa účtu.<br>• **PR #204/#205**: Celostránkový záznam tréninku s bloky cílů, odlišení zpráv v chatu, seznam klientů.<br>• **PR #206**: Zobrazení a editace aktuálního kroku v cíli.<br>• **PR #207/#208**: Navigace v záznamu přes `activityId`, routy pro zprávy a inbox.<br>• **PR #209**: Vylepšení přepínače týdnů, tlačítko Odpovědět na kartách historie. |
| **08. 11. 2026** | **PR #214** (`feature/dog-discipline-archive`)    | `1b1f5d2` | `feat(dog)`: Ukončení a obnova disciplíny ve formuláři psa a v cílech, ošetření chyb API.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| **09. 11. 2026** | **PR #223** (`fix: clarify trainer planning…`)    | `4055573` | Zpřesnění plánování trenérem, postup cíle podle odcvičených a naplánovaných tréninků, karty klientů.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| **09. 11. 2026** | **PR #225** (`fix/preserve-seed-on-deploy`)       | `05f7667` | Demo data přežijí nasazení, tréninky rozložené v čase (realistický stav pro kontrolu obrazovek).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| **09. 11. 2026** | **PR #226** (`fix/training-record-chat`)          | `160cdce` | Zjednodušený záznam tréninku, poznámka psovoda jako první zpráva konverzace, chat z komentáře.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |

---

## Co zbývá

| Oblast                      | Stav                                                                                                                                                                               | Další krok                                                                                          |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Obrazovka Týden proti Figmě | Funkčně odpovídá, vizuálně ne 1:1 (titulek a popis nad přepínačem, tlačítko „Dnes“, týdenní progress bar). Viz [`figma-redesign-kontrola.md`](vystupy/figma-redesign-kontrola.md). | Rozhodnout s PO, zda platí Figma, nebo kód, a sjednotit.                                            |
| Vlastní psi trenéra         | Dočasně skrytí z trenérského přehledu (#211).                                                                                                                                      | Navrhnout přepínání kontextu rolí ([`trainer-own-dogs-followup.md`](trainer-own-dogs-followup.md)). |
| Tmavý režim                 | Odložen rozhodnutím PO.                                                                                                                                                            | Vrátit se k němu po stabilizaci světlého režimu.                                                    |
| Úklid kódu                  | Komponenta `InboxView.tsx` zůstala po sloučení zpráv s historií nepoužitá.                                                                                                         | Odstranit.                                                                                          |
