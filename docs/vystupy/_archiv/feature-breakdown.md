# TrainLoop — Feature breakdown (pracovní verze)

**Stav:** vlastní nástřel týmu na hackathon 9. 10. 2026.
**Závazný podklad:** upravený plán (UP). Co v něm stojí, platí a neotevíráme to. Ostatní podklady ho jen doplňují tam, kde nic neříká.
**Další podklady:** brief „TrainLoop / PawPlan“ (16. 9.), upravený plán po pivotu (říjen), Lean Canvas týmu 5 (4. 10.).
**Chybí:** zjištění z rozhovoru s uživatelem, ten proběhne až na hackathonu. Řádky se zdrojem *Předpoklad týmu* je potřeba ověřit.

**Zkratky zdrojů:** **B** = původní brief · **UP** = upravený plán (pivot) · **LC** = Lean Canvas · **P** = přednáška 4IT580 (technické features) · **PT** = předpoklad týmu (nutno ověřit)
**Priorita:** **MVP** = bez toho produkt neřeší hlavní problém · **Nice** = nice to have · **Out** = vědomě nestavíme 
**Stav:** **Dáno UP** = stanoví upravený plán · **Navrženo** = návrh týmu k projednání s PO

> Testovací otázka u každého řádku: *„Kdyby tohle chybělo, řeší produkt pořád hlavní problém z Lean Canvasu?“*
> Hlavní problémy z LC: (1) obtížná organizace cviků v tréninku, (2) těžké srovnávání efektivity tréninků, (3) obtížná komunikace trenér ↔ majitel.

---

## Přehled epiců

| Epic | Jazykem klienta | MVP features |
| --- | --- | --- |
| E1 Účet | Registrace, přihlášení, kdo jsem | 3 |
| E2 Pes a disciplíny | Profil psa a oblasti, ve kterých trénuje | 4 |
| E3 Sdílení s trenérem | Jak se psovod a trenér propojí | 4 |
| E4 Cíle a plán | Nelineární plán: cíl → úkoly → posun, návrat, větvení | 10 |
| E5 Týdenní rozvrh | Jedna obrazovka s týdnem napříč disciplínami | 4 |
| E6 Záznam tréninku | % úspěšnosti, poznámka, video, historie | 4 |
| E7 Zpětná vazba | Komentáře mezi psovodem a trenérem | 1 |
| E8 Přehled pro trenéra | Co klienti odcvičili a na co ještě nereagoval | 3 |
| E9 Notifikace | Upozornění, aby se na vlákno nezapomnělo | 0 |
| E10 Tržiště plánů | Prodej, nákup, recenze (z původního briefu) | 0 (celé Out) |
| E11 Technický základ | Věci, které klient nevidí, ale stojí čas | 6 |

---

## Feature breakdown

