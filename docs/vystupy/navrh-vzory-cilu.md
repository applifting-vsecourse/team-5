# Refinement 16. 11.: Vzory cílů (#94, #234)

Podklad ke schůzce. Stories jsou na GitHubu včetně akceptačních kritérií. Tady je jen to, co projít s PO, a proč jsme se rozhodli tak, jak jsme se rozhodli.

| Story                                                                                       | Co řeší                                         | Odhad                              |
| ------------------------------------------------------------------------------------------- | ----------------------------------------------- | ---------------------------------- |
| [#94 Vzory cílů podle disciplíny](https://github.com/applifting-vsecourse/team-5/issues/94) | uložení cíle jako vzoru a převzetí u jiného psa | M (backend) + S + S (UI)           |
| [#234 Správa vzorů cílů](https://github.com/applifting-vsecourse/team-5/issues/234)         | přehled, prohlížení, úprava na desktopu, mazání | S (přehled, mazání) + M/L (editor) |

## Proč teď

Nice to have s nejvyšší hodnotou pro toho, kdo platí. Trenérka má kolem 40 klientů měsíčně (Z9) a podobné cíle (přivolání, chůze u nohy) píše pořád znovu. Ve FB2 7 padla i varianta, že by to bylo MVP. Cílem není brát to místo MVP, ale mít obě stories „ready“ na sprint 5.

## Co potřebujeme od PO

1. **Obsah klienta ve vzoru trenéra.** Cíl často napsal psovod. Smí si ho trenér uložit jako svůj vzor a nechat si ho i po ukončení spolupráce (#61)? Návrh: ano. Vzor neukládá jméno psa ani odkaz na klienta a trenér před uložením vidí název.
2. **Rozdělení na dvě stories.** Vzory dávají hodnotu i bez správy, protože špatný vzor jde nahradit novým uložením. Souhlas, že #94 může jít do sprintu dřív než #234?
3. **Úpravy jen na desktopu.** Na mobilu se vzory dají jen prohlížet a mazat. Stačí to?

## Rozhodnutí, která jsme udělali (k potvrzení)

| Otázka               | Rozhodnutí                                                                | Proč                                                                      |
| -------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Kdo má vzory         | jen trenér                                                                | story je z pohledu trenéra, psovod s 1–3 psy si cíl napíše znovu          |
| Odkud vzor vzniká    | jen z existujícího cíle, i dokončeného nebo archivovaného                 | vzor má být „osvědčený“, nový vzor od nuly by vyžadoval prázdný editor    |
| Vylepšený cíl        | dialog nabídne _Nový vzor_ nebo _Nahradit: …_                             | trenér nechce v seznamu pět verzí „Přivolání“                             |
| Cíl bez disciplíny   | jako vzor uložit nejde                                                    | „Obecné“ by se nabízelo všem psům                                         |
| Komu se vzor nabídne | psovi s aktivní disciplínou stejného názvu, bez ohledu na velikost písmen | katalog disciplín má „Agility“ i „agility“ jako dvě položky               |
| Pes disciplínu nemá  | vzor se nenabídne, trenér požádá psovoda o přidání disciplíny             | disciplíny přidává jen majitel psa, oprávnění neměníme                    |
| Co se kopíruje       | název, princip, kritérium, aktivní tréninky s kroky                       | termín, výsledky kroků a archivované tréninky patří konkrétnímu psovi     |
| Vazba cíl → vzor     | žádná                                                                     | jde přidat později, teď by přinesla otázku „co když vzor smažu“           |
| Kde se vzor vybírá   | ve formuláři nového cíle, disciplína se přesune na první místo            | trenér nemusí hledat, kde vzory jsou, bez vzorů vypadá formulář jako dnes |

## Technická rozhodnutí (ADR)

Navržená ADR jsou v `docs/adr` (větev `docs/94-vzory-cilu-adr`). Po refinementu je přepneme na _Přijato_:

- [ADR 0001 Vzor cíle je JSON snímek s verzí](../adr/0001-vzor-cile-je-json-snimek.md): jedna tabulka `GoalTemplate`, obsah v JSON hlídaný zod schématem. Zamítli jsme tři tabulky jako u cíle a příznak `isTemplate` na cíli.
- [ADR 0002 Disciplíny se párují podle názvu bez ohledu na velikost písmen](../adr/0002-discipliny-se-paruji-podle-nazvu-bez-velikosti-pismen.md): katalog se teď nesjednocuje a zůstává jako technický dluh.

## Doplněk: Duplikace tréninku (#103)

Volná nice to have na podobné téma „nepsat totéž znovu“, jen v menším: zkopírovat jeden naplánovaný trénink na jiný den v _Týdnu_. Velikost S. Vzory ji nenahrazují, protože kopírují celý cíl, ne jeden termín. Otázka na PO: zařadit hned po #94?
