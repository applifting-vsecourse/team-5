# Výsledky rozhovoru s uživatelem

Rozhovor proběhl v souladu se scénářem projektu TrainLoop a přinesl konkrétní vhled do práce trenérky i validace výzkumných hypotéz. Podklady: [scénář](scenar-rozhovoru-trainloop.md), [přepis](rozhovor.md).

## 1. Průběh a obsah rozhovoru

- **Profil respondentky:** Věnuje se pasení ovcí a okrajově dogfrisbee. Má 3 vlastní psy a měsíčně trénuje v průměru kolem 40 klientů.
- **Plánování a vlastní trénink:** Tréninky plánuje dopředu podle závodů a seminářů. U pasení má jasnou strukturu, u okrajového frisbee improvizuje. Pro své psy vede **papírové deníky** (pro každého psa a sport zvlášť), kam si zaznamenává plány do budoucna (nikoli zpětnou historii).
- **Drobné kroky a dekompozice:** Cviky rozkládá na dílčí sekvence (např. pozice u nohy, práce zadkem). Pokud pes chybuje („má tunel“), vrací se o krok zpět nebo cvik více rozkouskuje.
- **Práce s klienty:** Zadání předává na lekcích **výhradně ústně** (klienti si píší vlastní poznámky). Mezi lekcemi (klienti chodí cca 1× měsíčně) funguje konzultace přes **WhatsApp** formou textu či videí.
- **Problémy na straně klientů:** Trenérka neeviduje problémy s technologiemi, ale naráží na to, že **klienti si nezapíšou všechny detaily**, doma nevědí, jak postupovat, a dělají zbytečné chyby. Pokrok na další lekci trenérka pozná z paměti a přímo z chování psa.

## 2. Vyhodnocení vůči výzkumným hypotézám TrainLoop

- **H1 (Koordinace více disciplín způsobuje práci navíc): Oslabena.** Respondentka zvládá kombinaci pasení a frisbee bez zaznamenaného přetížení či složitého dohledávání.
- **H2 (Změny postupu ztěžují přehled): Oslabena.** Změny v tréninku řeší dekompozicí a papírovým plánováním, v návaznosti kroků se orientuje bez problémů.
- **H3 & H6 (Složitost předávání/dohledávání videí a zadání): Spíše oslabena u trenérky, částečně podpořena u klientů.** WhatsApp trenérce pro asynchronní kontrolu plně stačí a videa zpětně nedohledává. Jako klientka se však k videím vrací.
- **H4 & H9 (Chybějící zadání / nejasnosti mezi lekcemi): Podpořena.** Klienti ztrácejí kontext, nezapíšou si dostatek informací z ústního zadání a doma nevědí, co přesně cvičit.
- **H5 (Nestačí procentuální úspěšnost): Podpořena.** Úspěšnost měří přesným chováním, soustředěním a zvládnutím dílčích mikrokroků, nikoli jedním číslem.
- **H7 (Zpětná vazba s odstupem stačí): Spíše podpořena.** Klienti mezi lekcemi aktivně posílají videa a dotazy přes WhatsApp a trenérka odpovídá podle potřeby, od krátkého „děláš to super, pokračuj“ po delší dialog s doptáváním. Hranice tohoto způsobu vedení v rozhovoru nezazněly.
- **H8 (Správa klientů má doložitelnou časovou či finanční náročnost): Nezaznělo.** Čas na administrativu ani placené nástroje respondentka nezmínila. Od klientů nic nevyžaduje a pokrok pozná na další lekci.

## 3. Zjištění a dopad na produkt

Čísla Z1–Z11 používají [Lean Canvas](../lean-canvas.md), [feature breakdown](../feature-breakdown.xlsx) i user stories.

| #   | Zjištění                                                                                                                                             | Důkaz                                                                    | Dopad na produkt                                                                                        |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Z1  | **Klienti si z lekce zapamatují jen část zadání** a doma nevědí, jak postupovat. Trenérka pak vysvětluje totéž znovu.                                | H4 a H9 podpořeny. „Napíšou si jenom část a potom… neví, co mají dělat.“ | Hlavní problém v Lean Canvasu. Zadání od trenéra v telefonu klienta (F-12, F-13).                       |
| Z2  | Trenérka zadává **nejdřív princip** (čeho docílit, na co si dát pozor), **pak cviky s kritériem** („sedni, i když letí 45 míčků“).                   | Přepis, blok 5                                                           | Cíl má princip, cvik instrukci a kritérium zvládnutí (F-12, F-13).                                      |
| Z3  | Cviky **rozkládá na dílčí kroky**. Když pes chybuje („tunel“), vrátí se o krok nebo krok rozkouskuje. Nejdřív kousky, pak celek.                     | H2 oslabena, dekompozice potvrzena                                       | Návrat a mezikrok (F-14), větvení jako rozdělení kroku (F-15).                                          |
| Z4  | Úspěch posuzuje **kvalitativně**: soustředění, opakované chyby, zbrklost. Nezapisuje si ho.                                                          | H5 podpořena                                                             | K % úspěšnosti rychlé hodnocení (F-24), graf % mimo rozsah (F-27).                                      |
| Z5  | Klienti **posílají videa a dotazy přes WhatsApp**. Reakce sahá od „jo, super, pokračuj“ po dialog s doptáváním (jak pes spal, jestli se to opakuje). | Přepis, bloky 5–6                                                        | Vlákno u tréninku unese dialog (F-30), kontext k záznamu (F-44).                                        |
| Z6  | Trenérka se k videím **nevrací**, jako klientka **často**.                                                                                           | H3 a H6                                                                  | Historie s videi a odpověďmi je hodnota pro psovoda (F-26).                                             |
| Z7  | Trenérka **od klientů nic nevyžaduje**, pokrok pozná na další lekci. Klienti chodí cca **1× měsíčně** a dostanou „hromadu úkolů“.                    | Přepis                                                                   | „Čeká na reakci“ je fronta dotazů, ne kontrola (F-32). Metriky v Lean Canvasu nestojí na počtu zápisů.  |
| Z8  | Více disciplín **nedělá práci navíc**. Vlastní psy plánuje dopředu v papírovém deníku na psa a sport.                                                | H1 oslabena                                                              | Disciplíny vypadly z hlavních problémů, zanedbané disciplíny jen nice to have (F-23). Deník psa (F-47). |
| Z9  | Objem kolem **40 klientů měsíčně**.                                                                                                                  | Přepis                                                                   | Ceník za aktivního klienta místo tarifu do 15 psů (F-35).                                               |
| Z10 | Trénink jednoho psa = **2–3 bloky po 20 minutách**, které se střídají.                                                                               | Přepis, blok 2                                                           | Trénink se skládá z více bloků, odpovídá sekvencím cviků (F-13).                                        |
| Z11 | I jako klientka zažívá, že po semináři „co sis zaznamenala, to máš“.                                                                                 | Přepis                                                                   | Poznámky z lekce a semináře v deníku psa (F-47).                                                        |

## 4. Mezery

- Pohled klientů (psovodů) známe zprostředkovaně přes pozorování respondentky.
- Disciplíny z briefu (canicross, nosework, poslušnost) v rozhovoru nezazněly, respondentka se věnuje pasení a dogfrisbee.
