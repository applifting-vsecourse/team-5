# Manuální průchod release — přesný skript

Jdi **shora dolů**. U každého kroku udělej přesně to, co je napsané, podívej se na „Máš vidět“, zaškrtni `[x]`.  
Jednu fázi dokonči, teprve pak další. **Neproklikávej napříč** — ztratíš se.

|         |                                            |
| ------- | ------------------------------------------ |
| Lokálně | http://localhost:3050                      |
| Staging | https://team-5.vsepractical.applifting.dev |
| Mobil   | DevTools → **390 × 844**                   |
| Desktop | šířka **≥ 1280**                           |

**Okna:** nejdřív Jan (psovod), pak Marek (trenér) v druhém okně / Incognito, na konci oba najednou.

---

## Mapa (ať víš, kde jsi)

| Fáze | Kdo           | Viewport  | Co děláš              |
| ---- | ------------- | --------- | --------------------- |
| 0    | —             | —         | Zapneš appku          |
| 1    | —             | —         | Zkopíruješ loginy     |
| 2    | odhlášený     | libovolný | Login / signup UI     |
| 3    | **Jan**       | 390       | Celý psovod na mobilu |
| 4    | Jan           | ≥1280     | Totéž na desktopu     |
| 5    | **Marek**     | 390       | Celý trenér na mobilu |
| 6    | Marek         | ≥1280     | Trenér desktop        |
| 7    | Jan + Marek   | 390       | Odpovědi sem a tam    |
| 8    | —             | —         | Release checklist     |
| 9    | Petra / Tomáš | 390       | Rychlý smoke          |
| 10   | volitelně     | —         | Velký demo seed       |

**Když spěcháš (≈ 25 min):** 0 → 2.1–2.2 → 3.1–3.3 → 5.1–5.4 → 7 → 8.

---

## 0. Příprava

1. [ ] Běží frontend `:3050` a backend `:4050` (nebo otevři staging).
2. [ ] DB je naseedovaná (`pnpm backend seed` lokálně).
3. [ ] DevTools → zařízení **390 × 844**.
4. [ ] Jsi **odhlášený** (Incognito, nebo Účet → Odhlásit).

---

## 1. Účty (copy-paste)

```text
trener@trainloop.cz
password1
```

```text
jan.novak@seznam.cz
password1
```

```text
petra.svobodova@email.cz
password1
```

```text
tomas.dvorak@gmail.com
password1
```

```text
admin@example.com
adminpassword
```

| E-mail                     | Heslo       | Kdo          | Pes / klienti     |
| -------------------------- | ----------- | ------------ | ----------------- |
| `trener@trainloop.cz`      | `password1` | Trenér Marek | Jan, Petra, Tomáš |
| `jan.novak@seznam.cz`      | `password1` | Psovod Jan   | Rex, Baryk        |
| `petra.svobodova@email.cz` | `password1` | Petra        | Alík              |
| `tomas.dvorak@gmail.com`   | `password1` | Tomáš        | Lucky             |

---

## 2. Auth (odhlášený)

### 2.1 Login jako Jan

1. [ ] Otevři `/` — buď landing, nebo redirect na appku.
2. [ ] Jdi na `/login`.
3. [ ] **MáŠ vidět:** brand TrainLoop, e-mail, heslo, odkaz registrace, zapomenuté heslo. **Žádné** Google tlačítko.
4. [ ] Zkus špatné heslo → chyba, zůstaneš na loginu.
5. [ ] Přihlas: `jan.novak@seznam.cz` / `password1`.
6. [ ] **MáŠ vidět:** URL `/dashboard`, obrazovka **Dnes** (ne Přehled trenéra). Spodní lišta: Dnes · Týden · Psi · Historie · Účet.

### 2.2 Login jako trenér (jen ověření landing)

1. [ ] Účet → **Odhlásit**.
2. [ ] Přihlas: `trener@trainloop.cz` / `password1`.
3. [ ] **MáŠ vidět:** `/dashboard` = **Přehled** trenéra, lišta Přehled · Klienti · Historie · Účet. Ne Dnes psovoda.
4. [ ] Odhlásit znovu.

### 2.3 Signup / forgot (jen UI, účet nezakládej)

1. [ ] `/signup` — role, jméno, e-mail, heslo, souhlas; Google skryté.
2. [ ] `/forgot-password` — odešli e-mail; lokálně odkaz v konzoli backendu.
3. [ ] `/privacy` jde otevřít.
4. [ ] Zpět na `/login`.

---

## 3. Psovod Jan — mobil (390 × 844)

**Teď:** přihlas Jana (`jan.novak@seznam.cz` / `password1`).  
**Lišta:** Dnes · Týden · Psi · Historie · Účet.

### 3.1 Dnes

1. [ ] Klepni **Dnes** (nebo jsi už na `/dashboard`).
2. [ ] **MáŠ vidět:** jedna hero karta s barvou psa (ne „dashboard“ metrik uvnitř hero).
3. [ ] Hero: **dnešní** trénink, jinak **zmeškaný**, jinak **volno** — ne trénink až pozítří (ten je na kartě psa / Týdnu).
4. [ ] Metriky jsou **mimo** hero, vlastní karty.
5. [ ] Barva primary = cognac (ne fialová / default shadcn).

