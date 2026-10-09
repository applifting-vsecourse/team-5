# Plán úprav po rozhovoru a FB1

**Stav:** pracovní plán týmu 5, 9. 10. 2026, na víkendové dotažení před Sprint Review 1 (12. 10.)
**Zadání:** zjištění z rozhovoru propsat do Lean Canvasu a breakdownu, upravit priority, začít wireframy, sepsat, co ještě nevíme a na co se zeptat ve FB2.
**Vstupy:** [rozhovor s trenérkou](rozhovor/vysledky.md) · [feedback PO z FB1](po-feedback-fb1.md) · [upravený plán](upravenyPlan.md) · [wireframy ve Figmě](https://www.figma.com/design/IjEnmXXeJB8YBOWPjWiFu3/Trainloop-wireframe?node-id=0-1)

> **Pravidlo:** co stanoví [upravený plán](upravenyPlan.md), platí a neotevíráme to. Zjištění z rozhovoru ovlivňují, _jak_ to postavíme a co dalšího přidáme, ne _jestli_ to postavíme.

---

## 1. Co víme nového

### Z rozhovoru s trenérkou

| #   | Zjištění                                                                                                                                                     | Důkaz                                                                    | Dopad na produkt                                                                                                                            |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Z1  | **Klienti si z lekce zapamatují jen část zadání** a doma nevědí, jak postupovat. Trenérka pak vysvětluje totéž znovu.                                        | H4 a H9 podpořeny. „Napíšou si jenom část a potom… neví, co mají dělat.“ | Nejsilnější problém. Písemné zadání od trenéra v telefonu klienta je jádro hodnoty.                                                         |
| Z2  | Trenérka zadává **nejdřív princip** („čeho docílit, na co si dát pozor“), **pak cviky s konkrétním kritériem** („sedni, i když letí 45 míčků“).              | Přepis, blok 5                                                           | Cíl potřebuje popis principu, každý cvik instrukci a kritérium zvládnutí.                                                                   |
| Z3  | Cviky **rozkládá na dílčí kroky**. Když pes chybuje („tunel“), vrátí se o krok nebo krok rozkouskuje. Nejdřív kousky, pak celek.                             | H2 oslabena (přehled má), dekompozice potvrzena                          | Potvrzuje cviky, sekvence, návrat a mezikrok. Větvení v praxi znamená rozdělit krok na menší části, což sedí na pokyn PO „nepřekombinovat“. |
| Z4  | Úspěch posuzuje **kvalitativně**: soustředění, opakované chyby, zbrklost. Nezapisuje si ho.                                                                  | H5 podpořena                                                             | % zůstává (UP), ale samo nestačí. Doplnit rychlé kvalitativní hodnocení a poznámku.                                                         |
| Z5  | Klienti **aktivně posílají videa a dotazy přes WhatsApp**. Reakce sahá od „jo, super, pokračuj“ po dialog s doptáváním (jak pes spal, jestli se to opakuje). | Přepis, blok 5–6                                                         | Vlákno u tréninku musí unést dialog. Pomůže i kontext k záznamu (okolnosti).                                                                |
| Z6  | Trenérka se k videím **nevrací** (leda kvůli obsahu na sítě). **Jako klientka se k nim vrací často.**                                                        | H3 a H6: u trenérky oslabeny, u klienta podpořeny                        | Historie videí a odpovědí je hodnota pro psovoda, ne pro trenéra.                                                                           |
| Z7  | Trenérka **od klientů nic nevyžaduje**. Pokrok pozná na další lekci z chování psa. Klienti chodí **cca 1× měsíčně** a dostanou „hromadu úkolů“.              | Přepis                                                                   | „Čeká na reakci“ je pro trenéra fronta dotazů, ne kontrola. Metrika „psovod zapíše ≥ 2 tréninky týdně“ je riskantní.                        |
| Z8  | Více disciplín **nezpůsobuje práci navíc**. Vlastní psy plánuje dopředu v papírovém deníku (na psa a sport), ne zpětně.                                      | H1 oslabena                                                              | Problém „organizace napříč disciplínami“ v Lean Canvasu oslabit. Týden zůstává (UP), ale jeho hodnota je hlavně v přehledu pro klienta.     |
| Z9  | Objem kolem **40 klientů měsíčně**.                                                                                                                          | Přepis                                                                   | Víc, než předpokládá Lean Canvas (5–20 klientů) a Solo tarif (do 15 psů).                                                                   |
| Z10 | Trénink jednoho psa = **2–3 bloky po 20 minutách**, které se střídají.                                                                                       | Přepis, blok 2                                                           | Trénink v kalendáři se skládá z více bloků, což odpovídá sekvencím cviků.                                                                   |
| Z11 | I jako klientka jiných trenérů zažívá, že po semináři „co sis zaznamenala, to máš“.                                                                          | Přepis                                                                   | Problém Z1 platí i z druhé strany.                                                                                                          |

**Mezery:** pohled klientů máme zprostředkovaně přes trenérku. Disciplíny z briefu (canicross, nosework) v rozhovoru nezazněly. Ve [vysledky.md](rozhovor/vysledky.md) chybí vyhodnocení H7 (odstup zpětné vazby: spíše podpořena, WhatsApp funguje) a H8 (náklady na správu klientů: nezaznělo).

### Z feedbacku PO (FB1)

| #   | Rozhodnutí PO                                                                                  | Kam se propíše                                    |
| --- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| P1  | Platí jen trenér, psovod má aplikaci zdarma na pozvánku.                                       | Už je v UP i Lean Canvasu, jen ověřit konzistenci |
| P2  | Návratnost **cca do 6 měsíců**. Hodinovou sazbu týmu započítat podle Honzy.                    | Nákladová struktura, Lean Canvas (Cost Structure) |
| P3  | Plán musí unést **dlouhodobé cíle i drobné triky**.                                            | Breakdown F-12, sitemapa (pojem _Cíl_)            |
| P4  | Kalendář jako **Runna**: týdny a dny. Neodcvičený trénink → **přesunout**, nebo **přeskočit**. | Breakdown F-21 a F-23, wireframe Týden            |
| P5  | Větvení **nepřekombinovat**.                                                                   | Breakdown F-15, wireframe Tvorba tréninku         |
| P6  | Wireframy stačí, **nekomplikovat**. Horní přehled svěřenců u trenéra je správně.               | Jen doplnit chybějící obrazovky a stavy           |

---

## 2. Formátování (hotovo)

- `po-feedback-fb1` → [po-feedback-fb1.md](po-feedback-fb1.md): přejmenováno přes `git mv` a převedeno na markdown (nadpisy, odrážky), obsah beze změny.
- [rozhovor/vysledky.md](rozhovor/vysledky.md), [rozhovor/poznamky.md](rozhovor/poznamky.md): nadpis, odkazy na související soubory, sevřené seznamy. V poznámkách opraveny překlepy a „40 psů“ změněno na „40 klientů“ podle přepisu.
- [rozhovor/rozhovor.md](rozhovor/rozhovor.md): záhlaví s datem a legendou mluvčích, přepis beze změny.
- [upravenyPlan.md](upravenyPlan.md): úrovně nadpisů (`###` → `##`), zbytečné prázdné řádky v seznamech.
- [lean-canvas.md](lean-canvas.md): řádek `**Designed for:** …` se kvůli `---` hned pod ním vykresloval jako nadpis, LaTeX `$\ge 60\ \%$` nahrazen znakem ≥.
- [rozhovor/scenar-rozhovoru-trainloop.md](rozhovor/scenar-rozhovoru-trainloop.md): sloučené vícenásobné prázdné řádky.

---

## 3. Lean Canvas (`lean-canvas.md` + `lean-canvas.docx`, verze 1.3)

Oba soubory se musí měnit současně. Doporučujeme brát `.md` jako zdroj a `.docx` z něj přepsat.

| Pole                                   | Teď                                                                                          | Navržená změna                                                                                                                                                                                                                                                           | Zdroj             |
| -------------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------- |
| **Problem**                            | 1) organizace napříč disciplínami, 2) srovnávání efektivity, 3) komunikace a ztráta kontextu | 1) **Klienti si z lekce zapamatují jen část zadání a doma nevědí, jak postupovat.** 2) Zpětná vazba mezi lekcemi běží přes WhatsApp, odtrženě od zadání. 3) Trenér opakovaně vysvětluje totéž. Disciplíny a srovnávání vypadnou (H1 oslabena, historii trenérka nevede). | Z1, Z5, Z8        |
| **Existing Alternatives**              | tužka a papír, Excel, Strava, habit trackery                                                 | **Ústní zadání na lekci + vlastní poznámky klienta**, **WhatsApp** (text a video), papírové deníky trenéra. Stravu a habit trackery vyřadit.                                                                                                                             | Z1, Z5, Z8        |
| **Solution**                           | webapp, trenér připravuje cvičení a sleduje efektivitu                                       | Plán od trenéra (princip → cviky s instrukcí a kritériem), týden s přesunem a přeskočením, záznam s videem a vlákno u tréninku.                                                                                                                                          | Z2, P4, UP        |
| **UVP**                                | „Vidíte, co vaši klienti mezi lekcemi opravdu odcvičili…“                                    | Posunout ke Z1, např.: _„Vaši klienti doma přesně vědí, co a jak cvičit, a vy nemusíte totéž vysvětlovat znovu.“_ Trenér kontrolu nevyžaduje (Z7).                                                                                                                       | Z1, Z7            |
| **Customer Segments / Early Adopters** | trenéři s 5–20 klienty                                                                       | Upřesnit: trenéři s desítkami klientů, kteří chodí cca 1× měsíčně a dostávají úkoly na doma.                                                                                                                                                                             | Z7, Z9            |
| **Key Metrics**                        | 10 trenérů do 6 měsíců, 50 psů, ≥ 60 % psovodů zapíše ≥ 2 tréninky týdně                     | První dvě ponechat (sedí na P2). Třetí nahradit metrikou, která odpovídá Z7, např. _podíl klientů, kteří mezi lekcemi otevřou zadání ≥ 1× týdně_ a _podíl dotazů a videí poslaných přes TrainLoop místo WhatsAppu_.                                                      | Z7, FB2 otázka 10 |
| **Cost Structure**                     | infrastruktura, vývoj, doména                                                                | Doplnit práci týmu (sazba × hodiny) podle Honzy.                                                                                                                                                                                                                         | P2                |
| **Revenue**                            | Solo 490 Kč / Pro 990 Kč, psovod 0 Kč                                                        | Beze změny (UP).                                                                                                                                                                                                                                                         | UP                |

