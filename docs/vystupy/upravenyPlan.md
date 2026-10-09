# TrainLoop — Upravený brief (Sprint 1 / Semestr)

**Cíl:** Nástroj pro adaptivní výcvik psa propojující psovoda a trenéra bez nutnosti papírových sešitů a roztříštěné komunikace.

**Datum revize:** Říjen 2026

**Role:** Product Owner: @Veronika | Realizace: Studentský tým

---

## 1. O co jde (Kontext & Problém)

Psovod trénuje psa ve více disciplínách současně (např. canicross, nosework, poslušnost). Úkoly na sebe navazují nelineárně — podle reakce psa se plán vrací zpět, přeskakuje dopředu nebo větví.

**Bariéry současného stavu:**

- Papírový sešit je statický a ruční skládání týdenního rozvrhu zabírá čas o víkendech.
- Videa z tréninků leží nespojená v galerii telefonu.
- Zpětná vazba od trenérek probíhá neefektivně přes screenshoty sešitu nebo WhatsApp zprávy.

---

## 2. Upravená vize produktu (Pivot: B2B2C / Trenérské propojení)

TrainLoop opouští myšlenku anonymního tržiště se statickými plány. Místo toho se stává platformou pro **asynchronní tréninkové vedení mezi psovodem a jeho trenéry**:

1. Psovod má svůj dynamický plán a týdenní kalendář.
2. K úkolu zapíše výsledek, poznámku a připojí odkaz na video z tréninku.
3. Trenér vidí kontext, okomentuje provedení v chatu a přímo upraví další postup v plánu.

---

## 3. Klíčové role v systému

- **Psovod (Vlastník psa):** Zapisuje disciplíny, plní úkoly v týdenním kalendáři, nahrává výsledky a konzultuje s trenérem.
- **Trenér:** Má přístup k profilu psa/svěřence, může vytvářet či upravovat úkoly a reagovat na zaznamenané tréninky přes chat/komentáře.

---

## 4. Co musí fungovat do konce semestru (Akceptační kritéria MVP)

#### A. Správa profilu a disciplín

- Založení profilu psa (jméno, plemeno, fotka; podpora více psů na účtu psovoda) a přiřazení tréninkových oblastí (canicross, nosework, poslušnost...).
- Propojení trenéra a klienta: trenér pozve klienta (e-mail / kód), klient přes pozvánku zaregistruje sebe a svého psa.

#### B. Nelineární plánování (Jádro systému)

- Vytvoření cíle v dané oblasti a k němu dílčích úkolů.
- Možnost nelineární úpravy úkolů: vrátit se o krok, přeskočit, rozvětvit cestu.
- Možnost, aby úkoly v plánu upravoval jak psovod, tak přizvaný trenér.

#### C. Týdenní rozvrh (Dashboard)

- Jedna centrální obrazovka s kalendářem na aktuální týden zobrazující úkoly napříč všemi disciplínami naráz.
- Možnost přesouvat úkoly mezi dny.

#### D. Log tréninku & Zpětná vazba

- Po odcvičení zápis: **% úspěšnosti**, **textová poznámka** a **odkaz na video** (YouTube unlisted / Cloud / externí odkaz).
- Asynchronní chat / vlákno komentářů pod konkrétním úkolem mezi psovodem a trenérem.

---

## 5. Co je vyškrtnuto (Out of Scope pro tento semestr)

- ❌ Žádné veřejné tržiště, nákup a prodej plánů ani hodnocení cizích autorů.
- ❌ Žádné platební brány, provize ani fakturace.
- ❌ Žádný přímý upload velkých videosouborů na vlastní servery (řešeno externími linky).
- ❌ Nativní mobilní aplikace v App Store / Google Play (vyvíjí se responzivní webová aplikace optimalizovaná pro mobil / PWA).

---

## 6. Byznys a udržitelný model do budoucna

- **Směřování:** SaaS nástroj pro trenéry psů (předplatné Solo trenér 490 Kč / měsíc do 15 psů, Psí škola / Pro 990 Kč / měsíc neomezeně psů).
- Psovodi mají v základní verzi aplikaci v rámci spolupráce se svým trenérem zdarma (včetně možnosti vedení více psů pod trenérem).