### 3.2 Týden

1. [ ] Lišta → **Týden** (`/week`).
2. [ ] **MáŠ vidět:** 7 dní, barvy psů.
3. [ ] Klepni den v day pickeru → focus na ten den.
4. [ ] Přesuň jeden **PLANNED** trénink na jiný den **nebo** ho přeskoč.
5. [ ] Zmeškaný PLANNED: chip **Zmeškaný** na kartě + **Zmeškané** u dne; v pásu dní jde poznat (ne jako volno).

### 3.3 Průchod tréninkem (dokonči jednu instanci)

Tohle vytvoří **dokončenou instanci** + záznam — potřebuješ to pro trenéra v 5.2 a 5.4.

1. [ ] Lišta → **Dnes**.
2. [ ] Klepni **Začít trénink** (vezmi Rex, pokud je volba).
3. [ ] **MáŠ vidět:** spodní lišta **zmizí**; kroky s kritérii; velká tlačítka.
4. [ ] Otevři klikr — nesmí shodit průchod.
5. [ ] Časovač ukazuje **mm:ss**.
6. [ ] Projdi kroky → **Dokončit** → obrazovka **Jak to šlo**.
7. [ ] Vyplň úspěšnost / soustředění / chyby; do poznámky:

```text
Rex reagoval na povely výborně. U odložení udržel klid napoprvé.
```

8. [ ] Ulož → oslava / hotovo → zpět do appky.
9. [ ] Lišta → **Historie** — nový záznam tam je.

> **Zapamatuj si:** tuhle dokončenou instanci **už nepůjde znovu „projít“** ani přepsat výsledek. To je správně. Upravovat půjde jen **plán** (kroky cíle) — to dělá trenér v 5.4.

### 3.4 Psi

1. [ ] Lišta → **Psi**.
2. [ ] **MáŠ vidět:** Rex + Baryk, správné barvy.
3. [ ] Otevři **Rex** → barva v headeru/kartě.
4. [ ] Sekce cílů — aktivní cíl, progress.
5. [ ] (Volitelně) soukromá poznámka u psa — trenér ji v 5.x **neuvidí**.

### 3.5 Historie

1. [ ] Lišta → **Historie**.
2. [ ] Otevři záznam z 3.3 → vlákno / detail.

### 3.6 Účet

1. [ ] Lišta → **Účet** — jméno Jan, e-mail.
2. [ ] **Zatím neodhlašuj**, pokud jdeš hned na fázi 4. Jinak odhlas až před fází 5.

---

## 4. Psovod Jan — desktop (≥ 1280)

Stále Jan. Rozšiř okno na ≥ 1280.

1. [ ] **Dnes** — week strip / „Tento týden“ + odkaz na celý týden.
2. [ ] Layout se nerozsype.
3. [ ] Psi → Rex → cíl → otevři trénink (Tvorba tréninku) — **desktop sloupce**, ne jen mobilní stack.
4. [ ] Přetáhni krok (DnD) — funguje; je klávesová nápověda.

Pak: Účet → **Odhlásit**. DevTools znovu **390 × 844**.

---

## 5. Trenér Marek — mobil (390 × 844)

**Teď:** `trener@trainloop.cz` / `password1`.  
**Lišta:** Přehled · Klienti · Historie · Účet.  
**Landing musí být Přehled** (`/dashboard`), ne Klienti.

### 5.1 Přehled

1. [ ] Jsi na `/dashboard` = Přehled (po loginu automaticky).
2. [ ] **MáŠ vidět:** heatmapu i na 390 (horiz. scroll OK), metriky, klienty.
3. [ ] Klepni klienta / psa → panel nebo detail.
4. [ ] Cognac na primárních akcích.

### 5.2 Klienti + odpověď na Janův záznam

1. [ ] Lišta → **Klienti**.
2. [ ] **MáŠ vidět:** Jan, Petra, Tomáš.
3. [ ] Klepni **Jan** → Rex (a Baryk).
4. [ ] Najdi **záznam z 3.3** (Historie u psa / aktivita / „čeká na odpověď“ z Přehledu).
5. [ ] Otevři záznam → do vlákna napiš:

```text
Dnes u odložení výborně. Příště zkuste kratší vzdálenost a pomalejší odchod.
```

6. [ ] Ulož odpověď.
7. [ ] (Volitelně) soukromá trenérská poznámka — jen ty ji vidíš.

### 5.3 Pozvánka

1. [ ] Klienti / Přehled → **Pozvat klienta** (nebo ekvivalent).
2. [ ] **MáŠ vidět:** nový kód má **8 znaků**; text mluví o 8místném kódu.
3. [ ] (Volitelně) druhé okno: signup / invite přijme i legacy 6 znaků, pokud máš starý kód.

### 5.4 Editor plánu (#68) — přesný postup

Nejdřív si ujasni tři věci (ať nečekáš, že půjde upravit hotový den):

