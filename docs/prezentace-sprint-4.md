# Scénář Sprint Review 4 (9 minut) – TrainLoop

Scénář a tahák pro živou prezentaci 23. 11. 2026. Ukazuje jen to, co je nasazené na stagingu (`main`, commit `92bcbbc`, deploy 23. 11. 12:41).

**Hlavní linka:** jeden celý oběh spolupráce psovoda a trenéra nad jedním tréninkem. Psovod trénuje a zapíše záznam, trenér reaguje a upraví plán, psovod novinku hned najde. Ostatní funkce sprintu ukazujeme po cestě, ne zvlášť.

---

## Časový plán

| Čas       | Blok                                           | Kdo                                       |
| --------- | ---------------------------------------------- | ----------------------------------------- |
| 0:00–0:40 | Úvod: cíl sprintu a co jsme slyšeli minule     | 1 člověk                                  |
| 0:40–6:40 | Živé demo: jeden oběh psovod → trenér → psovod | 2 lidi (jeden kliká, druhý mluví)         |
| 6:40–7:40 | Reakce na feedback ze sprintu 3                | stejní dva, pokračují v otevřených oknech |
| 7:40–8:20 | Jak hlídáme kvalitu                            | 1 člověk                                  |
| 8:20–9:00 | Co zbývá, dotazy                               | 1 člověk                                  |

Rezerva je v bloku 6:40–7:40. Když demo uteče, zkraťte ho na dvě věty a jeden dialog.

---

## Příprava

### Hotovo 23. 11. (zkouška na stagingu, nic se neuložilo)

- [x] **E-mailová upozornění vypnutá u psovoda i trenéra.** Staging posílá skutečné e-maily a seed adresy můžou patřit reálným lidem. V demu přepínač jen ukážeme a **nezapínáme** ho.
- [x] **Rex má na Dnes „Dnešní trénink“:** trénink 2/4 „Prodloužení vzdálenosti“, 6 kroků. Zkouška ho nespotřebovala, posun kroků v průchodu se na server neukládá.
- [x] **Na Dnes psovoda nejsou žádné „Nové odpovědi“.** V kroku 5 se tak ukážou jen ty, které vzniknou v demu.
- [x] Prošly všechny kroky dema až před uložení: klikr a počítadlo, obrazovka Odcvičeno! se všemi okolnostmi a polem pro video, přehled trenéra s panelem psa, Upravit plán, Tvorba tréninku, dialog poznámky, dialog ukončení spolupráce, archivace psa, přesun tréninku a tlačítko Google na přihlášení.

### Zbývá udělat vám (~5 min)

