# Bezpečnostní zpráva závislostí

**Datum**: 05. 11. 2026. **Rozsah**: Úkol #165, npm závislosti workspace (včetně vývojových nástrojů), Node.js, základní obrazy Dockeru a GitHub Actions. **Výchozí stav (baseline)**: větev `dev` na commitu `c8bd6da`.

## Nálezy a jejich náprava

Počty níže vycházejí z příkazu `pnpm audit --json`; započítávají výskyty napříč celým stromem závislostí, nikoli unikátní identifikátory CVE. Výsledky závisí na databázi bezpečnostních hlášení registru v okamžiku spuštění.

| Audit                                  | Nízká (Low) | Střední (Moderate) | Vysoká (High) | Kritická (Critical) |
| -------------------------------------- | ----------: | -----------------: | ------------: | ------------------: |
| Výchozí stav, všechny závislosti       |          14 |                 65 |            56 |                  10 |
| Aktualizovaný stav, všechny závislosti |           1 |                  4 |             0 |                   0 |
| Aktualizovaný stav, produkční závisl.  |           0 |                  2 |             0 |                   0 |

Byly aktualizovány přímé závislosti v rámci jejich stávajících hlavních (major) verzí, včetně Better Auth 1.7.1 → 1.7.17, Prisma 7.9.1 → 7.10.1, NestJS 11.2.1 → 11.2.8, Multer 2.4.0 → 2.5.0, Vite 8.2.1 → 8.3.6, Vitest 4.1.11 → 4.1.12, React 19.2.8 → 19.3.1 a Zod 4.4.3 → 4.6.7. Balíček Nodemailer vyžadoval přechod na novou hlavní verzi 9.0.5 → 10.3.1, aby byly vyřešeny zbývající zranitelnosti související s poštovními službami. Lockfile zároveň obnovil tranzitivní závislosti jako `qs`, `fast-uri`, `js-yaml`, `undici`, `brace-expansion`, `proxy-addr`, `shell-quote` a `handlebars`.

Soubor `pnpm-workspace.yaml` obsahuje čtyři ohraničené přepisy (overrides) pro verze držené nadřazenými závislostmi: Next.js <15.5.29, Sharp <0.35.5, PostCSS <8.5.23 a Multer <2.5.0. Next.js je tranzitivní peer závislostí Better Auth; TrainLoop sám o sobě používá Vite. Tyto přepisy ponechte, dokud upstreamová závislost nepřestane vyžadovat zranitelné verze. Žádné bezpečnostní hlášení není skryto ani zařazeno na whitelist.

Nová pravidla linteru si vyžádala použití volitelného řetězení (optional chaining) v seznamu klientů a explicitní návratový typ JSON v API klientovi. Router nyní typuje chyby jako `unknown`; stávající error boundary je před zobrazením zprávy zúží.

## Běhové prostředí a kontejnery