| ID | Epic | Feature | Popis (co, pro koho, proč) | Priorita | Zdroj | Otevřené otázky | Stav |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F-01 | E1 Účet | Registrace a přihlášení | Psovod i trenér si založí účet e-mailem a heslem. Bez účtu nejde sdílet psa s trenérem. | MVP | PT | — | Navrženo |
| F-02 | E1 Účet | Obnova zapomenutého hesla | Uživatel si přes e-mail nastaví nové heslo. | MVP | PT | — | Navrženo |
| F-03 | E1 Účet | Role podle vztahu ke psovi | Je jen jeden typ účtu. U psa, kterého vlastním, jsem psovod, u psa, kterého mi někdo nasdílel, trenér. Trenér tak může mít i vlastního psa. | MVP | PT | Musí se trenér registrovat jako „trenér“ (kvůli budoucímu předplatnému)? Může být jeden člověk obojí? | Navrženo |
| F-04 | E1 Účet | Profil uživatele | Jméno, kontakt, u trenéra krátké představení (zaměření, disciplíny). Psovod vidí, s kým spolupracuje. | Nice | B | V briefu patřil profil k tržišti. Je po pivotu potřeba víc než jméno? | Navrženo |
| F-05 | E2 Pes | Založení profilu psa | Psovod vyplní jméno a plemeno (případně věk a fotku). Pes je středem všech cílů, rozvrhu i sdílení. | MVP | B, UP | Jaké další údaje jsou potřeba (věk, váha, zdravotní omezení)? | Dáno UP |
| F-06 | E2 Pes | Více psů na účtu | Psovod má víc psů a týden vidí přes všechny dohromady. | MVP | B | Brief to má jednou v MVP a jednou jako „prostor pro návrhy“, UP o tom mlčí. Potvrdit. | Navrženo |
| F-07 | E2 Pes | Disciplíny psa | Psovod psovi přiřadí tréninkové oblasti, buď z nabídky (canicross, nosework, poslušnost…), nebo vlastní. Žádná šablona nediktuje. | MVP | B, UP | Mají mít disciplíny podkategorie (Poslušnost → Pozornost)? V briefu sloužily k vyhledávání v tržišti. | Dáno UP |
| F-08 | E2 Pes | Úprava a odebrání psa a disciplíny | Změna údajů, ukončení disciplíny, kterou už pes netrénuje (historie zůstane). | MVP | PT | Smazat úplně, nebo jen archivovat? | Navrženo |
| F-09 | E3 Sdílení | Pozvání trenéra e-mailem | Psovod zadá e-mail trenéra, trenér dostane pozvánku a po přijetí vidí psa. Nahrazuje screenshoty sešitu. | MVP | UP | Co když trenér ještě nemá účet (pozvánka vede na registraci)? | Dáno UP |
| F-10 | E3 Sdílení | Sdílení kódem | Psovod vygeneruje kód, trenér ho zadá a psa si připojí. Hodí se osobně na lekci. | MVP | UP | Jak dlouho kód platí? | Dáno UP |
| F-11 | E3 Sdílení | Trenér pozve klienta | Trenér pošle pozvánku psovodovi, ať mu psa nasdílí. Usnadní onboarding klientů trenéra. | Nice | LC, PT | — | Navrženo |
| F-12 | E3 Sdílení | Více trenérů u jednoho psa | Pes má víc trenérek, např. jednu na canicross a jednu na poslušnost. | MVP | B, UP | — | Dáno UP |
| F-13 | E3 Sdílení | Odebrání přístupu trenérovi | Psovod ukončí spolupráci a trenér psa přestane vidět. | MVP | PT | Zůstanou trenérovy komentáře v historii? | Navrženo |
| F-14 | E3 Sdílení | Sdílení jen vybraných disciplín | Trenér vidí jen disciplíny, které vede. | Nice | PT | Navazuje na otázku u F-12. | Navrženo |
| F-15 | E4 Plán | Vytvoření cíle | V dané disciplíně psovod nebo trenér založí cíl, např. „5 km pod 5 min/km“ nebo „pozornost v silně rušivém prostředí“. | MVP | B, UP | Má cíl termín nebo měřitelné kritérium splnění? | Dáno UP |
| F-16 | E4 Plán | Úkoly k cíli | K cíli se zapíší dílčí úkoly v pořadí (oční kontakt → delší podržení → mírné rušivky → silné rušivky), každý s názvem a instrukcí. | MVP | B, UP | Mají úkoly vlastní kritérium „zvládnuto“ (např. 3× za sebou nad 80 %)? | Dáno UP |
| F-17 | E4 Plán | Stav úkolu a posun po cestě | Úkol je čekající / aktuální / zvládnutý / přeskočený. Je vidět, kde na cestě pes právě je. | MVP | B | Rozhoduje o posunu člověk, nebo i systém podle % úspěšnosti? | Navrženo |
| F-18 | E4 Plán | Návrat o krok zpět | Když psovi nejde, vrátí se aktuální pozice na předchozí úkol. Předchozí pokusy zůstanou v historii. | MVP | B, UP | — | Dáno UP |
| F-19 | E4 Plán | Přeskočení úkolu | Úkol jde přeskočit, když ho pes zvládá rovnou. | MVP | B, UP | — | Dáno UP |
| F-20 | E4 Plán | Vložení mezikroku | Do cesty se kamkoli vloží nový úkol, např. když je skok mezi dvěma kroky moc velký. | MVP | B | — | Navrženo |
| F-21 | E4 Plán | Rozvětvení cíle | Cíl se rozdělí na dvě samostatné cesty, které se trénují souběžně. | MVP | B, UP | Jak přesně vypadá na konkrétním příkladu: spojí se cesty znovu, nebo vzniknou dva cíle? Potřeba pro wireframe. | Dáno UP |
| F-22 | E4 Plán | Úpravy plánu trenérem | Přizvaný trenér zakládá a upravuje cíle a úkoly stejně jako psovod. | MVP | UP | — | Dáno UP |
| F-23 | E4 Plán | Dokončení a archivace cíle | Splněný nebo opuštěný cíl zmizí z aktivních, ale zůstane v historii. | MVP | PT | — | Navrženo |
| F-24 | E4 Plán | Přehled cílů psa | Na profilu psa jsou všechny rozjeté cíle podle disciplín a u každého aktuální krok. | MVP | B | — | Navrženo |
| F-25 | E4 Plán | Historie změn plánu | U cíle je vidět, kdo a kdy co změnil (vrácení, přeskočení, nový krok). | Nice | PT | Stačí, když se změna objeví ve vlákně komentářů? | Navrženo |
| F-26 | E4 Plán | Kopírování cíle / šablona trenéra | Trenér s 5–20 klienty zkopíruje osvědčený plán k dalšímu psovi. | Nice | LC, PT | Předstupeň budoucího sdílení plánů. Chce to PO? | Navrženo |
| F-27 | E5 Týden | Týdenní kalendář | Hlavní obrazovka: aktuální týden po dnech, úkoly ze všech disciplín (a psů) najednou, barevně podle disciplíny. | MVP | B, UP | — | Dáno UP |
| F-28 | E5 Týden | Naplánování úkolu na den | Aktivní úkol z libovolného cíle se dá zařadit do konkrétního dne, i víckrát za týden. | MVP | B | **Klíčové:** je položka v kalendáři jednorázová, nebo se úkol cvičí opakovaně (3× týdně pozornost)? | Dáno UP |
| F-29 | E5 Týden | Přesun mezi dny | Naplánovaný trénink jde přesunout na jiný den (na desktopu tažením, na mobilu volbou dne). | MVP | UP | — | Dáno UP |
| F-30 | E5 Týden | Přepínání týdnů | Zpět do minulých týdnů (co se odcvičilo) a dopředu (plánování). | MVP | PT | — | Navrženo |
| F-31 | E5 Týden | Filtr podle psa a disciplíny | Zobrazení jen jednoho psa nebo jedné oblasti. | Nice | PT | — | Navrženo |
| F-32 | E5 Týden | Nesplněné tréninky | Co se v týdnu neodcvičilo, je vidět a dá se jedním krokem přesunout do dalšího týdne. | Nice | PT | Co se má stát s neodcvičeným úkolem? | Navrženo |
| F-33 | E5 Týden | Hlídání vyváženosti | Upozornění, že některá disciplína tento týden nemá žádný trénink. | Nice | B | — | Navrženo |
| F-34 | E5 Týden | Návrh rozvrhu | Aplikace sama navrhne rozložení aktivních úkolů do týdne a psovod ho jen upraví. Řeší „víkendové skládání“. | Nice | B | Jaká pravidla (dny, max. tréninků denně)? Ověřit, jak moc to bolí. | Navrženo |
| F-35 | E6 Záznam | Zápis výsledku tréninku | Po odcvičení psovod zapíše % úspěšnosti a poznámku. Rychle, z mobilu, přímo z týdne. | MVP | B, UP | Jak se % určuje (počet úspěšných opakování, odhad, škála po 10)? | Dáno UP |
| F-36 | E6 Záznam | Odkaz na video | K záznamu se přiloží odkaz (YouTube unlisted, cloud…), takže video už neleží odpojené v galerii. | MVP | UP | Jeden odkaz, nebo víc? | Dáno UP |
| F-37 | E6 Záznam | Historie tréninků úkolu | U úkolu je seznam všech záznamů v čase. Je vidět, co fungovalo, a dá se to porovnat mezi týdny. | MVP | B, LC | — | Navrženo |
| F-38 | E6 Záznam | Úprava a smazání záznamu | Oprava překlepu nebo špatně zapsaného %. | MVP | PT | — | Navrženo |
| F-39 | E6 Záznam | Graf vývoje úspěšnosti | Vývoj % v čase u úkolu nebo cíle. | Nice | B, LC | — | Navrženo |
| F-40 | E6 Záznam | Náhled videa | Odkaz na YouTube se rovnou přehraje v aplikaci. | Nice | PT | — | Navrženo |
| F-41 | E6 Záznam | Podrobnější záznam | Volitelně počet opakování, prostředí, úroveň rušivek, délka tréninku. | Nice | B | Otevřená otázka z briefu: stačí % a poznámka? Ověřit v rozhovoru. | Navrženo |
| F-42 | E7 Komentáře | Vlákno komentářů | Pod konkrétním úkolem si psovod a trenér asynchronně píšou a trenér reaguje na video a výsledek. Nahrazuje WhatsApp. | MVP | UP, LC | — | Dáno UP |
| F-43 | E7 Komentáře | Nepřečtené komentáře | Je vidět, kde je nová odpověď, kterou jsem ještě nečetl. | Nice | PT | Možná MVP, bez toho se vlákno snadno přehlédne. | Navrženo |
| F-44 | E8 Trenér | Seznam klientů | Trenér vidí všechny psy, které mu klienti nasdíleli, s jejich psovody. | MVP | UP, LC | — | Navrženo |
| F-45 | E8 Trenér | Záznamy čekající na reakci | Seznam nových záznamů tréninku od klientů, na které ještě nereagoval. Jádro hodnoty pro platícího zákazníka. | MVP | LC | Odpovídá UVP „vidíte, co klienti mezi lekcemi odcvičili“ a metrice „>60 % úkolů s reakcí“. | Navrženo |
| F-46 | E8 Trenér | Týden a plán klienta | Trenér otevře psa a vidí jeho týden, cíle a historii, tedy plný kontext. | MVP | UP | — | Dáno UP |
| F-47 | E8 Trenér | Soukromé poznámky ke klientovi | Poznámky, které psovod nevidí. | Nice | PT | — | Navrženo |
| F-48 | E9 Notifikace | E-mail o novém komentáři | Psovod nebo trenér dostane e-mail, když mu druhá strana odpoví. | Nice | B | E-mail, push, nebo souhrn jednou denně? | Navrženo |
| F-49 | E9 Notifikace | Upozornění na změnu plánu | Psovod se dozví, že trenér upravil plán. | Nice | PT | — | Navrženo |
| F-50 | E9 Notifikace | Upozornění trenéra na nový záznam | Trenér se dozví, že klient odcvičil a nahrál výsledek. | Nice | PT | — | Navrženo |
| F-51 | E9 Notifikace | Připomenutí tréninku | Ráno přijde připomenutí, co je dnes naplánované. | Nice | PT | — | Navrženo |
| F-52 | E10 Tržiště | Zveřejnění plánu k prodeji | Hotový plán se nabídne ostatním jako „on sale“. | Out | UP | — | Dáno UP |
| F-53 | E10 Tržiště | Nákup plánu, platby, provize | — | Out | UP | — | Dáno UP |
| F-54 | E10 Tržiště | Hodnocení a recenze plánů | — | Out | UP | — | Dáno UP |
| F-55 | E10 Tržiště | Hledání plánů podle kategorií, dotaz autorovi | — | Out | UP | — | Dáno UP |
| F-56 | E10 Tržiště | Předplatné trenérů a fakturace | Budoucí byznys model (cca 490 Kč/měsíc), tento semestr bez plateb. | Out | LC, UP | Má MVP aspoň rozlišit „trenérský účet“? Viz F-03. | Dáno UP |
| F-57 | — | Nahrávání videí na vlastní servery | Řeší se externími odkazy. | Out | UP | — | Dáno UP |
| F-58 | — | Napojení na Stravu a běžecké aplikace | — | Out | B | — | Navrženo |
| F-59 | — | Obecný výcvik mimo psy | Model cíl → úkoly → týden by šel i na jiné oblasti, začínáme ale u psů. | Out | B | Otevřená otázka z briefu. | Navrženo |
| F-60 | E11 Technický | Staging a CI/CD | Každá změna se automaticky otestuje a nasadí na staging, kde ji PO uvidí dřív než uživatelé. | MVP | P | Kdo bude mít přístup na staging? | Navrženo |
| F-61 | E11 Technický | Automatické testy | Hlavní obrana proti chybám od agenta, hlavně u logiky nelineárního plánu. | MVP | P | — | Navrženo |
| F-62 | E11 Technický | Oprávnění | Pravidla, kdo vidí a upravuje psa, plán, záznamy a komentáře (vlastník, trenér, cizí). | MVP | PT | Odvozeno z F-03, F-12, F-14. | Navrženo |
| F-63 | E11 Technický | Osobní údaje a GDPR | Souhlas se zpracováním, smazání účtu včetně dat, sdílení údajů s trenérem jen se souhlasem. | MVP | P | Kdo je správce údajů, trenér, nebo my? | Navrženo |
| F-64 | E11 Technický | Zálohy a obnova dat | Pravidelná záloha databáze, aby historie tréninků nezmizela. | MVP | P | — | Navrženo |
| F-65 | E11 Technický | Použitelnost na mobilu | Psovod zapisuje venku po tréninku, takže aplikace musí plně fungovat na telefonu. | MVP | LC, PT | LC říká „mobilní aplikace“. Stačí responzivní web nebo PWA, nebo je potřeba nativní app? | Navrženo |
| F-66 | E11 Technický | Monitoring a logy | O chybě se dozvíme dřív než uživatel. | Nice | P | — | Navrženo |
| F-67 | E11 Technický | Měření indikátorů | Počet trenérů, psů, podíl záznamů s reakcí trenéra (indikátory z LC). | Nice | LC | — | Navrženo |
| F-68 | E11 Technický | Demo data | Ukázkový psovod, trenér a pes s rozjetými cíli pro prezentace a testování. | Nice | PT | — | Navrženo |

