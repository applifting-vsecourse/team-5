# Otázky na FB2 a co ještě nevíme

**Projekt:** TrainLoop · **Tým 5** · připraveno 9. 10. 2026 po rozhovoru s trenérkou a FB1
**Podklady:** [plán úprav](plan-uprav-po-fb1.md) · [výsledky rozhovoru](rozhovor/vysledky.md) · [feedback PO z FB1](po-feedback-fb1.md) · [feature-breakdown.xlsx](feature-breakdown.xlsx)

U každé otázky máme připravený návrh týmu. Otázka 0 a **alternativní návrhy** u otázek 1, 3, 5 a 7 se týkají věcí, které už rozhodl [upravený plán](upravenyPlan.md) nebo PO ve FB1. V breakdownu je proto neměníme a necháváme je na rozhodnutí PO.

---

## Co ještě nevíme

- **Pohled klientů známe zprostředkovaně.** Hlavní problém (klienti si nezapamatují zadání) vychází z pozorování trenérky.
- **Disciplíny z briefu jsme neověřili.** Respondentka se věnuje pasení a dogfrisbee, canicross ani nosework v rozhovoru nezazněly.
- **Nevíme, jak zachytit úspěch tréninku.** Trenérka hodnotí kvalitativně (soustředění, opakované chyby), ne číslem. Upravený plán chce %, ale nevíme, jak ho psovod má určit.
- **Nevíme, kdo skládá týden.** Klienti chodí cca 1× měsíčně a dostanou „hromadu úkolů“. Není jasné, jestli tréninky do dnů zařadí trenér, nebo si je rozvrhne psovod.
- **Nemáme podklady pro rozpočet.** Chybí sazba a hodiny týmu (konzultace s Honzou) a tím i bod zvratu.
- **Nevíme, jak trenér pozná, že mu aplikace pomáhá.** Kontrolu plnění od klientů nevyžaduje, takže metriky postavené na počtu zápisů nemusí sedět.

---

## 🔴 Priorita 1: ovlivňují datový model a hlavní obrazovky

### 0. Kdo aplikaci používá první a za co trenér platí ([Lean Canvas 1.3](lean-canvas.md) vs. [varianta B](lean-canvas-varianta-b.md))

- **Otázka na PO:** Má aplikace začínat u trenéra, který pozve klienty (dnešní model), nebo u psovoda jako jeho deník, do kterého pak přivede trenéra?
- **Z rozhovoru:** Trenérka problém necítí (WhatsApp jí stačí, od klientů nic nevyžaduje), psaní zadání by pro ni byla práce navíc. Bolest nese klient. Respondentka sama vede papírový deník pro každého psa a sport.
- **Ve FB1 rozhodnuto:** Platí výhradně trenér, psovod je zdarma na pozvánku od trenéra ([po-feedback-fb1.md](po-feedback-fb1.md)). Varianta B ponechává platícího trenéra, ale psovod by začal i bez pozvánky. Ptáme se, jestli to rozhodnutí po rozhovoru platí dál.
- **Návrh týmu:** Probrat obě varianty. Ve variantě B by do MVP přibyly vlastní poznámky psovoda a pozvánka od trenéra by přestala být podmínkou. Otázka jde první, protože na ní závisí otázky 2, 5 a 8.

### 1. Podoba větvení plánu (F-15)

- **Otázka na PO:** Ukážeme návrh větvení jako rozdělení kroku, který pes nechápe, na dílčí kroky s návratem do hlavní cesty. Pokrývá to, co potřebujete?
- **Proč se ptáme:** Takhle to popsala trenérka („nejdřív kousky, pak celek“) a sedí to na pokyn z FB1 nepřekombinovat datový model.
- **Návrh týmu:** V _Tvorbě tréninku_ jde u bloku zvolit „Rozdělit na dílčí kroky“. Dílčí kroky se odsadí pod původní blok a po jejich zvládnutí plán pokračuje dalším blokem hlavní cesty.
- **Alternativní návrh:** Větvení (F-15) do Nice to have. V MVP by stačily dílčí kroky, návrat o krok a mezikrok (F-13, F-14). Trenérka s přehledem o krocích problém nemá (H2 oslabena).

### 2. Kdo zařazuje tréninky do dnů (F-20)

- **Otázka na PO:** Rozvrhne tréninky do dnů trenér při plánování, nebo si je psovod zařadí sám podle svého týdne?
- **Proč se ptáme:** Klienti chodí na lekci cca 1× měsíčně a dostanou víc úkolů najednou.
- **Návrh týmu:** Trenér zadá, kolikrát týdně a v jakém období se má cvičit, a navrhne dny. Psovod si je pak v Týdnu přesune podle sebe (F-21).

### 3. Jak má psovod určit % úspěšnosti (F-24)

