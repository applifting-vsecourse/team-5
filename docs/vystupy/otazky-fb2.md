# Otázky na FB 2 (druhé kolo feature breakdownu s PO)

**Projekt:** TrainLoop · **Tým 5**
**Kontext:** Po [rozhovoru s trenérkou](zjisteni-rozhovor-1.md) jsme upravili [Lean Canvas](lean-canvas.md) a [feature breakdown](feature-breakdown.xlsx). Změny priorit jsou ve sloupci J breakdownu a všechny čekají na potvrzení PO.
**Cíl schůzky:** Odsouhlasit posun jádra MVP, uzavřít otázky, které z rozhovoru vyplynuly, a domluvit, co ještě ověříme u uživatelů.

> Stejná pravidla jako minule: u každé otázky máme návrh, ptáme se na potřeby a důsledky, ne na podobu obrazovek. Procházíme od priority 1 dolů.

---

## Co zatím nevíme

Jeden rozhovor s jednou trenérkou nestačí. Tyhle věci zatím stojí na předpokladu:

| Nevíme | Proč na tom záleží | Jak to zjistit |
| --- | --- | --- |
| **Bude trenér zadání skutečně psát?** Dnes ho předává jen ústně. | Bez zadání od trenéra nemá klient co otevřít a celý produkt padá. | Otázka 2 na PO. Test: trenérka na 2–3 lekcích vyplní papírovou šablonu zadání, změříme čas. |
| **Zaplatí trenér za problém, který nese hlavně klient?** | Trenér je jediný platící zákazník (Lean Canvas). H8 nezazněla. | Otázka 5 na PO, pak cenová otázka u 2–3 trenérů z okolí PO. |
| **Jak to vidí klienti sami?** O klientech víme jen z pohledu trenérky. | Jádro MVP (ztráta zadání) stojí na jejím pozorování. | Rozhovor se 2–3 klienty, viz otázky níže. |
| **Pracují tak i ostatní trenéři?** Respondentka dělá pasení ovcí, PO canicross, nosework a poslušnost. | Strukturu zadání (princip → kroky → kritérium) nechceme stavět na jednom stylu. | Otázka 1 na PO, druhý rozhovor s trenérem jiné disciplíny. |
| **Jak často se klienti doptávají „jak bylo tohle?“** | Říká, kolik práce trenérovi ušetříme. Zatím víme jen „hodně často“. | Požádat trenérku o počet takových zpráv za poslední týden. |
| **Kde klient zadání otevře?** Na place, doma před tréninkem, nebo vůbec? | Rozhoduje o tom, jak má vypadat Průchod tréninkem (F-43) a jestli potřebujeme offline. | Rozhovor s klienty. |
| **Vymění trenér WhatsApp za vlákno v aplikaci?** | Jinak jsou F-30, F-32 a F-33 zbytečné. | Otázka 7 na PO. |

---

## 🔴 Priorita 1: Jádro MVP

### 0. Kdo aplikaci používá první a za co trenér platí (Lean Canvas 1.3 vs. [varianta B](lean-canvas-varianta-b.md))
* **Otázka na PO:** Má aplikace začínat u trenéra, který pozve klienty (dnešní model), nebo u psovoda jako jeho deník, do kterého pak přivede trenéra?
* **Z rozhovoru:** Trenérka problém necítí (WhatsApp jí stačí, od klientů nic nevyžaduje), psaní zadání by pro ni byla práce navíc. Bolest nese klient. Respondentka sama vede papírový deník pro každého psa a sport.
* **Doptání:** Vedete si jako psovodka poznámky k tréninku? Používala byste deník v telefonu i bez trenérky? Zaplatila by Vaše trenérka za to, že může prodávat podporu mezi lekcemi?
* **Ve FB1 rozhodnuto:** Platí výhradně trenér, psovod je zdarma na pozvánku od trenéra ([po-feedback-fb1.md](po-feedback-fb1.md)). Varianta B ponechává platícího trenéra, ale psovod by začal i bez pozvánky. Ptáme se, jestli to rozhodnutí po rozhovoru platí dál.
* **Návrh týmu:** Probrat obě varianty. Rozhodnutí mění MVP: ve variantě B jdou vlastní poznámky psovoda (F-46) do MVP a pozvánka od trenéra přestává být podmínkou. Tahle otázka jde první, protože na ní závisí otázky 1, 2 a 5.

