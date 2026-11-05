# Backend: pes → disciplína → cíl → trénink → krok (#160)

Disciplína je společná zastřešující kategorie (`Discipline`, unikátní název).
Ke psům se přiřazuje přes `DogDiscipline`; archivace přiřazení u jednoho psa
neovlivní ostatní. Stejně pojmenované cíle mohou existovat u více psů i v jedné
disciplíně, ale každý má vlastní obsah a postup. Cíl má právě jednu disciplínu a vlastní kritérium
„Hotovo, když…“. Obsahuje seřazené tréninky (`GoalTraining`); každý má své
seřazené kroky (`PlanBlock`, zachovaný název tabulky kvůli existujícím ID).
`ScheduledTraining` je konkrétní termín jednoho tréninku. Stejný trénink lze
opakovat v dalších dnech. Dokončení nebo přeskočení zachovává vazbu na záznam.

## Definice metrik před implementací

- Časové pásmo je vždy `Europe/Prague`, týden pondělí–neděle. Kalendářní datum
  termínu se nepřepočítává jako okamžik; den odcvičení určuje `completedAt` záznamu.
- Týdenní cíl je počet různých odcvičených dní psa (1–7, výchozí 3). Více sezení
  v jednom dni se počítá jako jeden den. Nastavení mění pouze majitel.
- Série je počet po sobě jdoucích odcvičených kalendářních dní do dneška; pokud
  dnes ještě necvičil, do včerejška. Starší přerušená série vrací 0.
- Úspěšnost je aritmetický průměr vyplněných `successRate` dokončených záznamů
  za dnešek a předchozích 27 kalendářních dní, zaokrouhlený na jedno desetinné místo.
  Nulová úspěšnost je platný vzorek. Chybějící hodnocení se nezapočítá.
- Trend vrací 8 týdnů včetně aktuálního, počty dokončených sezení, různých dní,
  hodnocených vzorků a průměr úspěšnosti. Změna je rozdíl průměrů aktuálního
  a předchozího týdne v procentních bodech. Běžící týden není předpověď.
- Přeskočené a plánované tréninky se nezapočítávají do žádné metriky. Bez
  hodnocení je průměr i změna `null`; bez odcvičení jsou počty a série 0.
  Historické samostatné záznamy se započítávají také. Všechny obrazovky používají
  stejné API, nikoli vlastní varianty výpočtu.

## Migrace a kompatibilita

Migrace je doplňující: zachovává ID cílů, bloků, termínů, záznamů i zpráv.
Pro každého psa převede jeho seznam disciplín a disciplíny starých cílů do
společného číselníku a přiřazení ke psům. Cíle bez disciplíny dostanou disciplínu „Obecné“.
Každý starý cíl dostane jeden trénink se svým původním názvem; jeho bloky a
všechny termíny se převedou pod tento trénink. Záznamy s cílem dostanou vazbu
na něj také, záznamy bez cíle zůstanou samostatné. Neznámá kritéria zůstanou
`null`, nevymýšlíme úspěch zpětně.

Původní názvy disciplín v API jsou kompatibilní projekce. Databázové triggery
udržují vazby i pro původní seed a klienty. Původní zápis bloku nebo termínu
přes cíl lze jednoznačně převést pouze pokud má cíl nejvýše jeden trénink;
jinak je třeba použít konkrétní ID tréninku. Nové API vždy pracuje s tímto ID.

Názvy disciplín se při migraci i pozdějších zápisech oříznou; prázdné položky
seznamu psa se odstraní a duplicity sloučí. Založení cíle obnoví archivované
přiřazení jeho disciplíny a doplní ji do seznamu psa. Prázdná disciplína cíle
vybere „Obecné“ (také při úpravě); cíl vždy patří do jedné disciplíny.
Legacy čtení `/goals/:goalId/blocks` vrací 409, pokud má cíl více tréninků,
včetně archivovaných; pro konkrétní kroky slouží `/goal-trainings/:id`.

Databáze vynucuje nejvýše jeden PLANNED termín pro dvojici `trainingId`, `date`.
Při migraci zůstane z případných duplicit plánovaný nejstarší termín
(při shodě rozhodne ID); ostatní přejdou na SKIPPED. Jejich ID i vazby na
záznamy zůstávají zachované, nic se nemaže. Dokončené termíny index neomezuje.