---

## 4. Nákladová struktura (`nakladova-struktura.xlsx`)

1. **Po konzultaci s Honzou** přidat list nebo řádky _Práce týmu_: hodiny × sazba a rozhodnutí, jestli jde o jednorázovou investici (CAPEX), nebo průběžný náklad. (P2)
2. Do `Cashflow_12M` doplnit **měsíc bodu zvratu** a porovnat ho s cílem cca 6 měsíců. Dnes kumulativní cashflow práci týmu vůbec nezná. Pro představu: v M06 je 10 trenérů × ARPU 640 Kč = 6 400 Kč měsíčně.
3. Přepočítat podíl Solo/Pro (dnes 70/30). Trenérka se 40 klienty by spadala do Pro. (Z9, FB2 otázka 8)

---

## 5. Feature breakdown (`feature-breakdown.xlsx`)

Stavy, které tabulka povoluje: **Navrženo / Odsouhlaseno / Zamítnuto**. Zdroje: **Klient / Rozhovor / Research / Tým / Předpoklad týmu**.

- Řádky, které stanoví upravený plán nebo PO ve FB1 → **Odsouhlaseno**, zdroj _Klient_.
- Řádky podložené rozhovorem → doplnit zdroj **Rozhovor**.
- Upravit úvodní text v A2 (dnes tvrdí, že je „vše ve stavu Navrženo“).

