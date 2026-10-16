# Lean Canvas — TrainLoop

**Designed for:** TrainLoop | **Designed by:** Tým 5 | **Date:** 16.10.2026 | **Version:** 1.5

---

| **Problem**                                                                                                                                                                                                                                                                                                                                                            | **Solution**                                                                                                                                                                                                                                                                                                                                                                                                           | **Unique Value Proposition**                                                                                                                                                                                          | **Unfair Advantage**                                                                                                                                                                                                          | **Customer Segments**                                                                                                                                                                                                                         |
| :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| • Klienti si z ústního zadání na lekci zapamatují jen část a doma nevědí, jak postupovat, takže dělají zbytečné chyby<br>• Zpětná vazba mezi lekcemi běží přes WhatsApp odtrženě od zadání a videa i odpovědi se klientovi ztrácejí v chatu<br>• Trenér opakovaně vysvětluje totéž („A jak bylo tohle?“)<br>• Ze seminářů si psovod odnese jen to, co si stihne zapsat | Webová aplikace pro mobil (PWA):<br>• **Deník psa:** poznámky z lekcí a seminářů a plán krok po kroku. Funguje i bez trenéra.<br>• **Zadání od trenéra:** princip, pak cviky s instrukcí a kritériem zvládnutí.<br>• Týden s přesunem a přeskočením, záznam s odkazem na video a vlákno s trenérem u tréninku.                                                                                                         | **Pro psovoda:** Co ti trenér řekl, máš u psa. Krok po kroku, i na place.<br><br>**Pro trenéra:** Klienti doma vědí, co a jak cvičit. Podporu mezi lekcemi, kterou dnes dáváte zdarma přes WhatsApp, můžete prodávat. | Neexistuje                                                                                                                                                                                                                    | **Zákazník (platí):** Trenéři a psí školy s desítkami klientů, kteří chodí na lekci cca 1× měsíčně. Chtějí jim prodávat podporu mezi lekcemi.<br><br>**Uživatel (zdarma):** Psovodi, kteří chodí na lekce a semináře, s trenérem i bez něj.   |
| **Existing Alternatives**                                                                                                                                                                                                                                                                                                                                              | **Key Metrics**                                                                                                                                                                                                                                                                                                                                                                                                        | **High-Level Concept**                                                                                                                                                                                                | **Channels**                                                                                                                                                                                                                  | **Early Adopters**                                                                                                                                                                                                                            |
| • Ústní zadání na lekci a vlastní poznámky klienta<br>• WhatsApp (text a video) mezi lekcemi<br>• Papírové deníky (zvlášť na psa a sport)<br>• Excel<br>• Paměť trenéra                                                                                                                                                                                                | • Měsíční příjem 20 000 Kč v 15. měsíci = měsíční bod zvratu (≈ 34 platících trenérů)<br>• ≥ 40 % trenérů z pilotu začne do 3 měsíců platit (má 4. aktivního klienta)<br>• Odchod platících trenérů ≤ 3 % měsíčně<br>• Průměrně ≥ 15 aktivních klientů na trenéra (588 Kč měsíčně)<br>• Získání trenéra ≤ 1 500 Kč, vrátí se do 3 měsíců<br>• Předstihový ukazatel: ≥ 50 % klientů otevře zadání mezi lekcemi 1× týdně | Deník psa, do kterého píše i trenér (TrainingPeaks pro psí sporty)                                                                                                                                                    | • Osobní oslovení trenérů a psích škol (přes kontakty PO a psí akce)<br>• Trenér pozve své klienty<br>• Psovodi z okolí PO (deník zdarma)<br>• Psovod řekne trenérovi „pošli mi zadání sem“, trenér si založí účet a pozve ho | • Lidé, se kterými už trénuje Veronika (PO): její trenéři a trenérky a jejich klienti.<br><br>• Trenéři, kteří dávají zadání ústně a mezi lekcemi odpovídají přes WhatsApp.<br><br>• Psovodi, kteří vedou papírový deník a jezdí na semináře. |

