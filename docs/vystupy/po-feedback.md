# Komunikace s PO

Rozhodnutí product ownera (Veronika) a hodnocení, která tým dostal. Co tu je rozhodnuté, platí spolu s [upraveným plánem](upravenyPlan.md). Otevřené otázky jsou v [otazky-na-po.md](otazky-na-po.md).

**Jak komunikujeme:** dotaz posíláme PO hned, jak vznikne, ne až na schůzku. Když PO do druhého dne neodpoví, připomeneme se znovu (domluveno na standupu 15. 10.). Každé rozhodnutí sem zapíše ten, kdo se ptal, a propíše ho do dotčené story.

| Schůzka                                       | Kdy                          | Hlavní rozhodnutí                                                                                                                |
| --------------------------------------------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| [Standup sprintu 2](#standup-sprintu-2-15-10) | 15. 10. 2026                 | E-maily a kódy od trenéra mají fungovat už teď, trénink se zadává na konkrétní den, mezi cviky stačí šipky                       |
| [Zadání sprintu 2](#zadání-sprintu-2-14-10)   | 14. 10. 2026                 | Landing page, účty trenéra a psovoda, kód pro klienta, cíl s cviky, týden, záznam po tréninku                                    |
| [Hodnocení Sprintu 1](#hodnocení-sprintu-1)   | po Sprint Review 1           | Backlog a sitemapa dobře. Nereálné náklady, málo rozpracované wireframy a design, nekonzistentní breakdown, málo komunikace s PO |
| [FB2](#fb2-po-rozhovoru)                      | 9. 10. 2026, po rozhovoru    | Psovod může aplikaci používat i sám jako deník psa, zve vždycky trenér, platí jen trenér za aktivní klienty                      |
| [FB1](#fb1-před-rozhovorem)                   | 9. 10. 2026, před rozhovorem | Platí jen trenér, tržiště mimo MVP, kalendář jako Runna, větvení nepřekombinovat                                                 |

## Standup sprintu 2 (15. 10.)

Ze záznamu schůzky (Martin, Petr, Vilém, Veronika).

1. **E-maily:** obnova hesla a pozvánky mají posílat skutečné e-maily už ve sprintu 2 (#52, #91).
2. **Kódy od trenéra:** generování a propojení klienta má fungovat (#58, #60).
3. **Zařazení tréninku:** na konkrétní den, ne frekvencí („2× týdně“). Do budoucna možnost trénink zduplikovat (#71, #103). Tím je uzavřená otázka 2.
4. **Průchod tréninkem:** mezi cviky stačí šipky, gesta teď ne (#76).
5. **Datový model:** tým ukázal základní tabulky (uživatel, pes, cíl, cvik, trénink, záznam, kód pozvánky), PO bez připomínek.
6. **Práce:** části sprintu dělají dvojice, které si navzájem dělají review.

## Zadání sprintu 2 (14. 10.)

PO poslala před planningem, co chce vidět na konci sprintu. Stories jsou na boardu ve sloupci Sprint Backlog s iterací Sprint 2.

- **Návštěvník:** na landing page si přečte, co aplikace umí, a proklikne se na registraci (#102).
- **Trenér:** registrace a přihlášení, obnova hesla e-mailem, vidí jen své klienty a jejich psy. Vygeneruje kód pro klienta. U psa klienta založí cíl s principem a cviky s instrukcí a kritériem, cviky upraví, smaže a přeřadí. Trénink přiřadí ke konkrétnímu dni.
- **Psovod:** s kódem od trenéra se zaregistruje a založí psa (jméno, plemeno, foto). V týdnu vidí tréninky po dnech a přepíná týdny, trénink přesune nebo přeskočí. Otevře trénink se cviky a po tréninku zapíše hodnocení a poznámku, kterou trenér vidí u psa.
- Všechno pohodlně na mobilu.

## Hodnocení Sprintu 1

Dobře: backlog v GitHubu (stories, akceptační kritéria, Definition of Ready, mimo rozsah), přehledná sitemapa s popsanými cestami, rozhovor s hypotézami a závěry propsanými do breakdownu.

| Výtka                                                                  | Co jsme změnili                                                                                                                        |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Lean Canvas: nereálné náklady bez vývoje, metriky bez dopadu na byznys | [Lean Canvas 1.5](lean-canvas.md): vývoj 192 000 Kč, cashflow na 36 měsíců, bod zvratu v 15. měsíci, metriky příjmu a konverze trenérů |
| Wireframy málo rozpracované                                            | Obrazovky sprintu 2 dopracované ve Figmě včetně prázdných a chybových stavů                                                            |
| Design téměř chyběl                                                    | Design systém a obrazovky sprintu 2 ve Figmě, tokeny shodné s aplikací                                                                 |
| Breakdown: nekonzistentní granularita                                  | [Breakdown](feature-breakdown.xlsx) má 32 features stejné velikosti, drobné části jsou stories                                         |
| Komunikace s PO téměř neprobíhala                                      | Pravidlo výše, tento záznam a dotazy průběžně během sprintu                                                                            |
| Discovery bez doporučení, kudy dál                                     | [Doporučení v Lean Canvasu](lean-canvas.md#doporučení-kudy-dál)                                                                        |

## FB2 (po rozhovoru)

Zapsáno podle změn, které tým zapracoval po schůzce ([PR #5](https://github.com/applifting-vsecourse/team-5/pull/5)).

1. **Kdo aplikaci používá:** psovod může aplikaci používat i sám a zdarma jako deník psa (F-01, F-05). S trenérem se propojí, až ho trenér pozve.
2. **Kdo zve:** vždycky trenér, i psovoda, který už aplikaci používá. Pozvánku jde přijmout i v existujícím účtu (F-07). Psovod trenéra nezve (F-08 mimo rozsah).
3. **Kdo platí:** jen trenér, a to za aktivní klienty, kterým prodává podporu mezi lekcemi. Ceník (3 klienti zdarma, 49 Kč za dalšího, strop 1 490 Kč) je návrh týmu, viz [Lean Canvas 1.4](lean-canvas.md#ceník) a [otázka 8](otazky-na-po.md).
4. **Deník psa:** poznámky z lekce a semináře jsou součást MVP (F-05).

Ostatní otázky připravené na FB2 zůstávají otevřené v [otazky-na-po.md](otazky-na-po.md).

## FB1 (před rozhovorem)

Původní zápis od PO, beze změn.

**Projekt:** Tréninková aplikace pro psy a psovody
**Role:** Product Owner (PO)
**Kontext:** Reakce na Feature Breakdown, Lean Canvas a Wireframy před zahájením uživatelského výzkumu

### 1. Byznys model & Rozsah MVP

- **Monetizace a role:** Vyřazení tržiště (Marketplace) z MVP dává smysl, ale je nutné držet čistý byznys model.
- Platícím zákazníkem je výhradně trenér, který si kupuje přístup/licenci pro vedení svých klientů.
- Pro psovody (majitele psů) musí být aplikace zdarma (na pozvánku od trenéra), což je zásadní motivace pro adopci platformy.
- **Finanční výhled:** V tabulkách nákladů a příjmů je nutné ověřit horizont návratnosti (kdy začne produkt reálně vydělávat – cíl je cca do 6 měsíců) a ujasnit si s Honzou, jak do rozpočtu započítat hodinovou sazbu vývojového týmu.

### 2. Tréninkové plány & Uživatelská logika (Inspirace aplikací Runna)

- **Škála cílů:** Plánovací modul musí zvládat jak komplexní dlouhodobé cíle (např. spolehlivá chůze u nohy), tak drobné triky (např. pac / dát ťapku).
- **Logika kalendáře a vynechání tréninku:**
  - Osvědčený vzor z běžecké aplikace Runna: uživatel vidí rozvrh v týdnech/dnech.
  - Pokud trénink neproběhne, systém musí nabízet dvě jasné cesty: buď přesun tréninku na jiný den/týden, nebo možnost trénink zcela přeskočit (skipnout).
- **Větvení plánů:** Zbytečně nepřekombinovávat datový model pro MVP; soustředit se na to, co trenér i psovod potřebují v základní fázi.

### 3. Zadání pro uživatelské rozhovory (Product Discovery)

- **Časový rámec:** Rozhovory jsou nastavené na 30 minut – je nutné mít scénář předem detailně nastudovaný, aby vedení rozhovoru nebylo ve stresu.
- **Cíl zjišťování (chybějící doménová znalost):**
  - Pokud týmu chybí doménová znalost (obdoba vývoje investičních aplikací bez znalosti investic), je nutné jít do hloubky a zjistit skutečné potřeby koncového uživatele.
  - Cílem hovoru je přesně pochopit: Jak trenér a psovod reálně přemýšlí, když trénink plánují a vyhodnocují?
  - Výstupy z rozhovorů následně promítneme přímo do digitálního rozhraní a upravíme podle nich Feature Breakdown.

### 4. Hodnocení wireframů & Zpětná vazba

- **Vizuální koncept:** Předvedené wireframy (splash screen, týdenní rozvrh, profil psa, detail cvičení s nahráním videa) jsou pro základní představu a MVP zcela dostačující a přehledné – není potřeba je dál komplikovat.
- **UX detail:** Potvrzeno, že horní přehled uživatelů/svěřenců správně odpovídá pohledu přihlášeného trenéra.

### 5. Akční kroky a úkoly

1. **Uživatelský výzkum:** Určit konkrétního člena týmu, který hned převezme roli tazatele a povede nadcházející rozhovor.
2. **Aktualizace Feature Breakdownu:** Po skončení rozhovorů znovu projít rozpad funkcí a zapracovat nová zjištění ohledně stavby plánů.
3. **Konzultace rozpočtu:** Dořešit s Honzou započtení práce týmu do celkové cost structure.