Archivace tréninku ani disciplíny nemaže kroky, termíny nebo záznamy. Archivovaný
cíl/rodič blokuje nové plánování a změny obsahu; historické termíny zůstávají
čitelné a lze je dokončit. Oprávnění vycházejí ze stávajícího `DogAccessService`:
majitel a sdílený trenér upravují plán, pouze majitel dokončuje a hodnotí.
Soukromé poznámky nejsou součástí hierarchie ani metrik.

## Budoucí vzory trenéra

Trenér bude mít vlastní knihovnu předdefinovaných cílů s tréninky a kroky podle
disciplíny. Při použití vzoru vznikne samostatná kopie struktury v plánu psa.
Změny vzoru se nepropíšou do již přiřazených plánů; změny u klienta neovlivní
vzor ani ostatní psy. Původ a verzi vzoru lze později doplnit zvláštní vazbou.
Knihovna ani automatické přiřazování vzorů nejsou součástí #160.

## API pro navazující obrazovky

Všechny cesty mají prefix `/api` a vyžadují přihlášení.

| Metoda a cesta                          | Vstup / výsledek                                                                                                                                                              |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /disciplines`                      | Společný číselník `{ id, name }[]`, bez plánů ostatních psů.                                                                                                                  |
| `PUT /dogs/:dogId/disciplines`          | `{ name, isArchived?: boolean }`; přiřadí/obnoví nebo archivuje disciplínu pouze tomuto psovi. Pouze majitel.                                                                 |
| `GET /dogs/:dogId/plan`                 | Pole přiřazení disciplín, každé obsahuje `discipline`, `isArchived`, `goals[]`, v cíli `sessions[]`, v tréninku `steps[]`. Archivované položky zůstávají s příslušným stavem. |
| `POST /dogs/:dogId/goals`               | Stávající založení cíle přes `title`, název `discipline`, `principle`; nově i `criterion`. Odpověď obsahuje také společné `disciplineId`.                                     |
| `POST /goals/:goalId/sessions`          | `{ title, insertAt?: number }`; vytvoří trénink v cíli.                                                                                                                       |
| `PUT /goals/:goalId/sessions/order`     | `{ ids: string[] }`; úplný seznam ID tréninků včetně archivovaných.                                                                                                           |
| `GET, PATCH /goal-trainings/:id`        | Detail s kroky; změna `{ title?, isArchived? }`.                                                                                                                              |
| `POST /goal-trainings/:id/steps`        | `{ title, instruction?, criterion?, insertAt? }`.                                                                                                                             |
| `PUT /goal-trainings/:id/steps/order`   | `{ ids: string[] }`; úplný seznam kroků daného tréninku.                                                                                                                      |
| `PATCH, DELETE /blocks/:blockId`        | Stávající úprava/smazání kroku podle jeho ID; pracuje v jeho konkrétním tréninku.                                                                                             |
| `POST /goal-trainings/:id/schedule`     | `{ date: "YYYY-MM-DD" }`; vrací termín s `trainingId`.                                                                                                                        |
| `GET /trainings`, `GET /trainings/:id`  | Kalendář/průchod: nově i `training: { id, title }`; `exercises` obsahují jen kroky tohoto tréninku.                                                                           |
| `POST /trainings/:id/complete`, `/skip` | Stávající dokončení a přeskočení konkrétního termínu, pouze majitel.                                                                                                          |
| `GET /dogs/:dogId/metrics`              | `weeklyTarget`, `weeklyTrainedDays`, `weeklyTargetReached`, `streak`, `successRate`, `ratedSessions`, `weeklyChange`, `weeks[]`, `timeZone`, `asOf`.                          |
| `PUT /dogs/:dogId/weekly-target`        | `{ weeklyTarget: 1..7 }`, pouze majitel.                                                                                                                                      |

Nové pořadí se validuje znovu uvnitř transakce pod zámkem cíle. Cizí či
neúplný seznam ID vrací 400; nejednoznačný starý zápis přes celý cíl vrací 409.
Různé tréninky téhož cíle lze naplánovat na stejný den; duplicita stejného
tréninku ve stavu PLANNED ve stejný den vrací 409.

Izolovaný test migrace lze spustit bez Dockeru: `pnpm backend test:migration`.
PGlite je vývojová závislost a stejný test běží automaticky v CI.
Test přehraje migrace a ověří zachování ID/vazeb, společné disciplíny,
oddělené plány, kompatibilitu, neplatné rodiče a smazání majitele v paměti.