### Změny po řádcích

| ID              | Feature                                                 | Změna                                                                                                                                           | Priorita     | Stav         | Proč             |
| --------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ------------ | ---------------- |
| F-06            | Více psů na účtu                                        | Otázku uzavřít.                                                                                                                                 | MVP          | Odsouhlaseno | UP               |
| F-08, F-09      | Trenér pozve klienta / přijetí pozvánky                 | Otázky „kdo zve“ uzavřít. Zbývá platnost kódu.                                                                                                  | MVP          | Odsouhlaseno | UP               |
| F-12            | Plán tréninku → **Cíl a plán**                          | Cíl může být dlouhodobý (chůze u nohy) i drobný trik (pac). Plán začíná **principem a tím, na co si dát pozor**. Otázku na cíl uzavřít.         | MVP          | Odsouhlaseno | P3, Z2           |
| F-13            | Cviky a sekvence                                        | Ke každému cviku **instrukce a kritérium zvládnutí** („sedí, i když letí míčky“). Jde o upřesnění z rozhovoru, proto zatím k potvrzení.         | MVP          | Navrženo     | UP B, Z2, Z3     |
| F-14            | Posun, návrat, přeskočení                               | Otázku „ručně, nebo podle %“ uzavřít: rozhoduje člověk podle chování psa.                                                                       | MVP          | Odsouhlaseno | UP, Z3, Z4       |
| F-15            | Rozvětvení cesty                                        | Popsat jednoduchou podobu pro MVP: **rozdělení kroku na dílčí kroky s návratem do hlavní cesty**. Na FB2 ukázat návrh (otázka 1).               | MVP          | Odsouhlaseno | UP, P5, Z3       |
| F-16            | Úpravy plánu                                            | Odstranit „Potvrdit s PO“, upravují oba.                                                                                                        | MVP          | Odsouhlaseno | UP               |
| F-20            | Naplánování tréninku na den                             | Vzor Runna, týdny a dny. Kdo vybírá dny → FB2 (otázka 2).                                                                                       | MVP          | Navrženo     | P4               |
| F-21            | Přesun mezi dny → **Přesunout, nebo přeskočit trénink** | Neodcvičený trénink jde přesunout na jiný den či týden, nebo přeskočit.                                                                         | MVP          | Odsouhlaseno | UP C, P4         |
| F-23            | Neodcvičené tréninky a zanedbané disciplíny             | Přeskočení se přesune do F-21. Zbude jen upozornění na zanedbanou disciplínu.                                                                   | Nice to have | Navrženo     | H1 oslabena      |
| F-24            | Odeslání tréninku                                       | **% úspěšnosti** (UP) + **rychlé kvalitativní hodnocení** (soustředění, opakované chyby) + poznámka. Za cvik, nebo za trénink → FB2 (otázka 3). | MVP          | Navrženo     | UP D, Z4         |
| F-25            | Video z tréninku                                        | **Odkaz** na video (YouTube unlisted, cloud), ne upload. Otázku uzavřít.                                                                        | MVP          | Odsouhlaseno | UP D             |
| F-26            | Historie tréninků psa                                   | Zdůraznit **hodnotu pro psovoda**: videa a odpovědi trenéra na jednom místě.                                                                    | MVP          | Navrženo     | Z6               |
| F-27            | Graf vývoje úspěšnosti                                  | Snížit, úspěch se v praxi číslem neměří.                                                                                                        | Mimo rozsah  | Navrženo     | Z4               |
| F-30            | Komentáře k tréninku                                    | **Vlákno pod konkrétním tréninkem**, unese dialog (doptávání).                                                                                  | MVP          | Odsouhlaseno | UP D, Z5         |
| F-32            | Čeká na reakci                                          | Přeformulovat na **frontu dotazů klientů**, ne kontrolu plnění.                                                                                 | MVP          | Navrženo     | Z7               |
| F-33            | Upozornění → **Štítek „nová odpověď“**                  | Upozornění v aplikaci, bez něj psovod odpověď nenajde. E-mail se oddělí do F-46.                                                                | MVP          | Navrženo     | Z5               |
| F-43            | Průchod tréninkem                                       | Přesunout řádek do bloku _Záznam tréninku_. Otázku uzavřít: šipky = další cvik v dnešním tréninku. Každý cvik ukazuje instrukci a kritérium.    | MVP          | Navrženo     | Z1, Z2           |
| **F-44** _nová_ | Kontext k záznamu                                       | Psovod u záznamu volitelně vyplní okolnosti (spánek, prostředí, opakuje se chyba), na které se trenérka jinak doptává.                          | Nice to have | Navrženo     | Z5               |
| **F-45** _nová_ | Vlastní psi trenéra                                     | Trenér vede v aplikaci i své psy (náhrada papírového deníku).                                                                                   | Nice to have | Navrženo     | Z8, FB2 otázka 6 |
| **F-46** _nová_ | E-mailová upozornění                                    | Oddělené z F-33.                                                                                                                                | Nice to have | Navrženo     | FB2 otázka 5     |

