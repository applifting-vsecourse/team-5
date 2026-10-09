# Lean Canvas — TrainLoop

**Designed for:** TrainLoop | **Designed by:** Tým 5 | **Date:** 9.10.2026 | **Version:** 1.3 (po rozhovoru s uživatelkou)

---

| **Problem** | **Solution** | **Unique Value Proposition** | **Unfair Advantage** | **Customer Segments** |
| :--- | :--- | :--- | :--- | :--- |
| • Klienti si z ústního zadání zapíšou jen část a doma nevědí, co a jak cvičit (na lekci chodí cca 1× za měsíc).<br>• Cvik se učí po dílčích krocích. Klient nepozná, na kterém kroku pes vázne.<br>• Dotaz přes WhatsApp nemá kontext úkolu, trenér se doptává na okolnosti. | Responzivní webová aplikace (optimalizovaná pro mobil):<br>• Zadání z lekce v telefonu klienta: princip, dílčí kroky, kritérium zvládnutí a na co si dát pozor.<br>• Návrat o krok a vložení mezikroku, když pes opakuje stejnou chybu.<br>• Dotaz s videem přímo u úkolu, i s okolnostmi. | Co trenér na lekci řekne, klient doma najde.<br><br>Zadání krok po kroku i s tím, na co si dát pozor. V telefonu, přímo na place. Méně doptávání „jak bylo tohle?“, víc vidět pokrok na další lekci. | Neexistuje | **Zákazník (platí):** Nezávislí trenéři a trenérky, jejichž klienti trénují doma mezi lekcemi s delším odstupem (typicky 1× za měsíc).<br><br>**Uživatel (zdarma):** Psovodi, kteří po lekci nebo semináři trénují sami a potřebují mít zadání u sebe. |
| **Existing Alternatives** | **Key Metrics** | **High-Level Concept** | **Channels** | **Early Adopters** |
| • Ústní zadání a vlastní poznámky klienta<br>• WhatsApp (text, video) mezi lekcemi<br>• Papírový deník pro každého psa a sport<br>• Paměť trenéra | • **10 platících trenérů** do 6 měsíců od spuštění pilotu<br>• Trenér zapíše zadání po **≥ 80 % lekcí**<br>• **≥ 60 % klientů** otevře zadání mezi lekcemi alespoň 1× týdně | TrueCoach / TrainingPeaks pro trenéry psů | • Osobní oslovení trenérů a psích škol (přes kontakty PO a psí akce)<br>• Přirozená virální smyčka: trenér onboarduje své klienty | • Lidé, se kterými už trénuje Veronika (PO): její trenéři a trenérky a jejich klienti.<br><br>• Trenéři s desítkami klientů měsíčně, kteří klientům dávají úkoly na celý měsíc a už s nimi konzultují přes WhatsApp. |

| **Cost Structure** | **Revenue Structure** |
| :--- | :--- |
| • Běžná cloudová infrastruktura (databáze, hosting)<br>• Doména a DNS<br>• Vývoj a údržba webové aplikace | **B2B SaaS předplatné pro trenéry:**<br>• Solo trenér: 490 Kč / měsíc (do 15 aktivních psů)<br>• Psí škola / Pro: 990 Kč / měsíc (neomezeně psů)<br>• Pro psovody: 0 Kč (včetně více psů v rámci výcviku pod trenérem) |

## Co se změnilo ve verzi 1.3

Podle [rozhovoru s trenérkou](zjisteni-rozhovor-1.md) z 9. 10. 2026.

| Blok | Změna | Proč |
| --- | --- | --- |
| Problem | Nahoru ztráta zadání mezi lekcemi. Vypadla organizace cviků napříč disciplínami a srovnávání efektivity. | H4/H9 podpořeny. H1 a H2 oslabeny: trenérka disciplíny i změny postupu zvládá bez potíží. |
| Solution | Místo plánování a měření efektivity zadání z lekce, dílčí kroky a dotaz u úkolu. | Pokrok se neměří procentem (H5), trenérka si výsledky nezaznamenává. |
| UVP | Z „vidíte, co klienti odcvičili“ na „co trenér řekne, klient najde“. | Trenérka od klientů nic nevyžaduje, progres pozná na lekci. Bolest je na straně klienta. |
| Customer Segments | Psovod už nemusí trénovat 2+ disciplíny. Trenér se vymezuje odstupem mezi lekcemi. | H1 oslabena, klienti chodí 1× za měsíc. |
| Existing Alternatives | Doložené alternativy z rozhovoru. Strava, Excel a habit trackery nezazněly. | |
| Key Metrics | Místo „zapíše ≥ 2 tréninky týdně“ zápis zadání trenérem a jeho otevírání klientem. | Trenérka zápisy tréninků od klientů nepotřebuje. |
| Revenue | Beze změny, ale k ověření. | Respondentka má ~40 klientů měsíčně, tarif Solo do 15 psů jí nestačí. Ochota platit (H8) nezazněla. Viz [otazky-fb2.md](otazky-fb2.md). |