1. **Dvě okna vedle sebe** na `https://team-5.vsepractical.applifting.dev`:
   - **Psovod** v běžném okně, mobilní zobrazení 390 px (F12 → device toolbar).
   - **Trenér** v anonymním okně, **desktop na celou šířku**. Je to zároveň ukázka desktopového redesignu (#174).
2. Mít otevřený [tahák](#tahák) a vkládat z něj (Ctrl+V), nic nepsat ručně.

### Na co si dát pozor

- **Na Dnes je Rex dnes dvakrát:** jeden trénink „Prodloužení vzdálenosti“ je už hotový (odcvičený 22. 11. večer), druhý čeká. Dnes nabízí ten čekající, Týden ukazuje oba. Nevadí to, jen to nekomentujte.
- **Ostrý průběh jde jen jednou.** Uložením záznamu v kroku 2 se dnešní trénink Rexe spotřebuje. Druhý pokus by musel jít přes Baryka.
- **V Týdnu přesouvejte Barykův trénink (st 25. 11.), ne Rexův dnešní**, a vždy dejte **Zrušit**. Jinak dnešní trénink z Dnes zmizí.
- **Časy v hlavičce záznamu mají sekundy** (např. „22. 11. 2026 23:35:07“). Je to otevřený bod #255, neupozorňujte na to.
- V poznámkách klienta Jana už jsou **dvě připnuté poznámky**. Nová poznámka se proto objeví až pod nimi a připnutím vyskočí nahoru, což je dobrá ukázka připínání.

---

## 1. Úvod (0:00–0:40)

> „Minulý sprint jsme předělali vzhled. Tenhle sprint jsme řešili to hlavní, proč aplikace vznikla: **spolupráci psovoda a trenéra mezi lekcemi**. Ukážeme jeden celý oběh nad jedním tréninkem. Psovod trénuje a zapíše, jak to šlo. Trenér to uvidí, odpoví a rovnou upraví plán. Psovod novinku hned najde. Po cestě uvidíte i to, co jste nám minule vytkli: barevnost, červené potvrzení a date picker na mobilu.“

## 2. Živé demo (0:40–6:40)

| #   | Čas  | Okno            | Co udělat                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Co říct                                                                                                                                                                                                                                                                                                                                  |
| --- | ---- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | 40 s | Psovod, mobil   | **Dnes:** jen ukázat **„+“** (volný trénink mimo plán, nově i na mobilu) a ikonu **klikru** v hlavičce. **Začít trénink.** V liště průchodu ťuknout 3× na **Klikr**, ukázat počítadlo a vibrace. Rychle odklikat kroky.                                                                                                                                                                                                                                                                                                                                                             | „Psovod má v ruce mobil a vodítko. Klikr je přímo v průchodu tréninkem a samostatně na Dnes, nepotřebuje fyzický klikr ani jinou appku. Trenér ho nemá, je to nástroj psovoda. A když trénoval mimo plán, zapíše to přes plus.“ (#237, volný trénink)                                                                                    |
| 2   | 60 s | Psovod, mobil   | **Obrazovka Odcvičeno!** Úspěšnost a soustředění. **Okolnosti:** spánek _Dobře_, prostředí _Venku_, opakoval chyby _Ano_ → štítek **Čichal po zemi**. **Odkaz na video:** nejdřív vložit špatný odkaz → chyba u pole, pak správný. Vložit **poznámku**. **Uložit záznam.**                                                                                                                                                                                                                                                                                                          | „Trenérka se dřív musela doptávat, jak pes spal, kde trénoval a jakou chybu dělal. Teď to psovod odklikne za pár vteřin a je to volitelné. Video nenahráváme, stačí odkaz z YouTube nebo Disku, appka hlídá, že je to platný odkaz, a návod je přímo u pole.“ (#96, #78)                                                                 |
| 3   | 60 s | Trenér, desktop | **Přehled:** metriky, „Potřebuje pozornost“, heatmapa klient × den. Klik na řádek **Jan Novák** → panel psa vpravo (úspěšnost, průběh cílů, poslední záznam = ten právě uložený). V panelu **Odpovědět** → záznam: okolnosti se štítkem chyby a video **nad vláknem**. Vložit **odpověď** z taháku.                                                                                                                                                                                                                                                                                 | „Takhle vypadá ranní pohled trenéra na počítači. O novém záznamu mu přišel e-mail s odkazem rovnou sem a v Klientech má u Jana štítek nová odpověď. Okolnosti a video má nad konverzací, nemusí se na nic ptát.“ (#174, #84, #97, #96, #78)                                                                                              |
| 4   | 75 s | Trenér, desktop | Na záznamu **Upravit plán** → otevře se přehled cíle „Přivolání s rozptýlením“ (nahoře „Zpět na záznam“). Klik na trénink **„2 Prodloužení vzdálenosti“** → teprve teď **Tvorba tréninku** se 6 kroky. Ukázat, že **„Přivolání s rozptýlením“ už má tři odsazené dílčí kroky** (5 m, pachová stopa, 10 m v parku). Klik na **„Přivolání na 10 m v parku“**: v panelu **chybí** „Přidat dílčí krok“ → Zavřít. Klik na **„Přivolání s rozptýlením“ → Přidat dílčí krok** → vložit z taháku → **Přidat krok**. Ukázat nový řádek a **živý náhled vpravo**. **Hotovo, zpět na záznam.** | „Rozptýlení je pro Rexe moc velký skok, proto je rozdělené na kousky. Průchod projde nejdřív dílčí kroky a pak se vrátí k celku. Trenér po dnešním videu přidá ještě jeden mezikrok. Dílčí krok dál dělit nejde, model zůstává jednoduchý. Vpravo trenér vidí přesně to, co uvidí psovod.“ (#68, #67, #174)                              |
| 5   | 45 s | Psovod, mobil   | **Dnes → „Nové odpovědi“:** „Trenér změnil plán“ a „Nová zpráva“ se štítkem **nová odpověď**, **tečka u Týdne a Historie** ve spodní liště. Otevřít záznam → štítek zmizí. **Účet → E-mailová upozornění** (jen ukázat, je vypnuté, **nezapínat**).                                                                                                                                                                                                                                                                                                                                 | „Psovod nemusí nic hledat. Novou odpověď i změnu plánu vidí na Dnes, v Týdnu i v historii psa, tečka mu řekne, že něco čeká. E-mail dostane psovod, když mu trenér odpoví, a trenér o novém záznamu nebo zprávě klienta. Odkaz vede přímo na záznam, víc zpráv do hodiny přijde jako jeden souhrn a v Účtu se to dá vypnout.“ (#84, #97) |
| 6   | 40 s | Trenér, desktop | **Klienti → Jan Novák → Moje poznámky → Nová poznámka.** Týká se: _Rex_, vložit text, uložit, **připnout**. Otevřít **detail Rexe**: poznámka je tam taky.                                                                                                                                                                                                                                                                                                                                                                                                                          | „Trenér má desítky klientů a chodí k němu jednou za čas. Tady si píše, na co si u psa dát pozor. Je to soukromé, klient ani jiný trenér to nevidí, a to hlídá i API.“ (#236, #85)                                                                                                                                                        |
| 7   | 30 s | Trenér, desktop | Dole na detailu klienta **Ukončit spolupráci** → ukázat dialog → **Zrušit**.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | „Spolupráci ukončí trenér tady v detailu klienta, psovod v detailu psa, vždy s potvrzením. Trenér pak psa okamžitě nevidí, ani přes starý odkaz, ukáže se mu ‚K tomuto psovi už nemáte přístup‘. Psovodovi zůstane plán, tréninky, záznamy i odpovědi. Teď to rušíme, ať nepřijdeme o demo data.“ (#61, #85)                             |

**Dílčí kroky a validace jdou nejrychleji z taháku:** text vkládat Ctrl+V, nepsat ručně.

## 3. Reakce na feedback ze sprintu 3 (6:40–7:40)

Ukazovat v otevřených oknech, bez přepínání účtů.

| Co jsme slyšeli                                  | Co ukázat                                                                                                                            | Co říct                                                                                                                                                                                    |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| „Aplikace je hodně barevná.“                     | Psovod: Dnes a Týden. Hlavní barva je koňaková místo terakotové, tlumené barvy psů a stavů, odznak „Dnešní trénink“ je bílý.         | „Hlavní barva je teď koňaková místo terakotové a barvy psů i stavů jsme ztlumili. Psy pořád rozlišíte, ale nebojují o pozornost s tlačítky. Kontrast textu zůstal nad normou WCAG.“ (#256) |
| „Červené potvrzovací tlačítko není dobrý nápad.“ | Psovod: detail psa → **Archivovat psa** → dialog je neutrální → **Zrušit**. (Pro srovnání: smazání poznámky je červené.)             | „Červená je teď jen pro to, co nejde vrátit: smazání a ukončení spolupráce. Archivace psa nebo disciplíny se dá vrátit, proto je neutrální.“ (#256)                                        |
| „Na mobilu nefunguje date picker.“               | Psovod: Týden → **středa 25. 11.** → u **Barykova** tréninku **⋯ → Přesunout na jiný den** → výběr dne, **Jiný týden** → **Zrušit**. | „Všechny výběry data jsme prošli na mobilu: plánování, přesun, výběr týdne, narození psa i poznámky.“ (#254)                                                                               |
| (nové) Přihlášení na mobilu bez dalšího hesla    | Odhlásit psovoda → přihlašovací stránka → tlačítko **Pokračovat přes Google** (nekliknout, jen ukázat).                              | „Přibylo přihlášení a registrace přes Google. Apple zatím není.“ (#240, část)                                                                                                              |

## 4. Jak hlídáme kvalitu (7:40–8:20)

- **Oprávnění jsou v API, ne jen v UI.** Cizí uživatel dostane 404, takže se ani nedozví, že data existují. Každé pravidlo má backend test (#85).
- **Každá změna jde přes pull request do `dev`** se zeleným CI (lint, typy, testy, build, security audit) a review od někoho jiného než autora. Na staging jde jen release z `dev` do `main`.
- **Testování proti akceptačním kritériím:** každé AC v ticketu jsme ověřili v kódu i v běžící aplikaci (mobil 390 px, desktop 1024–1440 px, role psovoda i trenéra). Splněná kritéria jsou odškrtnutá v issue, nesplněná vrací ticket do In Progress.

## 5. Co zbývá a závěr (8:20–9:00)

- **Přihlášení přes Apple** (#240): Google funguje, Apple doděláme.
- **Čas tréninku bez sekund** (#255): souhrny a přehledy už ukazují minuty, ale časovač v průchodu je zpátky ve tvaru minuty:sekundy. Chceme s vámi potvrdit, jestli ho chcete takhle, nebo jen v minutách.
- **Paleta barev** (#256): prosíme o potvrzení nových tlumených barev.

> „Tohle je první sprint, kdy aplikace zvládá celý oběh mezi lekcemi bez WhatsAppu. Děkujeme, máte dotazy?“

---

# Tahák

## Účty (staging, základní seed)

```text
Psovod:  jan.novak@seznam.cz / password1   (Jan Novák, psi Rex a Baryk)
Trenér:  trener@trainloop.cz / password1   (Marek)
```

## Krok 2: záznam po tréninku (psovod)

Špatný odkaz (ukázat chybu u pole):

```text
ftp://video-z-treninku
```

Správný odkaz na video:

```text
https://youtu.be/f-A989FqyxI
```

Poznámka pro trenéra:

```text
Na 5 m s píšťalkou přiběhl pokaždé. Na 10 m v parku se dvakrát zastavil u pachové stopy a musela jsem ho přivolat znovu.
```

## Krok 3: odpověď trenéra

```text
Díky za video, je vidět, že na 10 m ho stopa ještě přetáhne. Přidal jsem do plánu mezikrok, kde stopa leží přímo mezi vámi. Zkuste ho zítra, než půjdete na plné rozptýlení.
```

## Krok 4: nový dílčí krok (Přivolání s rozptýlením → Přidat dílčí krok)

Přidá se na konec dílčích kroků, tedy za „Přivolání na 10 m v parku“ a před celek.

Název kroku:

```text
Přivolání na 10 m kolem pachové stopy
```

Instrukce:

```text
Polož stopu mezi sebe a psa. Zavolej jednou ve chvíli, kdy pes stopu teprve míjí, a při otočení hned odměň.
```

Hotovo, když…:

```text
Proběhne kolem stopy a přiběhne na první zavolání 4× z 5.
```

Délka (minuty): `4`

## Krok 6: soukromá poznámka trenéra (Týká se: Rex)

Název:

```text
Pachová stopa je největší rozptýlení
```

Text:

```text
Rex se v parku zasekává hlavně u stop, ne u psů. Na příští lekci začít přivolání u stopy na krátkou vzdálenost a odměňovat pamlskem s vůní.
```

## Pořadí kliknutí v jedné větě

Psovod: Dnes → Začít trénink → Klikr → kroky → Odcvičeno! (okolnosti, video, poznámka) → Uložit.
Trenér: Přehled → Jan Novák → Odpovědět → odpověď → Upravit plán → trénink 2 Prodloužení vzdálenosti → Přivolání s rozptýlením → Přidat dílčí krok → Hotovo, zpět na záznam.
Psovod: Dnes → Nové odpovědi → záznam → Účet (e-maily).
Trenér: Klienti → Jan Novák → Moje poznámky → připnout → Ukončit spolupráci → Zrušit.
