# Otázky na FB2 a co ještě nevíme

**Projekt:** TrainLoop · **Tým 5** · připraveno 9. 10. 2026 po rozhovoru s trenérkou a FB1
**Podklady:** [plán úprav](plan-uprav-po-fb1.md) · [výsledky rozhovoru](rozhovor/vysledky.md) · [feedback PO z FB1](po-feedback-fb1.md) · [feature-breakdown.xlsx](feature-breakdown.xlsx)

Ptáme se jen na věci, které nerozhoduje [upravený plán](upravenyPlan.md). U každé otázky máme připravený návrh týmu.

---

## Co ještě nevíme

- **Pohled klientů máme jen zprostředkovaně.** Mluvili jsme s jedinou trenérkou. Hlavní problém (klienti si nezapamatují zadání) je její pozorování, psovoda jsme se zatím nezeptali.
- **Disciplíny z briefu jsme neověřili.** Respondentka se věnuje pasení a dogfrisbee, canicross ani nosework v rozhovoru nezazněly.
- **Nevíme, jak zachytit úspěch tréninku.** Trenérka hodnotí kvalitativně (soustředění, opakované chyby), ne číslem. Upravený plán chce %, ale nevíme, jak ho psovod má určit.
- **Nevíme, kdo skládá týden.** Klienti chodí cca 1× měsíčně a dostanou „hromadu úkolů“. Není jasné, jestli tréninky do dnů zařadí trenér, nebo si je rozvrhne psovod.
- **Nemáme podklady pro rozpočet.** Chybí sazba a hodiny týmu (konzultace s Honzou) a tím i bod zvratu.
- **Nevíme, jak trenér pozná, že mu aplikace pomáhá.** Kontrolu plnění od klientů nevyžaduje, takže metriky postavené na počtu zápisů nemusí sedět.

---

## 🔴 Priorita 1: ovlivňují datový model a hlavní obrazovky

### 1. Podoba větvení plánu (F-15)

- **Otázka na PO:** Ukážeme návrh větvení jako rozdělení kroku, který pes nechápe, na dílčí kroky s návratem do hlavní cesty. Pokrývá to, co potřebujete?
- **Proč se ptáme:** Takhle to popsala trenérka („nejdřív kousky, pak celek“) a sedí to na pokyn z FB1 nepřekombinovat datový model.
- **Návrh týmu:** V *Tvorbě tréninku* jde u bloku zvolit „Rozdělit na dílčí kroky“. Dílčí kroky se odsadí pod původní blok a po jejich zvládnutí plán pokračuje dalším blokem hlavní cesty.

### 2. Kdo zařazuje tréninky do dnů (F-20)

- **Otázka na PO:** Rozvrhne tréninky do dnů trenér při plánování, nebo si je psovod zařadí sám podle svého týdne?
- **Proč se ptáme:** Klienti chodí na lekci cca 1× měsíčně a dostanou víc úkolů najednou.
- **Návrh týmu:** Trenér zadá, kolikrát týdně a v jakém období se má cvičit, a navrhne dny. Psovod si je pak v Týdnu přesune podle sebe (F-21).

### 3. Jak má psovod určit % úspěšnosti (F-24)

- **Otázka na PO:** Zadává psovod % za každý cvik, nebo za celý trénink? Podle čeho ho má určit?
- **Proč se ptáme:** Trenérka úspěch měří kvalitativně: soustředění, opakované chyby, zbrklost (H5 podpořena).
- **Návrh týmu:** % za celý trénink (posuvník po 10 %) a k němu dvě rychlá hodnocení *soustředění* a *opakované chyby* (ano / částečně / ne) a poznámka.

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

### 6. Vlastní psi trenéra (F-45)

- **Otázka na PO:** Má trenér vést v aplikaci i své vlastní psy?
- **Proč se ptáme:** Respondentka má 3 psy a pro každého psa a sport vede papírový deník.
- **Návrh týmu:** Nice to have. Technicky jde jen o to, aby trenér mohl být zároveň psovodem.

### 7. Šablony plánů (F-18)

- **Otázka na PO:** Dávají trenéři podobné plány více klientům?
- **Proč se ptáme:** Rozhoduje to o prioritě kopírování plánu a šablon.
- **Návrh týmu:** Nice to have, pokud ano.

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

### 12. Rozhovor s psovodem

- **Otázka na PO:** Můžete nám domluvit rozhovor s klientem některého trenéra?
- **Proč se ptáme:** Hlavní problém máme zatím jen z pohledu trenérky.
- **Návrh týmu:** 30minutový rozhovor podle upraveného scénáře, zaměřený na to, jak klient pracuje se zadáním doma.