| **Cost Structure**                                                                                                                                                                                                                                                                                                                                                                                                   | **Revenue Structure**                                                                                                                                                                                                                                                                                                |
| :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| • Vývoj MVP: 320 h × 600 Kč = 192 000 Kč jednorázově (4 lidé, sprinty 2–6)<br>• Údržba a podpora: 16 h × 600 Kč = 9 600 Kč měsíčně<br>• Infrastruktura: 600 Kč měsíčně, od 8. měsíce 2 050 Kč (hosting, databáze, e-maily)<br>• Získání trenéra: 1 500 Kč (osobní schůzka a onboarding)<br>• Platební brána 2 % z příjmů, doména 400 Kč ročně<br>• Bod zvratu: měsíční v 15. měsíci, návratnost vývoje ve 34. měsíci | **Trenér platí za aktivního klienta:**<br>• První 3 aktivní klienti zdarma<br>• 49 Kč / měsíc za každého dalšího aktivního klienta<br>• Strop 1 490 Kč / měsíc (od 34 aktivních klientů dál zdarma)<br>• Psovod: 0 Kč, s trenérem i bez něj, i s více psy<br>• Trenér si podporu mezi lekcemi promítne do ceny lekcí |

## Ceník

**Aktivní klient** je psovod propojený s trenérem, se kterým trenér v daném měsíci aspoň jednou pracoval v aplikaci: zadal nebo upravil plán, nebo psovod poslal záznam či zprávu. Klient, který měsíc nic nedělá, se neplatí. Klienti chodí na lekci cca 1× měsíčně, trenér tak neplatí za ty, kteří zrovna nepotřebují podporu.

| Aktivních klientů | Trenér zaplatí měsíčně | Pro koho                                  |
| ----------------- | ---------------------- | ----------------------------------------- |
| 1–3               | 0 Kč                   | Vyzkoušení, trenér s pár klienty          |
| 10                | 343 Kč                 | Začínající trenér                         |
| 15                | 588 Kč                 | Typický trenér v pilotu                   |
| 40                | 1 490 Kč (strop)       | Respondentka z rozhovoru, menší psí škola |

**Proč takhle:**

- Trenér platí podle toho, kolik klientům mezi lekcemi pomáhá, ne podle počtu psů. Respondentka má kolem 40 klientů, tarif do 15 psů jí neseděl.
- Tři klienti zdarma snižují bariéru: trenér si aplikaci vyzkouší na pár klientech, než za ni začne platit.
- Strop dělá cenu předvídatelnou pro psí školy.
- Trenér prodává podporu mezi lekcemi jako službu. Když za ni klientovi účtuje např. 100 Kč měsíčně navíc, zbude mu na každém placeném klientovi 51 Kč a na prvních třech celá stovka.
- Výpočet a cashflow jsou v [nákladové struktuře](nakladova-struktura.xlsx).

## Bod zvratu

Výpočet je v [nákladové struktuře](nakladova-struktura.xlsx). Všechny předpoklady jsou v listu _Unit_Economics_ a jdou přepsat.

| Předpoklad                   | Hodnota                                  |
| ---------------------------- | ---------------------------------------- |
| Vývoj MVP                    | 4 lidé × 8 h týdně × 10 týdnů = 320 h    |
| Sazba vývojáře               | 600 Kč / h (junior, potvrdit s Honzou)   |
| Pilot zdarma                 | 1.–3. měsíc po spuštění                  |
| Noví platící trenéři         | 3 měsíčně do 12. měsíce, pak 4, od 25. 5 |
| Odchod platících trenérů     | 3 % měsíčně                              |
| Aktivních klientů na trenéra | 15, trenér platí 588 Kč měsíčně          |

| Výsledek                                  | Kdy                                     |
| ----------------------------------------- | --------------------------------------- |
| Měsíční příjmy pokryjí měsíční náklady    | 15. měsíc, při ≈ 34 platících trenérech |
| Bez nákladů na získání nových trenérů     | 21 platících trenérů                    |
| Vrátí se investice do vývoje (192 000 Kč) | 34. měsíc                               |

Cíl z FB1, návratnost do 6 měsíců, s tímto ceníkem a tempem získávání trenérů nesplníme. Největší páky jsou počet trenérů, kteří začnou platit, a počet aktivních klientů na trenéra. Psí škola se 40 klienty platí strop 1 490 Kč, tedy 2,5× víc než typický trenér.

## Doporučení: kudy dál

