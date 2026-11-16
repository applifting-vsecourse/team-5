# Záznamy architektonických rozhodnutí (ADR)

Rozhodnutí o datovém modelu a struktuře aplikace, která se drahé vracejí nebo svazují kód i mimo story, ze které vznikla. Před změnou datového modelu nebo struktury aplikace si přečti ta, která se jí týkají.

Staré záznamy se nepřepisují, přidává se nový. Nahrazené rozhodnutí dostane stav „Nahrazeno NNNN“. Produktová pravidla patří do akceptačních kritérií story a detaily implementace do popisu PR, ne sem.

Formát: `NNNN-nazev.md`, části Stav, Kontext, Rozhodnutí, Zvažované možnosti a Důsledky. Stav je _Navrženo_, dokud ho tým s PO nepotvrdí, pak _Přijato_.

| #                                                                     | Rozhodnutí                                                     | Stav     | Jednou větou                                                                                                                                                     |
| --------------------------------------------------------------------- | -------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [0001](0001-vzor-cile-je-json-snimek.md)                              | Vzor cíle je JSON snímek s verzí                               | Navrženo | `GoalTemplate.content` drží obsah cíle jako JSON hlídaný zod schématem, takže každá změna kopírovaných polí cíle musí upravit i schéma vzoru a případně verzi.   |
| [0002](0002-discipliny-se-paruji-podle-nazvu-bez-velikosti-pismen.md) | Disciplíny se párují podle názvu bez ohledu na velikost písmen | Navrženo | Katalog disciplín zůstává nesjednocený, proto se disciplíny mezi psy různých majitelů párují podle názvu bez ohledu na velikost písmen, ne podle `disciplineId`. |
