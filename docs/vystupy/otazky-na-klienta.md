# Otázky na klienta (Product Owner – Veronika) seřazené podle důležitosti

**Projekt:** TrainLoop  
**Kontext:** Příprava na schůzku s PO k odsouhlasení Feature Breakdownu (Sprint 1)  
**Cíl schůzky:** Vyjasnit otevřené otázky z Feature Breakdownu, ověřit předpoklady týmu a dohodnout přesný rozsah MVP.

> **Doporučení pro vedení schůzky (podle metodiky kurzu):**  
> * Za klientem nejdeme s prázdnou – u každé otázky máme připravený návrh/předpoklad týmu.  
> * Ptáme se na potřeby, reálné situace a důsledky, ne na vzhled tlačítek či obrazovek.  
> * Čas schůzky je omezený – otázky procházíme striktně od Blokové priority 1 dolů.

---

## 🔴 Priorita 1: Kritické blokery pro MVP a jádrovou logiku
*Otázky, bez jejichž vyřešení nelze správně navrhnout datový model, wireframy ani zadat vývojové úlohy agentovi.*

### 1. Nelineární plán a rozvětvení cesty (Vazba na F-14, F-15)
* **Otázka na PO:** Jak přesně v praxi vypadá větvení plánu na konkrétním příkladu se Zoe?
* **Kontext & Doptání:**  
  * V briefu je uvedeno: *„podle toho, jak to psovi jde, se vracím o úkol zpátky, přeskakuju dopředu, nebo cíl rozdělím na dvě samostatné cesty.“*  
  * Když se cesta rozdělí (např. u pozornosti pes nezvládá rušivky, tak se přidá větev na práci s klidem), mají tyto cesty běžet paralelně vedle sebe, nebo se po zvládnutí mezikroku zase spojí zpět do hlavní linie?  
  * Kdo a jak rozhoduje o posunu na další krok – posouvá se čistě ručně (kliknutím), nebo se má vyhodnocovat automaticky z % úspěšnosti?  
  * Wireframe kreslí větvení na obrazovce „Tvorba tréninku“. Jde o plán na několik týdnů, nebo o jeden trénink, ve kterém si psovod vybere jednu z větví?
* **Zpětná vazba PO:** Zbytečně nepřekombinovávat datový model pro MVP; soustředit se na to, co trenér i psovod potřebují v základní fázi.

---

### 2. Oprávnění a správa plánu trenér vs. psovod (Vazba na F-01, F-16, F-38)
* **Otázka na PO:** Může mít pes v aplikaci více trenérů současně a jaká je hierarchie jejich pravomocí?
* **Kontext & Doptání:**  
  * Věnujete se canicrossu, noseworku a poslušnosti – vede Zoe jedna trenérka na vše, nebo má na každou disciplínu jiného trenéra?  
  * Pokud má pes více trenérů, smí trenér vidět a upravovat jen svou disciplínu, nebo celý plán psa?  
  * Může trenér přímo přepsat/smazat úkol, který si psovod sám vytvořil, nebo trenér své úkoly přidává odděleně? Co se stane, když trenér změní plán, o kterém psovod ještě neví?  
  * Ve wireframu sestavuje plán jen trenér (přes Klienti → pes klienta). Má plán upravovat i psovod? Může psovod aplikaci používat i bez trenéra?
* **Návrh / Předpoklad týmu:**  
  Pro MVP umožnit nasdílet psa více trenérům, přičemž trenér vidí všechny disciplíny. Předpokládáme, že plán může upravovat **psovod i trenér**. Toto je třeba s PO potvrdit. Trenérovy úpravy by měly být v plánu vizuálně odlišeny (např. štítek „Od trenéra“).

---

### 3. Metrika tréninku a význam „% úspěšnosti“ (Vazba na F-24)
* **Otázka na PO:** Co přesně v praxi vyjadřuje „% úspěšnosti“ u různých disciplín a musí být povinné?
* **Kontext & Doptání:**  
  * U poslušnosti dává smysl poměr (např. 7 úspěšných odložení z 10 pokusů = 70 %).  
  * Jak se ale procento počítá u noseworku (pes pach našel / nenašel – binární stav) nebo u canicrossu (uběhnuto 5 km v daném tempu)?  
  * Nemůže nutnost zadávat umělé procento psovody odrazovat od zápisu?  
  * Wireframe má na konci tréninku jen video a komentář. Pokud % ano, zadává se za každý cvik, nebo za celý trénink?
