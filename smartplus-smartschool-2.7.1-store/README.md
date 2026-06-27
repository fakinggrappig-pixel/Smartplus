# SmartPlus voor Smartschool

SmartPlus maakt Smartschool handiger voor leerlingen met puntenoverzicht, focus-profielen, thema’s, lokale meldingen en een lokale berichtcoach.

Niet officieel van Smartschool of Smartbit.

Website: https://gleaming-pithivier-6d8d03.netlify.app/  
Support: bramlesage1@icloud.com  
Supportpagina: https://gleaming-pithivier-6d8d03.netlify.app/support.html  
Privacybeleid: https://gleaming-pithivier-6d8d03.netlify.app/privacy.html  
Donate: https://buymeacoffee.com/smartplus

## Nieuw in 2.7.1

- Belangrijkste fix: SmartPlus springt niet meer naar boven wanneer je iets wijzigt in het paneel. Scrollpositie, focus en cursorpositie worden bewaard bij renders.
- Minder volledige her-renders tijdens typen: inputs bewaren nu rustig en pas waar nodig wordt de UI opnieuw opgebouwd.
- Focus timer verbeterd: pauzeduur is nu een echt numeriek veld met validatie van 1 tot 60 minuten.
- Pomodoro toont duidelijk Focus/Pauze met een label in plaats van een readonly inputveld.
- Timer update de klok stabieler zonder elke seconde het hele paneel te vervangen.
- Puntenmodule rustiger gemaakt: doelen per vak zijn makkelijker aanpasbaar, doelvoortgang kan live bijwerken en statusmeldingen zijn minder technisch.
- Thema-module stabieler: live preview flikkert minder, geselecteerde/preview-thema’s zijn duidelijker en geïmporteerde custom thema’s worden veiliger gevalideerd.
- Technische fixes: robuustere nested state updates, geen dubbele mousemove listener voor leeslineaal, betere numeric input-validatie en veiligere theme import.

## Vorige update 2.6.0

- Bugfix: de knop **Directer** in de berichtcoach werkt nu echt.
- Opruiming: dubbele oude functies voor punten samenvoegen, normalisatie en korte URL’s zijn verwijderd.
- Puntenmodule uitgebreid met puntdoelen per vak, voortgangsbalken, trendlabels, visuele SVG-grafiek, periodevergelijking en verbeterde CSV-export.
- Puntenmodule geeft duidelijkere informatie rond nieuwe punten, periodes en dalende trends.
- Focus-module uitgebreid met Pomodoro-pauzes, lokale focus-statistieken, een lokaal geluidssignaal en een nieuwe Spotlight-modus.
- Thema-module uitgebreid met live preview bij hover, soepelere thema-overgangen en een slimme thema-suggestie voor het moment van de dag/het seizoen.
- Berichtcoach uitgebreid met directe toon, toon-waarschuwing, korte en uitgebreide versies, betere onderwerp/context en lokale regelgebaseerde verbetering.
- Cross-module: dalende puntentrends en focus-sessies kunnen lokale SmartPlus-meldingen tonen.

## Vorige update 2.5.0

- Nieuwe module **Meldingen & herinneringen**.
- Lokale Chrome-melding wanneer een scan nieuwe punten vindt.
- Lokale Chrome-melding wanneer de focus-timer klaar is.
- Eigen herinneringen met titel, tijdstip en korte notitie.
- Stille uren zodat SmartPlus ’s avonds/nachts geen meldingen toont.
- Betere startpagina zonder negatieve blokken.
- Bugfix voor opslag-sync waardoor het paneel minder snel opnieuw rendert tijdens typen.
- Bugfix voor normalisatie-regex.

## Privacy

SmartPlus gebruikt geen externe AI, geen tracking, geen advertenties en geen externe server. Instellingen, lokale punten en herinneringen blijven in Chrome storage van de gebruiker.
