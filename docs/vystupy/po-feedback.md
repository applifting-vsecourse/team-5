# Feedback od PO

Rozhodnutí product ownera (Veronika) ze schůzek nad výstupy Sprintu 1. Co tu je rozhodnuté, platí spolu s [upraveným plánem](upravenyPlan.md). Otevřené otázky jsou v [otazky-na-po.md](otazky-na-po.md).

| Schůzka                     | Kdy                          | Hlavní rozhodnutí                                                                                           |
| --------------------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------- |
| [FB2](#fb2-po-rozhovoru)    | 9. 10. 2026, po rozhovoru    | Psovod může aplikaci používat i sám jako deník psa, zve vždycky trenér, platí jen trenér za aktivní klienty |
| [FB1](#fb1-před-rozhovorem) | 9. 10. 2026, před rozhovorem | Platí jen trenér, tržiště mimo MVP, kalendář jako Runna, větvení nepřekombinovat                            |

## FB2 (po rozhovoru)

Zapsáno podle změn, které tým zapracoval po schůzce ([PR #5](https://github.com/applifting-vsecourse/team-5/pull/5)).

1. **Kdo aplikaci používá:** psovod může aplikaci používat i sám a zdarma jako deník psa (F-01, F-47). S trenérem se propojí, až ho trenér pozve.
2. **Kdo zve:** vždycky trenér, i psovoda, který už aplikaci používá. Pozvánku jde přijmout i v existujícím účtu (F-09). Psovod trenéra nezve (F-11 mimo rozsah).
3. **Kdo platí:** jen trenér, a to za aktivní klienty, kterým prodává podporu mezi lekcemi. Ceník (3 klienti zdarma, 49 Kč za dalšího, strop 1 490 Kč) je návrh týmu, viz [Lean Canvas 1.4](lean-canvas.md#ceník) a [otázka 8](otazky-na-po.md).
4. **Deník psa:** poznámky z lekce a semináře jsou součást MVP (F-47).

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