### 1. Posun jádra: od plánování k zadání z lekce (F-12, F-13, F-47, Lean Canvas)
* **Otázka na PO:** Souhlasíte, aby MVP stálo na tom, že klient má zadání z lekce v telefonu, místo na tom, jak trenér plán skládá a měří?
* **Z rozhovoru:** Klienti si z ústního zadání zapíšou jen část a doma *„vůbec neví, která bije“*. Kombinace disciplín ani změny postupu trenérce problém nedělají (H1, H2 oslabeny).
* **Doptání:** Dáváte svým trenérkám zadání taky ústně? Co si z lekce zapisujete vy? Funguje u canicrossu a noseworku stejná struktura: princip → kroky → kritérium zvládnutí?
* **Návrh týmu:** Zadání z lekce (F-12) s dílčími kroky a kritériem (F-13), na detailu psa jako aktuální zadání (F-47). Lean Canvas verze 1.3 už s tím počítá.

### 2. Kdo zadání píše a kolik času to smí stát (F-12, F-16, F-18)
* **Otázka na PO:** Kdo má zadání do aplikace zapsat a kdy?
* **Z rozhovoru:** Trenérka má ~40 klientů měsíčně a dnes nic nepíše. Klienti si poznámky dělají sami.
* **Doptání:** Má trenér čas zapsat zadání hned po lekci? Kolik minut je maximum? Jsou cviky u různých klientů natolik podobné, aby šly brát ze šablony?
* **Možnosti:** (a) píše trenér ze šablon cviků, (b) píše klient a trenér jen potvrdí, (c) trenér nadiktuje a klient přepíše.
* **Návrh týmu:** (a) se šablonami (F-18, zvednuto na MVP) a s vlastní poznámkou klienta. Zadání nesmí trenéra stát víc než pár minut. Pokud PO neví, ověříme papírovou šablonou na lekci.

### 3. Konec „% úspěšnosti“ (F-24, F-27, upravený plán bod 4D)
* **Otázka na PO:** Můžeme % úspěšnosti z MVP vypustit, i když je v upraveném plánu?
* **Z rozhovoru:** Pokrok se pozná podle toho, že se pes soustředí, neopakuje stejnou chybu a není zbrklý. Trenérka si to nezapisuje a od klientů zápisy nevyžaduje, progres vidí na lekci.
* **Doptání:** Potřebujete jako psovodka zapisovat každý trénink? K čemu byste zápis použila?
* **Návrh týmu:** Hodnocení slovy Šlo / Částečně / Nešlo, co nefungovalo (štítky: opakuje stejnou chybu, zbrklý, nesoustředěný) a poznámka. Zápis volitelný. Graf úspěšnosti (F-27) do Mimo rozsah.

### 4. Větvení cesty do Nice to have (F-15)
* **Otázka na PO:** Stačí v MVP dílčí kroky, návrat o krok a mezikrok, a větvení odložit?
* **Z rozhovoru:** Cvik se rozkouskuje, části se nacvičí zvlášť a pak spojí. Když pes nechápe, přidá se mezikrok. S přehledem o krocích problém nemá.
* **Návrh týmu:** Minulý FB říkal „nepřekombinovávat datový model“. Navrhujeme F-15 do Nice to have, F-14 (návrat a mezikrok) zůstává MVP.

### 5. Platí trenér, i když bolest nese klient? (Lean Canvas: Revenue, Customer Segments)
* **Otázka na PO:** Zaplatila by Vaše trenérka 490 Kč měsíčně za to, že klienti mají zadání v telefonu?
* **Z rozhovoru:** Trenérka problém pociťuje jen nepřímo, jako opakované doptávání. Ochota platit nezazněla. Má ~40 klientů, tarif Solo do 15 psů jí nestačí.
* **Doptání:** Platí trenérky dnes za nějaký nástroj? Kolik aktivních klientů má typická trenérka z Vašeho okolí?
* **Návrh týmu:** Ceny zatím neměnit, ale limit tarifu počítat podle aktivních klientů a ověřit u 2–3 trenérů. Na semestr nemá vliv (platby jsou Mimo rozsah).

---

## 🟡 Priorita 2: Tok mezi lekcemi