---

## 6. Wireframy (Figma)

PO je s wireframy spokojený (P6), takže **jen doplňujeme a opravujeme, nepřekreslujeme**.

### Úklid toho, co existuje

- Přejmenovat rámce: „Uvodní stránka“ → _Úvodní stránka_, rámec s nadpisem _Pozvat klienta_ se jmenuje „Zapomenuté heslo )“, druhý „Zapomenuté heslo )“ → _Zapomenuté heslo_, „Účet“ ↔ v sitemapě _Profil_ (sjednotit).
- Spodní lišta má popisky „TAB 2 / TAB 4 / TAB 5“ → _Psi · Týden · Klienti · Profil_ (psovod bez _Klienti_).
- Úvodní text „Mobilní aplikace…“ → _webová aplikace pro mobil_ (UP: PWA, ne nativní app).
- Konec tréninku: tlačítko „Nahrát video“ → **pole pro odkaz na video** (UP: externí odkaz).

### Úpravy podle zjištění (v pořadí důležitosti)

1. **Konec tréninku (záznam):** % úspěšnosti, rychlé hodnocení (soustředění, opakované chyby), poznámka, odkaz na video. _(F-24, F-25, Z4)_
2. **Reakce trenéra:** _Detail klienta_ má teď jeden chat s celým klientem. Podle UP patří vlákno **pod konkrétní trénink**. Návrh: Detail klienta → seznam odeslaných záznamů → _Záznam_ (video, %, poznámka, vlákno, tlačítko _Upravit plán_). _(F-30, F-32)_
3. **Týden:** u karty tréninku akce **Přesunout** a **Přeskočit** (Runna) a stavy _odcvičeno / přeskočeno / nová odpověď_. _(F-21, F-33, P4)_
4. **Trénink (průchod):** u každého cviku instrukce a kritérium zvládnutí. _(F-13, F-43, Z2)_
5. **Tvorba tréninku:** hlavička cíle s principem, detail bloku (název, instrukce, kritérium), větvení jako rozdělení kroku. _(F-12, F-13, F-15)_
6. **Chybějící obrazovky:** _Naplánovat trénink_ (dny a období), _Nový pes_, prázdné stavy.
7. **Pes:** _Aktivity_ jako historie s videi a odpověďmi trenéra. _(F-26, Z6)_

