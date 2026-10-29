# De telefoon-app bouwen en testen

De app draait op twee manieren:

| Waar | Gegevens | Waarom |
|---|---|---|
| Browser (`npm run dev`, of als PWA) | Demo, met verzonnen gegevens | Een website kan niet echt inloggen (zie [inloggen-onderzoek.md](inloggen-onderzoek.md)) |
| Telefoon-app (Capacitor) | Echt, via de inlogpagina van je school | Native HTTP: geen CORS, en de in-app browser vangt `m6loapp://` op |

De keuze staat op één plek: `src/api/index.ts`.

## Android (op Windows, met de emulator)

1. Eenmalig: open Android Studio, ga naar **More Actions → Virtual Device Manager** en maak een telefoon aan
   (bijvoorbeeld Pixel 8 met een recente Android-versie, mét Google Play).
2. Bouw de app en open hem in Android Studio:

   ```
   npm run android
   ```

   Dit doet `npm run build`, `npx cap sync android` en `npx cap open android`.
3. Kies in Android Studio je emulator bovenin en druk op de groene ▶-knop.
4. Tik in de app op **Inloggen via je school**, kies je school en log in. Je komt daarna terug in de app.

Werkt het bouwen niet en gaat de foutmelding over de Java-versie? Zet dan in Android Studio onder
**Settings → Build, Execution, Deployment → Build Tools → Gradle → Gradle JDK** een JDK 21 in.

Na elke wijziging in de code: opnieuw `npm run android` (of `npm run build` en `npx cap sync android`), en
daarna opnieuw op ▶ drukken.

## iPhone zonder Mac

Voor een iPhone-app is Xcode nodig, en dat draait alleen op macOS. Zonder eigen Mac zijn er deze routes:

1. **Een Mac in de cloud laten bouwen.** Bijvoorbeeld Codemagic (heeft gratis bouwminuten en ondersteunt
   Capacitor) of GitHub Actions met een macOS-runner. Die bouwt de app op een Mac van hen.
2. **Op je eigen iPhone zetten.** Daarvoor moet de app ondertekend zijn. Met het Apple Developer Program
   (€ 99 per jaar) gaat dat via TestFlight: je installeert de app dan gewoon vanuit de TestFlight-app op je
   iPhone. Zonder betaald account kan het alleen met tijdelijke ondertekening (7 dagen geldig) via
   hulpprogramma's, en dat is omslachtig.
3. **Een Mac huren per uur** (bijvoorbeeld MacinCloud) en daar Xcode gebruiken.

Advies: ontwikkel en test eerst op de Android-emulator. Is de app stabiel, kies dan route 1 + 2 (cloud-build
+ TestFlight). Op je iPhone kun je in de tussentijd de PWA-demo gebruiken: open de site in Safari en kies
**Deel → Zet op beginscherm**.

Let op bij iOS: het iOS-project gebruikt CocoaPods, zodat de in-app-browserplugin meegaat. Op de bouw-Mac
moet daarom eerst `pod install` draaien in `ios/App`; de cloud-diensten doen dat automatisch.

## Nog te controleren met een echt account

De koppeling is getest met een nagebootste server, niet met echte gegevens. Let bij de eerste echte keer op:

- **Labels "Ingeschreven" en "KWT":** nu krijgt alleen afspraaktype 7 het label KWT, en "Ingeschreven"
  komt nog niet voor.
- **Klas en periode in de profielkaart:** komen uit `studie.omschrijving` en de cijferperiode.
- **Schoolnaam:** is nu het eerste deel van het serveradres van de school (bijvoorbeeld "Jouwschool"). Een echte
  schoolnaam hebben we nog niet gevonden in de antwoorden.
- **Eerste keer cijfers laden:** de app vraagt per cijfer de weging op, één voor één. Dat kan even duren. Daarna
  worden de wegingen bewaard.
- **Scholen die met Google inloggen:** Google weigert inloggen in een ingebouwde browser. Als je school dat
  gebruikt, is een extra route via de systeembrowser nodig.

Lukt iets niet, stuur dan de foutmelding. Of stuur een stukje van het antwoord van de server, met je naam en
cijfers onleesbaar gemaakt; dan pas ik `src/api/live/omzetten.ts` aan.
