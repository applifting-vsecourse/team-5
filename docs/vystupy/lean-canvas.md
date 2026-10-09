# Lean Canvas — TrainLoop

**Designed for:** TrainLoop | **Designed by:** Tým 5 | **Date:** 9.10.2026 | **Version:** 1.3

---

| **Problem** | **Solution** | **Unique Value Proposition** | **Unfair Advantage** | **Customer Segments** |
| :--- | :--- | :--- | :--- | :--- |
| • Klienti si z ústního zadání na lekci zapamatují jen část a doma nevědí, jak postupovat, takže dělají zbytečné chyby<br>• Zpětná vazba mezi lekcemi běží přes WhatsApp odtrženě od zadání a videa i odpovědi se klientovi ztrácejí v chatu<br>• Trenér opakovaně vysvětluje totéž („A jak bylo tohle?“) | Responzivní webová aplikace (optimalizovaná pro mobilní telefony / PWA) pro trenéra a jeho klienty. Trenér zadá plán: nejdřív princip a na co si dát pozor, pak cviky s instrukcí a kritériem zvládnutí. Klient ho má v týdenním kalendáři, trénink může přesunout nebo přeskočit a k odcvičenému tréninku pošle výsledek, poznámku a odkaz na video. Trenér odpoví ve vlákně u tréninku a rovnou upraví plán. | Vaši klienti doma přesně vědí, co a jak cvičit, a vy nemusíte totéž vysvětlovat znovu.<br><br>Zadání z lekce v telefonu klienta, týden v kalendáři a dotaz s videem u konkrétního tréninku. Celý výcvik psa na jednom místě. | Neexistuje | **Zákazník (platí):** Nezávislí trenéři, trenérky a psí školy, kteří vedou desítky klientů. Klienti chodí na lekci zhruba 1× měsíčně a mezi lekcemi trénují sami podle zadání.<br><br>**Uživatel (zdarma):** Psovodi, kteří s jedním či více psy trénují pod vedením trenéra a dostávají úkoly na doma. |
| **Existing Alternatives** | **Key Metrics** | **High-Level Concept** | **Channels** | **Early Adopters** |
| • Ústní zadání na lekci a vlastní poznámky klienta<br>• WhatsApp (text a video) mezi lekcemi<br>• Papírové deníky trenéra (zvlášť na psa a sport)<br>• Excel | • **10 platících trenérů** do 6 měsíců od spuštění pilotu<br>• **Minimálně 50 psů** aktivně vedených v aplikaci<br>• **Používání zadání:** ≥ 50 % klientů otevře zadání mezi lekcemi alespoň 1× týdně<br>• **Náhrada WhatsAppu:** ≥ 50 % dotazů a videí od klientů přichází přes TrainLoop (podle trenérů v pilotu) | TrueCoach / TrainingPeaks pro trenéry psů | • Osobní oslovení trenérů a psích škol (přes kontakty PO a psí akce)<br>• Přirozená virální smyčka: trenér onboarduje své klienty | • Lidé, se kterými už trénuje Veronika (PO): její trenéři a trenérky a jejich klienti.<br><br>• Nezávislí trenéři a trenérky, kteří dávají zadání ústně na lekci a mezi lekcemi odpovídají klientům přes WhatsApp. |

| **Cost Structure** | **Revenue Structure** |
| :--- | :--- |
| • Běžná cloudová infrastruktura (databáze, hosting)<br>• Vývoj a údržba webové aplikace<br>• Práce vývojového týmu (hodinová sazba × hodiny, výpočet po konzultaci s Honzou)<br>• Doména a DNS<br>• Cíl: návratnost do cca 6 měsíců (viz [nákladová struktura](nakladova-struktura.xlsx)) | **B2B SaaS předplatné pro trenéry:**<br>• Solo trenér: 490 Kč / měsíc (do 15 aktivních psů)<br>• Psí škola / Pro: 990 Kč / měsíc (neomezeně psů)<br>• Pro psovody: 0 Kč (včetně více psů v rámci výcviku pod trenérem) |

## Změny ve verzi 1.3

Podle [rozhovoru s trenérkou](rozhovor/vysledky.md) a [feedbacku PO z FB1](po-feedback-fb1.md):

- **Problem:** hlavním problémem je zadání, které si klient z lekce nezapamatuje (H4 a H9 podpořeny). Organizace více disciplín a srovnávání efektivity vypadly, protože H1 se nepotvrdila a trenérka historii tréninků nevede.
- **Existing Alternatives:** doplněno ústní zadání, poznámky klienta, WhatsApp a papírové deníky. Strava a habit trackery vypadly, v rozhovoru se nepoužívají.
- **Solution a UVP:** důraz na zadání od trenéra (princip, instrukce, kritérium) a na dotaz s videem u konkrétního tréninku. Původní „vidíte, co klienti odcvičili“ vypadlo, protože trenérka od klientů kontrolu nevyžaduje a pokrok pozná na další lekci.
- **Customer Segments a Early Adopters:** trenéři vedou desítky klientů (respondentka kolem 40 měsíčně), klienti chodí cca 1× měsíčně.
- **Key Metrics:** retence „≥ 2 zápisy týdně“ nahrazena metrikami, které odpovídají tomu, jak klienti zadání skutečně používají.
- **Cost Structure:** doplněna práce týmu a cíl návratnosti (FB1).