---

## 7. Sitemapa (`sitemapa.md` + `sitemapa.svg`)

- Sloupec _Wireframe_ je zastaralý. Ve Figmě už existují: Přihlášení, Registrace psovoda, Pozvánka, Zapomenuté heslo, Pozvat klienta, Detail klienta.
- **Pojmy:** přidat _Cíl_ (P3) a _Instrukce / kritérium_. _Záznam_ = % úspěšnosti, hodnocení, poznámka, odkaz na video (dnes jen „video a komentář“).
- Přidat dialog **Přesunout / Přeskočit** pod Týden. _Reakce trenéra_ přesunout pod konkrétní záznam.
- Krok 7 v „Jak vzniká a probíhá trénink“ upravit podle nové obrazovky _Záznam_.
- SVG překreslit podle výsledné struktury.

---

## 8. Otázky na klienta

- V [otazky-na-klienta.md](otazky-na-klienta.md) označit jako **zodpovězené**: 1 (část: PO „nepřekombinovat“), 2 (UP: upravují oba), 4 (PO: cíle i triky), 5 (PO: Runna), 6 (UP: externí odkaz), 7 (UP: PWA), 8 (UP: zve trenér), 11 (UP: více psů). U otázky 2 smazat „Toto je třeba s PO potvrdit“.
- Nové otázky dát do samostatného souboru [otazky-fb2.md](otazky-fb2.md) (viz níže).

---

## 9. Co ještě nevíme → otázky na FB2

Podrobně, s návrhem týmu u každé otázky, v [otazky-fb2.md](otazky-fb2.md). Tam jsou u otázek 1, 3, 5 a 7 i alternativní návrhy změn priorit (F-15, % úspěšnosti, F-46, F-18), které v breakdownu neměníme a necháváme na PO.