### 6. Týdenní kalendář pro klienta, který chodí 1× za měsíc (F-19, F-20, F-21)
* **Otázka na PO:** Kdo úkoly rozvrhuje do týdne a je kalendář v MVP potřeba?
* **Z rozhovoru:** Trenérka dny nezadává, klienti dostanou úkoly na měsíc a dělají si je „po svým“.
* **Návrh týmu:** Trenér zadá úkoly, psovod si je sám rozvrhne do týdne (F-20, role změněna na psovoda). Přesun a skip podle Runny platí. Pokud PO kalendář nepovažuje za jádro, MVP stačí aktuální zadání u psa (F-47) a kalendář posuneme do Nice to have.

### 7. WhatsApp, nebo vlákno v aplikaci? (F-30, F-32, F-33)
* **Otázka na PO:** Přestanou trenéři a klienti konzultovat přes WhatsApp, když bude dotaz možné poslat u úkolu?
* **Z rozhovoru:** Trenérce WhatsApp stačí a k videím se nevrací. Klienti ho aktivně používají.
* **Doptání:** Jak se o novém dotazu dozví trenér, který aplikaci zrovna nemá otevřenou?
* **Návrh týmu:** Dotaz u úkolu (F-30) a e-mail trenérovi o novém dotazu (F-33, zvednuto na MVP). Bez upozornění trenér dotaz neuvidí. Pokud PO čeká, že WhatsApp zůstane, zvážit F-30 až F-33 do Nice to have.

### 8. Okolnosti u dotazu (F-45, nové)
* **Otázka na PO:** Má aplikace u dotazu rovnou nabídnout okolnosti, na které se trenér stejně doptá?
* **Z rozhovoru:** U složitějšího dotazu se trenérka ptá, jak pes spal, jestli se to opakuje, jestli to udělal poprvé a jak se tvářil.
* **Návrh týmu:** Nice to have. Pár nepovinných štítků, aby to klienta neodradilo od dotazu.

### 9. Video: odkaz, nebo soubor, a video od trenéra (F-25, F-44)
* **Otázka na PO:** Stačí odkaz na video, když klienti dnes posílají videa z telefonu přes WhatsApp? A natáčí se na lekci ukázka, ke které se klient vrací?
* **Z rozhovoru:** Jako klientka se k videím vrací často, jako trenérka ne.
* **Návrh týmu:** V MVP dál jen odkaz (F-28 zůstává Mimo rozsah). Video ukázka u cviku (F-44) jako Nice to have.

---

## 🟢 Priorita 3: Rozsah uživatelů

### 10. Psovod bez trenéra v aplikaci (F-01, F-46)
* **Otázka na PO:** Má aplikaci používat i psovod, jehož trenér v ní není, třeba na poznámky ze seminářů?
* **Z rozhovoru:** Respondentka vede pro každého psa a sport papírový deník: poznámky ze seminářů a plán do budoucna. Od trenérů seminářů nedostane nic písemně.
* **Návrh týmu:** V MVP ne, platí „zve trenér“. Vlastní poznámky psovoda (F-46) jako Nice to have.

### 11. Disciplíny jako štítek (F-05)
* **Otázka na PO:** Potřebujeme disciplíny jako samostatnou strukturu, když jejich kombinace práci navíc nedělá?
* **Návrh týmu:** Ponechat jako štítek u zadání a barvu v kalendáři, nic složitějšího.

---

## Otázky pro další rozhovor (klient trenéra)

Chybí nám pohled klientů. Návrh na krátký rozhovor se 2–3 klienty respondentky nebo trenérek PO:

1. Vzpomeňte si na poslední lekci. Co jste si z ní odnesl(a) a jak?
2. Kdy jste naposledy doma nevěděl(a), co přesně cvičit? Co jste udělal(a)?
3. Kdy jste naposledy psal(a) trenérce? Co se stalo předtím a co potom?
4. Kde a kdy se k poznámkám nebo videím z lekce vracíte?
5. Co z lekce jste si nezapsal(a) a později vám chybělo?
6. Vedete si k tréninku vlastní poznámky? Kde a jak? (varianta B)
7. Platil(a) jste někdy trenérce za něco jiného než za samotnou lekci, třeba za konzultaci nebo videorozbor? (varianta B)