* **Návrh / Předpoklad týmu:**  
  Metrika by neměla být striktně jen číslo 0–100 %. Navrhujeme, aby psovod mohl zvolit buď **% úspěšnosti**, nebo jednoduchý stav (**Splněno / Částečně / Nesplněno**), a k tomu vždy textovou poznámku.

---

### 4. Cíl u tréninkového plánu (Vazba na F-12)
* **Otázka na PO:** Potřebuje trenér u plánu zadat i cíl, ke kterému plán vede?
* **Kontext & Doptání:**  
  * Ve wireframu trenér skládá rovnou trénink pro psa („Trénink pro Rexe“), cíl jako „5 km pod 5 min/km“ tam není.  
  * Pracují trenérky v praxi s cíli? Má cíl termín nebo měřitelné kritérium splnění?
* **Návrh / Předpoklad týmu & Vyjádření PO:**  
  **Rozhodnuto PO:** Plánovací modul musí zvládat jak komplexní dlouhodobé cíle (např. spolehlivá chůze u nohy), tak drobné triky (např. pac / dát ťapku). Cíl s názvem a disciplínou tedy v systému plní roli zastřešujícího rámce.

---

## 🟡 Priorita 2: Uživatelský tok a fungování týdenního kalendáře
*Otázky ovlivňující hlavní obrazovku (dashboard) a každodenní používání aplikace.*

### 5. Životní cyklus tréninku a neodcvičené úkoly (Vazba na F-20, F-21, F-23)
* **Otázka na PO:** Co se má v týdenním kalendáři stát s tréninkem, který psovod v daný den neodcvičil?
* **Kontext & Doptání:**  
  * Má úkol automaticky „přepadnout“ do dalšího dne, zůstat v minulém dni označený jako „neodcvičeno“, nebo se vrátit do zásobníku úkolů daného cíle?  
  * Může být stejný úkol naplánovaný v jednom týdnu vícekrát (např. 3× v týdnu krátký trénink očního kontaktu)?  
  * Kdo trénink do kalendáře zařadí – trenér hned po jeho složení, nebo psovod? Smí psovod trénink přesunout na jiný den?
* **Návrh / Předpoklad týmu & Vyjádření PO:**  
  **Rozhodnuto PO (inspirace aplikací *Runna*):** Uživatel vidí rozvrh v týdnech/dnech. Pokud trénink v daný den neproběhne, systém nabídne dvě jasné cesty:
  1. **Přesun tréninku** na jiný den nebo týden.
  2. **Přeskočení tréninku (Skip)** – trénink lze zcela přeskočit, aniž by vytvářel demotivující lavinu nedodělků.

---

### 6. Formát a workflow předávání videí (Vazba na F-25, F-28, F-30)
* **Otázka na PO:** Odkud dnes trenérky a psovodi berou odkazy na videa a co pro ně představuje nejmenší tření?
* **Kontext & Doptání:**  
  * Shodli jsme se, že do MVP nebudeme nahrávat těžké video soubory na náš server (F-28 je Mimo rozsah).  
  * Wireframe má na konci tréninku tlačítko „Nahrát video“ – stačí, když vloží odkaz?  
  * Jak dnes videa reálně sdílíte? Nahráváte na YouTube (neveřejné/unlisted), Google Disk, iCloud, nebo posíláte přes WhatsApp?  
  * Bude pro psovoda přirozené zkopírovat a vložit webový odkaz, nebo je potřeba počítat s tím, že video trenérovi pošle postaru na WhatsApp a v TrainLoopu bude jen odkaz na chat či časovou značku?
* **Návrh / Předpoklad týmu:**  
  Do záznamu tréninku dát pole pro externí URL (YouTube, Vimeo, Google Drive, OneDrive apod.) s validací a automatickým náhledem/přehrávačem u komentáře pro trenéra.

---

### 7. Forma aplikace pro pilotní provoz: Web vs. Nativní mobil (Vazba na F-40)
* **Otázka na PO:** Stačí pro studentský pilot responzivní webová aplikace optimalizovaná pro mobil (PWA), nebo je nezbytná nativní aplikace z App Store / Google Play?
* **Kontext & Doptání:**  
  * Psovod zapisuje trénink typicky venku na cvičáku nebo doma?  
  * Je kritické, aby aplikace fungovala offline (bez signálu), nebo zápis probíhá až po příchodu domů / v autě, kde je internet dostupný?