| #   | Otázka na PO                                                                                                                                                       | Proč se ptáme                                                                                     | Ovlivní                         |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- | ------------------------------- |
| 0   | **Kdo aplikaci používá první:** trenér, který pozve klienty (Lean Canvas 1.3), nebo psovod jako jeho deník (varianta B, po FB2 [Lean Canvas 1.4](lean-canvas.md))? | Trenérka problém necítí, bolest nese klient. Mění rozhodnutí z FB1, proto jen jako otázka.        | Lean Canvas, F-08, F-09         |
| 1   | Ukážeme návrh větvení jako **rozdělení kroku na dílčí kroky s návratem do hlavní cesty**. Pokrývá to, co potřebujete?                                              | Tak to popsala trenérka a sedí to na „nepřekombinovat“. Chceme potvrdit podobu před user stories. | F-15, wireframe Tvorba tréninku |
| 2   | **Kdo zařazuje tréninky do dnů:** trenér při plánování, nebo psovod podle svého týdne?                                                                             | Klienti chodí 1× měsíčně a dostanou „hromadu úkolů“. Kdo pak skládá týden?                        | F-20, Týden                     |
| 3   | **Jak má psovod určit % úspěšnosti** a zadává ho za cvik, nebo za celý trénink? Chcete vedle něj rychlé hodnocení (soustředění, opakované chyby)?                  | Trenérka měří kvalitativně (H5).                                                                  | F-24, Konec tréninku            |
| 4   | **Co se stane s přeskočeným tréninkem:** cvik se vrátí do plánu, nebo se vynechá? Vidí trenér, co klient přeskočil?                                                | Runna vzor známe, dopad na plán ne.                                                               | F-21, F-14                      |
| 5   | Stačí, když psovod uvidí **odpověď trenéra v aplikaci**, nebo potřebuje upozornění i mimo ni (e-mail, push), aby nahradila WhatsApp?                               | Bez upozornění se psovod nevrátí, WhatsApp ho upozorní sám.                                       | F-33                            |
| 6   | Má trenér vést v aplikaci i **své vlastní psy**?                                                                                                                   | Respondentka má 3 psy a papírové deníky.                                                          | F-45                            |
| 7   | Dávají trenéři **podobné plány více klientům**?                                                                                                                    | Rozhoduje o prioritě šablon.                                                                      | F-18                            |
| 8   | Trenérka s ~40 klienty měsíčně by měla tarif Pro. **Jaký podíl Solo/Pro** máme počítat v unit economics?                                                           | Mění ARPU a bod zvratu.                                                                           | Náklady, Lean Canvas            |
| 9   | **Rozpočet:** sazba a hodiny týmu podle Honzy. Počítá se cíl návratnosti 6 měsíců včetně práce týmu?                                                               | P2                                                                                                | Náklady                         |
| 10  | **Podle čeho trenér pozná, že mu TrainLoop pomáhá?** (méně opakovaného vysvětlování, méně zpráv na WhatsAppu…)                                                     | Trenérka od klientů nic nevyžaduje (Z7), dnešní metrika retence na to nesedí.                     | Lean Canvas: Key Metrics, UVP   |
| 11  | Jak **klientům usnadnit vložení odkazu na video** (návod, doporučená služba)?                                                                                      | Dnes posílají video přímo do WhatsAppu.                                                           | F-25                            |

---

## 10. Pořadí práce

- [x] Formátování dokumentů
- [x] Doplnit H7 a H8 do [vysledky.md](rozhovor/vysledky.md)
- [x] Lean Canvas 1.3 (`.md` i `.docx`)
- [x] Feature breakdown (`.xlsx`) podle sekce 5
- [x] Sitemapa (`.md` i `.svg`)
- [x] Označit zodpovězené otázky v `otazky-na-klienta.md`, založit `otazky-fb2.md`
- [x] Commit a PR
- [ ] Wireframy ve Figmě: úklid a body 1–3 ze sekce 6 (zbytek podle času). Mimo tento PR, řeší tým přímo ve Figmě.
- [ ] Nákladová struktura po konzultaci s Honzou