1. **Postavit MVP jen pro jádro z rozhovoru** (zadání od trenéra, týden, záznam). Tak to zadala PO pro sprint 2 a drží to náklady na vývoj na 320 h.
2. **Pilot se 3–5 trenéry z okolí Veroniky** ověří dva nejrizikovější předpoklady: klienti zaplatí trenérovi za podporu mezi lekcemi a trenér má v aplikaci aspoň 15 aktivních klientů.
3. **Rozhodnout po pilotu podle metrik:** začne-li platit méně než 40 % trenérů nebo mají-li výrazně méně klientů, upravit ceník (strop, cena za klienta) dřív, než se investuje do dalších funkcí.
4. **Cílit na psí školy:** jedna škola nahradí 2–3 samostatné trenéry a zkrátí cestu k bodu zvratu.

## Co musí platit, aby model fungoval

1. Psovodi budou deník v telefonu používat místo papíru, nebo vedle něj.
2. Klienti zaplatí trenérovi víc za lekci s písemným zadáním a podporou mezi lekcemi.
3. Psovod, který aplikaci používá sám, dokáže svého trenéra přesvědčit, aby si založil účet a pozval ho.

## Změny ve verzi 1.5

Podle hodnocení Sprintu 1 (náklady nebyly reálné a metriky neměřily dopad na byznys):

- **Cost Structure:** doplněn vývoj MVP (320 h × 600 Kč), údržba, získávání trenérů a platební brána. Cashflow je na 36 měsíců místo 12.
- **Bod zvratu:** měsíční v 15. měsíci místo 4., návratnost vývoje ve 34. měsíci. Přibyla sekce s předpoklady a doporučením.
- **Key Metrics:** místo používání aplikace měří příjem, konverzi trenérů na platící, odchod a náklady na získání. Otevírání zadání zůstalo jako předstihový ukazatel.
- **High-Level Concept:** „Deník psa, do kterého píše i trenér“ místo „Deník psa s trenérem uvnitř“.

## Změny ve verzi 1.4

Po FB 2 platí jeden model. Varianta B z verze 1.3-B je potvrzená PO a sloučená s verzí 1.3:

- **Kdo začíná:** psovod může aplikaci používat sám a zdarma jako deník psa, nebo ho pozve trenér. Zve vždycky trenér, psovod trenéra nezve.
- **Problem, Solution, UVP:** přibyl deník psa a poznámky ze seminářů. UVP má zvlášť hodnotu pro psovoda a pro trenéra.
- **Customer Segments, Channels, Early Adopters:** přibyli psovodi bez trenéra a cesta „psovod řekne trenérovi“.
- **Key Metrics:** přibylo používání deníku bez trenéra.
- **Revenue:** tarify Solo (490 Kč do 15 psů) a Pro (990 Kč) nahradila platba za aktivního klienta.
- **Proč:** trenérce WhatsApp stačí a úsporu času jako argument nevnímá. Bolest nese klient, který se k videím vrací a ze seminářů má jen vlastní poznámky. Papírový deník pro každého psa a sport už dnes existuje, aplikace navazuje na zvyk.

## Změny ve verzi 1.3

Podle [rozhovoru s trenérkou](rozhovor/vysledky.md) a [feedbacku PO z FB1](po-feedback.md#fb1-před-rozhovorem):

- **Problem:** hlavním problémem je zadání, které si klient z lekce nezapamatuje (H4 a H9 podpořeny). Organizace více disciplín a srovnávání efektivity vypadly, protože H1 se nepotvrdila a trenérka historii tréninků nevede.
- **Existing Alternatives:** doplněno ústní zadání, poznámky klienta, WhatsApp a papírové deníky. Strava a habit trackery vypadly, v rozhovoru se nepoužívají.
- **Solution a UVP:** důraz na zadání od trenéra (princip, instrukce, kritérium) a na dotaz s videem u konkrétního tréninku. Původní „vidíte, co klienti odcvičili“ vypadlo, protože trenérka od klientů kontrolu nevyžaduje a pokrok pozná na další lekci.
- **Customer Segments a Early Adopters:** trenéři vedou desítky klientů (respondentka kolem 40 měsíčně), klienti chodí cca 1× měsíčně.
- **Key Metrics:** retence „≥ 2 zápisy týdně“ nahrazena metrikami, které odpovídají tomu, jak klienti zadání skutečně používají.
- **Cost Structure:** doplněna práce týmu a cíl návratnosti (FB1).