* **Návrh / Předpoklad týmu:**  
  **Rozhodnuto:** Pro pilotní provoz i MVP vyvíjíme **responzivní webovou aplikaci (optimalizovanou pro mobilní telefony / PWA)**, kterou si uživatel může přidat na plochu telefonu. Tím odpadají počáteční poplatky za vývojářské účty Apple a Google i prodlevy se schvalovacím procesem v obchodech. Mobilní použitelnost zajistí responzivní rozhraní přizpůsobené displejům telefonů.

---

## 🟢 Priorita 3: Spolupráce a komunikace trenér–psovod
*Otázky zpřesňující interakci a notifikace mezi oběma stranami.*

### 8. Onboarding a první propojení na cvičáku (Vazba na F-08, F-09)
* **Otázka na PO:** Jak přesně probíhá moment, kdy trenérka začne vést psa v TrainLoop? Kdo koho zve?
* **Kontext & Doptání:**  
  * Založí psa psovod a dá trenérce kód na hodině, nebo naopak trenérka pošle svým klientům pozvánku, aby si psa zaregistrovali pod její účet?  
  * Co se stane, když pozvaná trenérka ještě nemá v aplikaci účet?  
  * Zve trenér člověka, nebo rovnou konkrétního psa? Co když klient už účet má? Jak dlouho platí kód?
* **Návrh / Předpoklad týmu:**  
  **Rozhodnuto:** zve trenér, protože aplikaci platí. Trenér pošle klientovi e-mail nebo kód, klient se přes „Mám pozvánku“ zaregistruje a propojí (F-08, F-09). Obrácené flow (psovod zve trenéra) je *Nice to have* (F-11). Trenér zve člověka, klient po přijetí vybere nebo založí psa. Kód platí 7 dní.

---

### 9. Rychlost reakce trenéra a notifikace (Vazba na F-30, F-32, F-33)
* **Otázka na PO:** Jak trenérky v praxi pracují se zpětnou vazbou – vyžadují okamžitá upozornění?
* **Kontext & Doptání:**  
  * Prochází trenérka záznamy klientů nárazově (např. jednou týdně večer v bloku), nebo potřebuje vědět o každém záznamu ihned?  
  * Stačí v MVP notifikace uvnitř aplikace (přehled „Čeká na reakci“ + červený indikátor), nebo je nutné posílat e-mail při každém komentáři?  
  * Kde psovod uvidí odpověď trenéra na odeslaný trénink?
* **Návrh / Předpoklad týmu:**  
  Pro MVP plně postačuje interní obrazovka trenéra **„Čeká na reakci“ (F-32)** a in-app notifikace. E-mailová upozornění (F-33) ponechat jako *Nice to have*, aby se ušetřila kapacita na jádro aplikace. Odpověď trenéra je ve vlákně u odeslaného tréninku, psovodovi se v Týdnu ukáže štítek „nová odpověď“.

---

### 10. Navigace a výchozí obrazovka podle role (Vazba na F-01)
* **Otázka na PO:** Co má v aplikaci vidět psovod a co trenér?
* **Kontext & Doptání:**  
  * Wireframe má pro všechny stejnou spodní lištu: Psi · Týden · Klienti · Profil.  
  * Trénuje trenér i vlastní psy? Kterou obrazovku má kdo vidět po přihlášení?
* **Návrh / Předpoklad týmu:**  
  Psovod má Psi · Týden · Profil, trenér navíc Klienti. Trenér začíná na Klientech, psovod na Týdnu.

---

## ⚪ Priorita 4: Rozsah profilu psa a doplňková data
*Otázky pro upřesnění detailů a rozsahu dat.*

### 11. Více psů na účtu a detail profilu psa (Vazba na F-04, F-06)
* **Otázka na PO:** Je pro pilotní MVP nezbytné podporovat více psů na jednom účtu psovoda?
* **Kontext & Doptání:**  
  * Má většina vašich kolegů psovodů v aktivním tréninku jednoho psa, nebo běžně trénují 2–3 psy současně?  
  * Jaké údaje o psovi trenérka skutečně potřebuje kromě jména a plemene (např. datum narození, váha, zdravotní omezení)?
* **Návrh / Předpoklad týmu:**  
  **Rozhodnuto (dle sitemapy a F-06):** MVP plně podporuje **více psů na jednom účtu psovoda**, přesně jak ukazuje wireframe a sitemapa (přepínání psů a barevné proužky v týdenním kalendáři). V profilu psa stačí pro MVP: jméno, plemeno, fotka a volitelná poznámka / zdravotní omezení. Bezplatný tarif pro psovoda v rámci vedení trenérem umožňuje evidovat více psů bez omezení na 1 psa (celkový limit se odvíjí od trenérova předplatného).