Verze Node.js je uzamčena na 24.22.2 v `.nvmrc` a ve všech Dockerfilech a manifesty vyžadují alespoň verzi 24.22.2. CI čte `.nvmrc`; pnpm je aktualizován na 10.34.9. Node 24.22.2 obsahuje [bezpečnostní opravy z verze 24.22.1](https://nodejs.org/en/blog/release/v24.22.1), včetně problému s Brotli kompresí CVE-2026-111497 zmiňovaného v zadání úkolu. Brotli je součástí samotného Node.js, takže samotný čistý audit npm by tuto opravu neověřil.

Kontejnerové obrazy byly zkontrolovány vůči Docker Hubu a aktualizovány na `node:24.22.2-alpine`, `nginx:1.30.6-alpine`, `postgres:17.11-alpine` a `axllent/mailpit:v1.33.0`. PostgreSQL zůstává na hlavní verzi 17, což zachovává stávající strukturu datového adresáře. Vydání nginx obsahuje opravy uvedené v [oficiálních oznámeních o vydání](https://nginx.org/). Sestavení používají při ověřování přepínač `--pull`. Značky obrazů (image tags) jsou verzované, ale měnitelné; tato zpráva netvrdí, že všechny systémové balíčky v Alpine jsou zcela bez CVE. Bezpečnostní skenování obrazů na úrovni operačního systému je nad rámec výše uvedených výsledků auditu npm.

GitHub Actions byly zkontrolovány vůči jejich upstreamovým vydáním: checkout 7.0.1, setup-node 7.1.0, pnpm/action-setup 6.1.1, docker/login-action 4.8.0 a docker/build-push-action 7.4.0.

## Zbývající nálezy

Opětovně prověřeno 07. 11. 2026 po začlenění větve `dev`: **4 střední nálezy (moderate) napříč 2 unikátními hlášeními** a **1 nízký nález (low)**. Audit všech závislostí započítává každou dotčenou nainstalovanou verzi: `glob` 10.5.0 a 13.0.6 tvoří dva střední nálezy; `minimatch` 9.0.9 a 10.2.6 tvoří další dva. Audit pouze produkčních závislostí hlásí dva střední nálezy (`glob` 13.0.6 a `minimatch` 10.2.6 skrze `react-email`). Tyto tři níže uvedené řádky bezpečnostních hlášení tedy pokrývají všech pět nálezů; žádné hlášení nebylo vynecháno. Oba audity hlásí nula vysokých a nula kritických nálezů.

| Bezpečnostní hlášení                                                              | Cesty závislostí a míra expozice                                                                                                                                                                    | Důvod ponechání / další postup                                                                                                                                                                                                                                                                                                                             |
| --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [GHSA-gcqx-w48m-w2h4](https://github.com/advisories/GHSA-gcqx-w48m-w2h4), nízká   | Nest CLI → fork-ts-checker-webpack-plugin → deepmerge 4.3.1; pouze vývojové prostředí. Útok Prototype Poisoning vyžaduje podvržený vstup při slučování objektů.                                     | Dosud nebyla vydána opravená verze. Konfigurace sestavení je plně pod kontrolou repozitáře; nepředávejte těmto nástrojům nedůvěryhodné objekty. Přehodnoťte, jakmile bude vydána upstreamová oprava.                                                                                                                                                       |
| [GHSA-3g3m-2fjr-6pw4](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4), střední | Nástroje Nest CLI/Jest a react-email → glob 10.5.0 / 13.0.6. Průchod adresářovým stromem může pokračovat i po zrušení přes AbortSignal. `react-email` je produkční závislostí kvůli importu šablon. | Oprava vyžaduje glob 14.0.2, což přesahuje omezení stávající hlavní verze upstreamu. Vynucený plošný přechod by mohl poškodit buildovací a e-mailové nástroje. Umístění šablon je pod kontrolou repozitáře a žádné API nepřijímá glob vzory ani adresářové stromy. Aktualizujte upstreamové balíčky nebo oddělte CLI pro e-maily od běhového vykreslování. |
| [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249), střední | Stejné nástroje → glob → minimatch 9.0.9 / 10.2.6. Speciálně vytvořené vzory mohou zvýšit využití CPU/paměti při úrovni optimalizace ≥2. Přítomno rovněž přes `react-email` v produkčním stromu.    | Oprava vyžaduje minimatch 11.0.1, což přesahuje omezení stávající hlavní verze upstreamu. TrainLoop nepřijímá žádné glob vzory od uživatelů. Znovu vyhodnoťte při aktualizaci balíčku glob/upstreamu, spíše než nahrazovat toto API napříč konzumenty bez vyhrazeného testování kompatibility.                                                             |

Posouzení míry expozice vychází ze současných importů a způsobu použití těchto nástrojů, nejedná se o penetrační test. Zbytkové nálezy zůstávají viditelné v běžném výstupu auditu; vysoké a kritické nálezy nejsou nikdy ignorovány ani vyjmuty.

## Průběžné monitorování

- Upozornění Dependabotu v repozitáři již byla zapnuta. Automatické bezpečnostní aktualizace byly povoleny a ověřeny přes GitHub API (`enabled: true`, `paused: false`).
- Konfigurační soubor `.github/dependabot.yml` nastavuje týdenní aktualizace vůči větvi `dev` pro npm závislosti workspace, GitHub Actions, Dockerfiles a Compose obrazy. Běžné aktualizace (minor/patch) a bezpečnostní aktualizace npm jsou seskupeny odděleně. Přechod na novou hlavní verzi PostgreSQL vyžaduje samostatnou migraci a je vyloučen z automatických návrhů.
- Skript `pnpm security:audit` spouští `pnpm audit --audit-level=high` nad produkčními **i** vývojovými závislostmi. Je součástí `pnpm check-all`, povinné CI úlohy `verify` a předpokladem pro nasazení (včetně manuálního nasazení). Výskyt vysokých či kritických nálezů nebo výpadek registru zablokuje nasazení.
- CI se navíc spouští každé pondělí v 07:00 UTC, takže nově zveřejněná bezpečnostní hlášení jsou kontrolována i bez nutnosti změny kódu. Konfigurace Dependabotu nabude účinnosti, jakmile se tato PR dostane do výchozí větve, v současnosti `dev`. Návrhy stále vyžadují standardní review a úspěšné CI.

Podrobnosti viz [možnosti pnpm audit](https://pnpm.io/10.x/cli/audit), [konfigurace Dependabotu](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference) a [nastavení bezpečnostních aktualizací](https://docs.github.com/en/code-security/how-tos/secure-your-supply-chain/secure-your-dependencies/configure-security-updates).

## Reprodukce

Použijte verzi Node ze souboru `.nvmrc` a verzi pnpm z `packageManager`:

```shell
pnpm install --frozen-lockfile
pnpm audit --json
pnpm audit --prod --json
pnpm security:audit
pnpm check-all
docker build --pull -f apps/backend/Dockerfile.deploy -t trainloop-security-backend .
docker build --pull -f apps/frontend/Dockerfile.deploy -t trainloop-security-frontend .
```

Úplný audit záměrně skončí nenulovým návratovým kódem kvůli zdokumentovaným nízkým/středním nálezům; kontrola vysokých a kritických zranitelností projde s kódem nula. Pro ověření selhání kontrolního mechanismu bez změn v aplikaci spusťte `pnpm audit --audit-level=high` v odděleném checkoutu výchozího stavu `c8bd6da`: původní vysoké a kritické nálezy způsobí nenulový návratový kód.

Výsledky ověření jsou zaznamenány v pull requestu a v jeho běhu CI.
