# Změny ve feature breakdownu po rozhovoru

Porovnání [feature-breakdown.xlsx](feature-breakdown.xlsx) před rozhovorem (commit `2d8ece1`) a po něm (main po PR #3). Zdroj: [výsledky rozhovoru](rozhovor/vysledky.md) (zjištění Z1–Z11) a [feedback PO](po-feedback.md).

## Změny z rozhovoru

### Změněné priority

| ID   | Feature                                | Před         | Po              | Proč                                   |
| ---- | -------------------------------------- | ------------ | --------------- | -------------------------------------- |
| F-27 | Graf vývoje úspěšnosti                 | Nice to have | **Mimo rozsah** | Úspěch se neměří číslem (H5)           |
| F-33 | Upozornění → **Štítek „nová odpověď“** | Nice to have | **MVP**         | Bez něj psovod odpověď trenéra nenajde |

### Nové features (všechny Nice to have)

- **F-44 Kontext k záznamu:** psovod vyplní okolnosti (spánek, opakuje se chyba), na které se trenérka jinak doptává.
- **F-45 Vlastní psi trenéra:** respondentka má 3 psy a papírový deník na každého.
- **F-46 E-mailová upozornění:** oddělené z F-33.

### Upravený obsah (priorita beze změny)

- **F-12 Plán → Cíl a plán tréninku:** plán začíná principem a tím, na co si dát pozor. Cílem může být dlouhodobý cíl i drobný trik (FB1).
- **F-13 Cviky:** každý cvik má instrukci a kritérium zvládnutí („sedí, i když letí míčky“).
- **F-14 Posun a návrat:** o posunu rozhoduje člověk podle chování psa, ne procento.
- **F-15 Větvení:** zůstává MVP, ale jen v jednoduché podobě: rozdělení kroku na dílčí kroky s návratem do hlavní cesty.
- **F-24 Odeslání tréninku:** k % úspěšnosti přibylo rychlé hodnocení (soustředění, opakované chyby).
- **F-26 Historie:** zdůrazněná hodnota pro psovoda, který se k videím vrací.
- **F-30 Komentáře:** vlákno pod konkrétním tréninkem, unese dialog i doptávání.
- **F-32 Čeká na reakci:** fronta dotazů, ne kontrola plnění. Trenérka od klientů nic nevyžaduje.
- **F-23:** zúženo na zanedbané disciplíny, přeskočení tréninku se přesunulo do F-21.

## Změny z FB1 a upraveného plánu

- **F-21 Přesun mezi dny → Přesunout, nebo přeskočit trénink:** vzor Runna.
- **F-20:** popis podle Runny, kdo vybírá dny zůstává otevřené na FB 2.
- **19 řádků z „Navrženo“ na „Odsouhlaseno“**, protože o nich rozhodl upravený plán nebo PO ve FB1 (např. F-01, F-08, F-09, F-16, F-19, F-25, F-28, F-34, F-35, F-40).
- Pět features má zdroj nově „Rozhovor“, tři nově „Klient“.
- MVP řádky jsou podbarvené.

## Změny po FB2

PO na FB2 potvrdil model z [Lean Canvasu 1.4](lean-canvas.md): psovod může aplikaci používat i sám, zve vždycky trenér.

- **F-01 Registrace:** psovod se registruje i bez pozvánky. Odsouhlaseno na FB2.
- **F-08, F-09:** pozvánka je nabídka placené podpory mezi lekcemi. Přijmout jde i v existujícím účtu.
- **F-11 Psovod pozve trenéra:** z Nice to have do **Mimo rozsah**. Zve vždycky trenér, psovod může aplikaci používat i sám.
- **F-12 až F-15, F-17:** role „Trenér, psovod“. Psovod si plán skládá i sám.
- **F-20, F-24:** vlastní cíl si psovod naplánuje sám, záznam bez trenéra se uloží do deníku.
- **F-35:** ceník za aktivního klienta (3 zdarma, 49 Kč za dalšího, strop 1 490 Kč), návrh týmu. Platby dál mimo rozsah.
- **Nová F-47 Poznámky z lekce a semináře** (MVP, odsouhlaseno na FB2, epic _Pes a disciplíny_) a **nová F-48 Odesílání e-mailů** (MVP, technický základ, chyběla pro F-02 a F-08).

## Čísla

|                 | Před | Po  | Po FB2 |
| --------------- | ---- | --- | ------ |
| Features celkem | 43   | 46  | 48     |
| MVP             | 32   | 33  | 35     |
| Nice to have    | 7    | 8   | 7      |
| Mimo rozsah     | 4    | 5   | 6      |

Žádná feature nevypadla. Rozhovor rozsah MVP prakticky nezměnil, posunul hlavně obsah features: princip, kritérium a kvalitativní hodnocení vedle čísla. Větší škrty (větvení do Nice to have, konec %, šablony do MVP) jsou jen jako alternativní návrhy u [otevřených otázek na PO](otazky-na-po.md).