| Pojem            | Co to je                                                  | Po dokončení                       |
| ---------------- | --------------------------------------------------------- | ---------------------------------- |
| **Instance**     | Jeden den v kalendáři / průchod, který Jan dokončil v 3.3 | **Zamčená historie** — neupravuješ |
| **Plán**         | Šablona tréninku u cíle (kroky v „Tvorbě tréninku“)       | **Zůstává editovatelná**           |
| **Uzavřený cíl** | Tlačítko „Označit cíl jako splněný“ / Archiv              | Teprve pak „Pouze ke čtení“        |

**Postup A — z dokončeného záznamu (hlavní #68):**

1. [ ] Zůstaň u Mareka. Otevři **dokončený záznam** Rexe (ten z 3.3 / 5.2).
2. [ ] Klepni **Upravit plán**.
3. [ ] **MáŠ vidět:** editor cíle / Tvorba tréninku. **Nesmí** být text „Tento cíl je uzavřený“ ani chip „Pouze ke čtení“.
4. [ ] Uprav jeden krok (název / kritérium / pořadí / sub-step) a ulož.
5. [ ] **Nesmí** spadnout 409 typu „Completed training content is read-only“.
6. [ ] Šipka **Zpět na cíl** → přehled tréninků **tohoto cíle** (seznam session, ne zase stejný editor).
7. [ ] Šipka **Zpět na cíle psa** → seznam cílů Rexe.  
       Když se točíš session ↔ cíl dokola, je to bug — zapiš URL + jestli v adrese zůstává `?session=`.

**Postup B — kontrast (uzavřený cíl):**

1. [ ] U aktivního cíle klepni **Označit cíl jako splněný**.
2. [ ] **Teprve teď** máš vidět „Tento cíl je uzavřený…“ / „Pouze ke čtení“.
3. [ ] Klepni **Vrátit mezi aktivní** — zase jde editovat.

### 5.5 Historie + účet

1. [ ] Lišta → **Historie** — záznamy napříč klienty; unread pokud něco zbývá.
2. [ ] **Účet** — trenér; zatím nech přihlášeného, pokud jdeš na fázi 6.

---

## 6. Trenér — desktop (≥ 1280)

Stále Marek. Rozšiř okno.

1. [ ] Přehled — heatmapa + postranní panel bez ořezání.
2. [ ] Klient detail OK.
3. [ ] Cíl → Tvorba tréninku — **3 sloupce**.
4. [ ] Otevři dialog (např. krok) — křížek close zůstane vidět při scrollu.

Odhlásit. Zpět mobil 390.

---

## 7. Společný tok (2 okna)

Trenér už poslal text v 5.2. Teď:

1. [ ] **Okno A — Jan:** login `jan.novak@seznam.cz` / `password1`.
2. [ ] **MáŠ vidět:** unread na Dnes / zvonku / Historii.
3. [ ] Otevři záznam → je tam text trenéra z 5.2.
4. [ ] Jan odpoví jednou větou a uloží.
5. [ ] **Okno B — Marek:** vidí novou zprávu.
6. [ ] Po přečtení unread u Jana / Mareka zmizí.

---

## 8. Release checklist (povinné)

Projdi a zaškrtni — odkazuje na to, cos už udělal:

| ID  | Kontrola                                                    | Kde v průchodu        | OK  |
| --- | ----------------------------------------------------------- | --------------------- | --- |
| R1  | Google UI skryté bez flagu                                  | 2.1                   | [ ] |
| R2  | Edit **plánu** po COMPLETED **instanci** (ne edit instance) | 5.4 A                 | [ ] |
| R3  | Pozvánka 8 znaků                                            | 5.3                   | [ ] |
| R4  | Heatmapa na 390 px                                          | 5.1                   | [ ] |
| R5  | Cognac primary                                              | 3.1 / 5.1             | [ ] |
| R6  | Seed 1–2 tréninky/den, ne shluk                             | 3.2                   | [ ] |
| R7  | Klikr neruší průchod                                        | 3.3                   | [ ] |
| R8  | Sub-steps parts-then-whole                                  | 5.4 / editor          | [ ] |
| R9  | Desktop Today + trenér heatmapa                             | 4 + 6                 | [ ] |
| R10 | Console mailer log po odpovědi                              | 5.2 / 7 (backend log) | [ ] |

---

## 9. Smoke Petra + Tomáš

1. [ ] Odhlas → `petra.svobodova@email.cz` / `password1` → pes Alík, Dnes OK.
2. [ ] Odhlas → `tomas.dvorak@gmail.com` / `password1` → Lucky OK.
3. [ ] Znovu Marek → Klienti — oba tam jsou.

---

## 10. Volitelně demo seed

```sh
pnpm backend seed:demo
```

Účty a delší checklist: `docs/demo-seed.md` (heslo `TrainLoop123!`).

---

## Hotovo

- [ ] Žádný stuck spinner / bílá obrazovka
- [ ] Žádná 500 u běžných toků
- [ ] Mobil + desktop, Jan + Marek
- [ ] Sekce 8 hotová

**Čas:** 45–75 min důkladně · zkrácený smoke ≈ 25 min.

Bug zapisuj: `fáze.krok` · URL · role · co jsi čekal / co se stalo · screenshot.
