# Klas+ op je iPhone met AltStore (Windows, zonder Mac)

AltStore zet apps die niet in de App Store staan op je iPhone. Het ondertekent de app met je eigen Apple ID,
alsof je hem zelf als ontwikkelaar hebt gemaakt. Op je pc draait daarvoor **AltServer**; op je iPhone de app **AltStore**.

> Gebruik **AltStore Classic** (met AltServer). AltStore PAL, de EU-versie, kan alleen apps uit een bron installeren,
> niet je eigen .ipa.

---

## Wat je nodig hebt

- Een Windows 10- of 11-pc.
- Je iPhone met iOS 15 of nieuwer, en de kabel.
- Een Apple ID. Een gratis account is genoeg (zie *Beperkingen* onderaan).
- Pc en iPhone op **hetzelfde wifi-netwerk** (voor het automatisch verlengen).
- Het bestand `Klasplus.ipa` (uit GitHub Actions, artifact *Klasplus-ipa*).

---

## Deel 1 — Pc klaarmaken (eenmalig)

### 1. iTunes en iCloud installeren — rechtstreeks van Apple

AltServer heeft de onderdelen van iTunes en iCloud nodig om met je iPhone en met Apple te praten.
**De versies uit de Microsoft Store werken hiervoor vaak niet.**

1. Staat iTunes of iCloud al op je pc uit de Microsoft Store? Verwijder die eerst
   (Instellingen → Apps → Geïnstalleerde apps).
2. Download en installeer **iTunes voor Windows (64-bit)** via de link op de downloadpagina van altstore.io
   of op apple.com/itunes (kies *Andere versies zoeken* → Windows, niet de Microsoft Store-knop).
3. Download en installeer **iCloud voor Windows** via de link op altstore.io (de "niet-Microsoft Store"-versie).
4. Start de pc opnieuw op.
5. Open iTunes één keer en log in als hij daarom vraagt. Open iCloud en log in met je Apple ID.

### 2. AltServer installeren

1. Ga naar **altstore.io** → *Download* → **AltServer voor Windows**.
2. Pak `AltInstaller.zip` uit en start `setup.exe`. Volg de stappen.
3. Start **AltServer** (via het Startmenu). Er komt **geen venster**: er verschijnt een klein ruitvormig icoon
   rechtsonder bij de klok (soms verstopt onder het pijltje **^**).
4. Krijg je een melding van de Windows Firewall? Kies **Toegang toestaan**, voor privé én openbare netwerken.

Tip: klik met rechts op het AltServer-icoon → zet **Launch at Login** aan, dan start het altijd mee met Windows.

---

## Deel 2 — AltStore op je iPhone zetten (eenmalig)

### 3. iPhone koppelen

1. Sluit je iPhone met de kabel aan op de pc en ontgrendel hem.
2. Tik op de iPhone op **Vertrouw** en vul je toegangscode in.
3. Open **iTunes** → klik op het telefoonicoontje linksboven → tabblad **Overzicht** →
   vink **Synchroniseer met deze iPhone via wifi** aan → **Pas toe**.
   (Dit is nodig zodat AltServer je iPhone later ook zonder kabel vindt.)

### 4. AltStore installeren

1. Klik op het **AltServer-icoon** rechtsonder → **Install AltStore** → kies je iPhone.
2. Vul je **Apple ID en wachtwoord** in. Die gaan alleen naar Apple, om een gratis ontwikkelaarscertificaat aan te maken.
   Heb je tweestapsverificatie, dan krijg je een code op je iPhone; vul die in.
3. Wacht tot de melding **"Installation Succeeded"** verschijnt (een halve minuut tot een paar minuten).
   Vraagt hij iets over het installeren van de *Mail-plug-in*: dat is alleen voor Mac, negeer het.

### 5. AltStore vertrouwen op je iPhone

1. **Instellingen → Algemeen → VPN en apparaatbeheer** → tik onder *Ontwikkelaarsapp* op je Apple ID
   → **Vertrouw "…"** → **Vertrouw**.
2. **Ontwikkelaarsmodus aanzetten** (iOS 16 en nieuwer):
   **Instellingen → Privacy en beveiliging → Ontwikkelaarsmodus** (helemaal onderaan) → zet aan
   → **Herstart**. Na de herstart: tik op **Zet aan** en vul je toegangscode in.
   Zie je *Ontwikkelaarsmodus* niet staan? Open AltStore één keer en kijk opnieuw.
3. Open **AltStore** op je iPhone → tabblad **Settings** → **Sign in with Apple ID** → log in met **dezelfde** Apple ID.

---

## Deel 3 — Klas+ installeren

### 6. De .ipa op je iPhone krijgen

Kies één manier:

- **iCloud Drive (makkelijkst):** zet `Klasplus.ipa` op je pc in de map *iCloud Drive*
  (in Verkenner, na het installeren van iCloud). Wacht tot hij gesynchroniseerd is.
- **Mail of chat aan jezelf:** stuur het bestand naar jezelf en tik op iPhone op *Bewaar in Bestanden*.
- **Via iTunes:** iTunes → iPhone → *Bestandsdeling* → AltStore → sleep het bestand erin.

### 7. Installeren via AltStore

1. Zorg dat **AltServer op je pc draait** en dat pc en iPhone op **hetzelfde wifi** zitten (of sluit de kabel aan).
2. Open **AltStore** → tabblad **My Apps** → tik op **+** linksboven.
3. Kies `Klasplus.ipa` in de app *Bestanden*.
4. AltStore ondertekent de app en installeert hem. **Klas+** verschijnt op je beginscherm.
5. Open Klas+ en log in via je school, net als op Android.

---

## Deel 4 — Elke week: verlengen

Met een **gratis** Apple ID is een app **7 dagen** geldig. Daarna opent hij niet meer, maar je gegevens blijven bewaard.

- **Automatisch:** AltStore verlengt op de achtergrond zolang AltServer op je pc draait en je iPhone op hetzelfde wifi zit.
  Laat je pc daarvoor zo nu en dan aan staan.
- **Met de hand:** AltStore → **My Apps** → **Refresh All**. Bovenaan zie je hoeveel dagen elke app nog heeft.
- Is een app toch verlopen? Gewoon *Refresh All* doen; Klas+ werkt daarna weer, inclusief je login.

Ook **AltStore zelf** verloopt na 7 dagen. Laat het niet zover komen; anders moet je stap 4 opnieuw doen.

---

## Deel 5 — Een nieuwe versie van Klas+ installeren

1. Bouw een nieuwe .ipa (GitHub → Actions → **iOS .ipa bouwen** → **Run workflow**) en download *Klasplus-ipa*.
2. Zet de nieuwe `Klasplus.ipa` op je iPhone (stap 6).
3. AltStore → **My Apps** → **+** → kies het nieuwe bestand.
   De oude versie wordt vervangen; je bent nog steeds ingelogd.

---

## Beperkingen van een gratis Apple ID

| Wat | Gratis Apple ID | Betaald ontwikkelaarsaccount (€99/jaar) |
|---|---|---|
| Geldigheid van een app | 7 dagen | 1 jaar |
| Apps tegelijk | 3, waarvan AltStore er één is | onbeperkt |
| Nieuwe app-ID's | 10 per 7 dagen | onbeperkt |

---

## Problemen oplossen

| Melding of probleem | Oplossing |
|---|---|
| **"Could not find AltServer"** | AltServer op de pc starten, zelfde wifi, firewall toestaan, wifi-synchronisatie in iTunes aan. Lukt het niet: kabel aansluiten. |
| **"iTunes/iCloud not found"** of AltServer doet niets | Je hebt waarschijnlijk de Microsoft Store-versies. Verwijderen en de versies van Apple installeren (stap 1). |
| **"Incorrect Apple ID or password"** | Controleer je gegevens. Bij tweestapsverificatie de code invullen; eventueel een app-specifiek wachtwoord gebruiken. |
| **"Maximum number of apps"** | Gratis account: maximaal 3 apps. Verwijder een andere zelf-geïnstalleerde app in AltStore (*My Apps* → lang indrukken → *Remove*). |
| **"Your session has expired"** | AltStore → Settings → uitloggen en opnieuw inloggen met je Apple ID. |
| **Klas+ opent niet / sluit direct** | Waarschijnlijk verlopen: AltStore → *Refresh All*. Of de ontwikkelaar is nog niet vertrouwd (stap 5). |
| **"Unable to verify app"** | Je iPhone heeft internet nodig om het certificaat te controleren. Verbinding maken en opnieuw openen. |
| **Ontwikkelaarsmodus staat er niet** | Pas zichtbaar nadat AltStore geïnstalleerd is. iPhone herstarten en opnieuw kijken. |
| **Na een iOS-update werkt het niet** | AltServer en iTunes bijwerken, daarna in AltStore *Refresh All*. |

---

## Goed om te weten

- Je Apple ID-wachtwoord gaat via AltServer alleen naar Apple. Wil je dat liever niet met je hoofdaccount doen,
  maak dan een apart (gratis) Apple ID aan voor AltStore.
- AltStore geeft de app een eigen bundle-ID (met je team-ID erachter). Dat is normaal; Klas+ werkt daar gewoon mee.
- Verwijder je Klas+, dan verdwijnen ook de inloggegevens en opgeslagen gegevens van dat toestel.