- **Otázka na PO:** Zadává psovod % za každý cvik, nebo za celý trénink? Podle čeho ho má určit?
- **Proč se ptáme:** Trenérka úspěch měří kvalitativně: soustředění, opakované chyby, zbrklost (H5 podpořena).
- **Návrh týmu:** % za celý trénink (posuvník po 10 %) a k němu dvě rychlá hodnocení _soustředění_ a _opakované chyby_ (ano / částečně / ne) a poznámka.
- **Alternativní návrh:** % úspěšnosti z MVP vypustit (upravený plán, bod 4D). Místo něj hodnocení slovy _Šlo / Částečně / Nešlo_, štítky toho, co nefungovalo (opakuje stejnou chybu, zbrklý, nesoustředěný), a poznámka. Zápis volitelný, trenérka zápisy od klientů nevyžaduje.

### 4. Co se stane s přeskočeným tréninkem (F-21, F-14)

- **Otázka na PO:** Když psovod trénink přeskočí, vrací se jeho cviky do plánu, nebo se prostě vynechají? Má to trenér vidět?
- **Proč se ptáme:** Vzor Runna z FB1 známe, dopad na plán ne.
- **Návrh týmu:** Přeskočený trénink zůstane v Týdnu označený jako „přeskočeno“ a plán se neposouvá. Trenér to vidí v Aktivitách psa.

---

## 🟡 Priorita 2: spolupráce trenér–psovod

### 5. Upozornění na odpověď trenéra (F-33, F-46)

- **Otázka na PO:** Stačí, když psovod uvidí odpověď trenéra v aplikaci, nebo potřebuje upozornění i mimo ni (e-mail, push), aby TrainLoop nahradil WhatsApp?
- **Proč se ptáme:** WhatsApp psovoda na odpověď upozorní sám. Když se do aplikace nevrátí, odpověď nenajde.
- **Návrh týmu:** V MVP štítek „nová odpověď“ v aplikaci, e-mail jako nice to have.
- **Alternativní návrh:** E-mail trenérovi o novém dotazu (F-46) do MVP. Trenér, který aplikaci zrovna nemá otevřenou, by jinak dotaz neviděl a klienti by zůstali u WhatsAppu.

### 6. Vlastní psi trenéra (F-45)

- **Otázka na PO:** Má trenér vést v aplikaci i své vlastní psy?
- **Proč se ptáme:** Respondentka má 3 psy a pro každého psa a sport vede papírový deník.
- **Návrh týmu:** Nice to have. Technicky jde jen o to, aby trenér mohl být zároveň psovodem.

### 7. Šablony plánů (F-18)

- **Otázka na PO:** Dávají trenéři podobné plány více klientům?
- **Proč se ptáme:** Rozhoduje to o prioritě kopírování plánu a šablon.
- **Návrh týmu:** Nice to have, pokud ano.
- **Alternativní návrh:** Šablony (F-18) do MVP. Trenérka má ~40 klientů měsíčně a zadání dnes nepíše vůbec, zapsat ho po lekci ji smí stát jen pár minut.

---

## 🟢 Priorita 3: byznys, validace a doplňky

### 8. Podíl tarifů Solo a Pro

- **Otázka na PO:** Trenérka s ~40 klienty měsíčně by měla tarif Pro. Jaký podíl Solo/Pro máme počítat?
- **Proč se ptáme:** Mění to průměrný příjem na trenéra a bod zvratu (dnes 70 % Solo / 30 % Pro).
- **Návrh týmu:** Přepočítat i variantu 50/50 a ukázat obě.

### 9. Rozpočet a návratnost

- **Otázka na PO:** Počítá se cíl návratnosti do 6 měsíců včetně práce týmu? Výsledek konzultace s Honzou doplníme.
- **Proč se ptáme:** FB1, bod 1.
- **Návrh týmu:** Práci týmu vést jako jednorázovou investici a bod zvratu počítat zvlášť pro provoz a zvlášť včetně investice.

### 10. Podle čeho trenér pozná, že mu TrainLoop pomáhá

- **Otázka na PO:** Co by pro trenéra znamenalo, že aplikace funguje? Méně opakovaného vysvětlování, méně zpráv na WhatsAppu, lepší připravenost klientů na lekci?
- **Proč se ptáme:** Trenérka od klientů kontrolu nevyžaduje (Z7). Podle odpovědi upravíme metriky v Lean Canvasu.
- **Návrh týmu:** Sledovat, kolik klientů mezi lekcemi otevře zadání, a podíl dotazů a videí poslaných přes TrainLoop.

### 11. Usnadnění odkazu na video (F-25)

- **Otázka na PO:** Jak klientům co nejvíc usnadnit vložení odkazu na video?
- **Proč se ptáme:** Dnes klienti posílají video přímo do WhatsAppu.
- **Návrh týmu:** Krátký návod u pole (YouTube neveřejné video, Google Disk) a náhled videa po vložení odkazu.
