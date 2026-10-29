# Klas+ op je iPhone via AltStore (zonder Mac)

Een Mac in de cloud (GitHub Actions) bouwt de app. AltStore op je pc zet hem met je eigen Apple ID op je iPhone.

## Eenmalig: project op GitHub zetten

1. Maak op github.com een nieuwe repository, bijvoorbeeld `klasplus`.
   - Public: de Mac-minuten zijn gratis en onbeperkt.
   - Private: ongeveer 200 Mac-minuten per maand gratis; één build duurt zo'n 10 à 15 minuten.
2. In deze projectmap, in een terminal:

   ```bash
   git init
   git add .
   git commit -m "Klas+"
   git branch -M main
   git remote add origin https://github.com/JOUW-NAAM/klasplus.git
   git push -u origin main
   ```

   `node_modules`, `dist` en de gegenereerde iOS-bestanden gaan niet mee (zie `.gitignore`).

## Elke keer: .ipa bouwen

1. Ga op GitHub naar je repository → tabblad **Actions** → **iOS .ipa bouwen** → **Run workflow**.
2. Wacht tot de run groen is (10 à 15 minuten).
3. Open de run en download onderaan het artifact **Klasplus-ipa**. Dat is een .zip; pak hem uit, dan heb je `Klasplus.ipa`.

Na een wijziging in de code: eerst `git add .`, `git commit -m "…"` en `git push`, dan opnieuw **Run workflow**.

## Op de iPhone zetten met AltStore

1. Installeer op je pc **iTunes** en **iCloud** van de Apple-website (niet de Microsoft Store-versie), en daarna **AltServer** van altstore.io.
2. Sluit je iPhone met een kabel aan, start AltServer (icoon rechtsonder bij de klok) → **Install AltStore** → kies je iPhone en log in met je Apple ID.
3. Op de iPhone: Instellingen → Algemeen → VPN en apparaatbeheer → vertrouw je Apple ID. Zet ook **Ontwikkelaarsmodus** aan (Instellingen → Privacy en beveiliging).
4. Zet `Klasplus.ipa` op je iPhone (bijvoorbeeld via iCloud Drive of AirDrop) en open hem in AltStore → **My Apps** → **+**.

Met een gratis Apple ID moet AltStore de app elke 7 dagen vernieuwen. Dat gaat vanzelf als je iPhone en pc op hetzelfde wifi zitten en AltServer draait.
