# ADR 0002: Disciplíny se párují podle názvu bez ohledu na velikost písmen

## Stav

Navrženo, 2026-11-16. Z přípravy refinementu [#94 Vzory cílů podle disciplíny](https://github.com/applifting-vsecourse/team-5/issues/94). Po potvrzení na refinementu se přepne na _Přijato_.

## Kontext

Vzor cíle se nabízí jen psům, kteří mají stejnou aktivní disciplínu, pod jakou byl vzor uložený (#94, [ADR 0001](0001-vzor-cile-je-json-snimek.md)). Je to první funkce, která páruje disciplíny **napříč psy různých majitelů**. Dosud se disciplína vždy používala jen v rámci jednoho psa.

Katalog `Discipline` je globální a vzniká z volného textu:

- Disciplínu psovi přidává jen majitel: `setDiscipline` (`hierarchy.repository.ts`), formuláře psa a DB triggery `sync_dog_disciplines` a `attach_goal_discipline`.
- Název se jen ořeže o mezery (`btrim`, `@Trim`) a unikátní je přesný řetězec (`name @unique`).
- Duplicity bez ohledu na velikost písmen se odstraňují jen v rámci jednoho psa (`sanitizeDisciplines`).

„Agility“ od jednoho psovoda a „agility“ od druhého jsou proto dvě různé disciplíny s různým `id`. Párování podle `disciplineId` by trenérovi vzor u druhého psa tiše nenabídlo.

## Rozhodnutí

Vzory se párují **podle názvu disciplíny bez ohledu na velikost písmen**, ne podle `disciplineId`.

- Vzor si pamatuje `disciplineId` disciplíny, pod kterou byl uložený.
- Psovi se nabídnou vzory, jejichž disciplína má stejný název jako některá z jeho **aktivních** disciplín (`DogDiscipline.isArchived = false`), po ořezání mezer a bez ohledu na velikost písmen. V Prisma to je `equals` s `mode: 'insensitive'`.
- Pravidlo je na jednom místě, ve funkci repository pro vzory. Každé další párování disciplín napříč psy ji musí použít, ne napsat vlastní porovnání.
- Katalog disciplín se nesjednocuje a existující data se neslučují.

## Zvažované možnosti

1. **Párovat podle názvu bez ohledu na velikost písmen (zvoleno).** Jedna podmínka v dotazu, žádný zásah do dat. Duplicity v katalogu ale zůstávají.
2. **Sjednotit katalog: unikátní název bez ohledu na velikost písmen a migrace, která sloučí duplicity (zamítnuto pro teď).** Opravila by příčinu a dovolila párovat podle `id`. Sloučení ale musí přepojit `DogDiscipline` i `TrainingGoal`, který na disciplínu odkazuje složeným klíčem `(dogId, disciplineId)`, a upravit oba triggery. U psa, který má obě varianty, by vznikl konflikt. To je riziko na produkčních datech, které se kvůli jedné nice to have story nevyplatí.
3. **Nabízet všechny trenérovy vzory s filtrem podle disciplíny (zamítnuto).** Žádné párování, ale jde proti akceptačnímu kritériu „vzory té disciplíny“ a trenér s mnoha vzory by v seznamu hledal.

## Důsledky

- **Katalog `Discipline` zůstává nesjednocený.** Je to vědomý technický dluh, ne chyba. Seznam `GET disciplines` dál vrací „Agility“ i „agility“.
- **Každá funkce, která páruje disciplíny mezi psy** (statistiky podle disciplíny, „zanedbaná disciplína“ #95 napříč klienty, filtry trenéra), musí použít stejné pravidlo jako vzory. Porovnání podle `disciplineId` dá mezi psy různých majitelů špatný výsledek.
- **Párování nepokrývá překlepy ani diakritiku.** „Poslušnost“ a „Poslusnost“ se nespárují. Kdyby to vadilo, řešením je možnost 2 nebo výběr z katalogu místo volného textu, ne další pravidla porovnání.
- **Až se katalog sjednotí (možnost 2),** nové ADR toto nahradí a párování přejde na `disciplineId`. Funkce z rozhodnutí je pak jediné místo, které se mění.
