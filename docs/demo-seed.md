# Velký demo seed

Pro vizuální kontrolu obrazovek a ruční průchody aplikací. Spouští se **výslovně**, není součástí `pnpm dev` ani deploye. Vyžaduje aktuální migrace větve `dev` a `DATABASE_URL` v `apps/backend/.env` ukazující na vývojovou databázi.

```sh
pnpm backend migrate
pnpm backend seed:demo
```

Seed funguje na prázdné databázi i vedle základního seedu. Nevyprazdňuje tabulky. V jedné transakci obnovuje pouze své záznamy s prefixem `demo-` a tři demo pozvánky. Opakované spuštění nastaví demo hesla, cíle, kroky, kalendář i demo historii zpět do výchozího stavu; ručně přidané záznamy a odpovědi zachová. Pokud jste demo plán ručně dokončili nebo přeskočili, zachová také tento plán včetně původního data a stavu. Ostatní přímé změny samotných demo záznamů se přepíšou. `NODE_ENV=production` spuštění odmítne.

## Přihlášení

Všech 15 účtů má heslo **`TrainLoop123!`**. E-maily používají vyhrazenou doménu `.test`; žádné e-maily se neposílají. Hesla jsou hashovaná stejnou funkcí jako v Better Auth.

| E-mail                                                          | Scénář                                                                                           |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `owner@demo.trainloop.test`                                     | Anna, 4 psi: více disciplín a plánů, pes bez plánu, cíl bez tréninků, pes sdílený dvěma trenérům |
| `owner-2@demo.trainloop.test` až `owner-11@demo.trainloop.test` | Dalších 10 psovodů, každý se dvěma psy; aktivní a archivovaní psi, sdílená i soukromá data       |
| `owner-empty@demo.trainloop.test`                               | Nový psovod bez psů                                                                              |
| `trainer@demo.trainloop.test`                                   | Marek, 10 klientů, sdílení psi a vlastní Argo                                                    |
| `trainer-2@demo.trainloop.test`                                 | Jana, jediný klient a sdílený pes                                                                |
| `trainer-empty@demo.trainloop.test`                             | Trenér bez klientů                                                                               |

## Co proklikat

- **Psi a profil:** 25 psů, šest barev, různá plemena i chybějící plemeno, archiv, týdenní cíle 1–7, pes bez disciplín.
- **Cíle a editor:** šest disciplín, aktivní/dokončené/pozastavené/archivované cíle, dva tréninky na cíl, tři kroky na trénink, aktuální a zvládnutý krok, archivovaný trénink, cíl bez plánu.
- **Dnes a Týden:** plány relativně k dnešku v `Europe/Prague`, dnešek a dalších 14 dní, více psů ve stejný den. Archivovaní psi nemají budoucí plány.
- **Historie a metriky:** osm týdnů, stovky dokončených a přeskočených tréninků, všechny úrovně soustředění/chyb, úspěšnost 0–100 %, hodnocení 1–5, důvody přeskočení, víceřádkové poznámky, záznamy bez metrik a bez cíle. Odkazy na video jsou veřejné ukázkové odkazy, ne skutečná videa těchto psů.
- **Reakce:** vlákna s otázkou psovoda i celou konverzací s trenérem. Samotný seed nepřidává funkce z dosud nesloučených PR, například stav přečtení.
- **Soukromý deník:** poznámky ze semináře, zdraví a vlastní pozorování. Ověřit i nepřístupnost trenérovi.
- **Klienti a oprávnění:** klient s několika psy, částečně sdílená smečka, pes sdílený dvěma trenérům, nesdílený psovod, prázdný trenér.
- **Pozvánky:** `DMLIVE` platná, `DMOLD1` expirovaná, `DMUSED` použitá.

Fotografie nejsou součástí seedu; zůstávají lokální fallbacky aplikace.

## Regresní kontrola proti PostgreSQL

Použijte samostatnou jednorázovou databázi s aktuálními migracemi. Test obnovuje demo sadu, proto jej nespouštějte proti běžné vývojové databázi.

```sh
pnpm backend build
# DEMO_TEST_DATABASE_URL nastavte na izolovanou migrovanou testovací DB
pnpm backend test:seed:postgres
```

Kontrola ověřuje vazby a stavy záznamů, heslo, prázdné scénáře, datum na hranici UTC/Prague, opakované spuštění, posun týdne, zachování cizích dat i ručních poznámek a odmítnutí v produkci.