---

## Otázky pro PO na hackathon (seřazeno podle dopadu)

Jen věci, které upravený plán nerozhoduje.

1. **Jak vypadá větvení cíle v praxi?** Potřebujeme jeden konkrétní příklad od Veroniky (Zoe), podle něj se navrhne obrazovka plánu. → F-21
2. **Opakuje se úkol v týdnu?** Je položka v kalendáři „úkol“, nebo „trénink úkolu v daný den“? Mění datový model rozvrhu i záznamů. → F-28, F-35
3. **Musí být trenér zvláštní typ účtu**, nebo stačí role podle psa? → F-03
4. **Kdo rozhoduje o posunu na další úkol** a podle čeho (ručně, nebo podle %)? → F-16, F-17
5. **Mobil:** stačí web použitelný na telefonu? → F-65
6. **Víc psů na účet v MVP?** → F-06
7. **Co s neodcvičeným tréninkem** na konci týdne? → F-32
8. **Jak dlouho platí sdílecí kód** a co když pozvaný trenér ještě nemá účet? → F-09, F-10

## Co ověřit v rozhovoru s uživatelem

- Jak dnes skládá týden (kolik času to zabere, podle čeho rozhoduje). → F-34, F-33
- Poslední situace, kdy se vracela o krok nebo plán větvila. → F-18–F-21
- Jak dnes měří úspěšnost a co by chtěla porovnávat mezi týdny. → F-35, F-39, F-41
- Jak dnes probíhá zpětná vazba od trenérky (WhatsApp, video, jak rychle reaguje). → F-42, F-45
- Kde a na čem zapisuje po tréninku (venku na mobilu?). → F-65
