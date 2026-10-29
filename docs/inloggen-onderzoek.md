# Onderzoek: inloggen en gegevens ophalen zoals Gemairo

Stand: 27 oktober 2026. Bron: de openbare broncode van Gemairo (github.com/gemairo/app, branch `stable`,
Apache-2.0-licentie), vooral `lib/apis/magister.dart`, `lib/apis/magister/api.dart`,
`lib/apis/magister/screens/login.dart` en `lib/apis/magister/translate.dart`. Daarnaast heb ik zelf een paar
dingen gecontroleerd met losse verzoeken (zie "Zelf gecontroleerd").

Let op: dit is geen officiële, gedocumenteerde API. Alles hieronder komt uit werkende code van een andere app
en kan zonder aankondiging veranderen.

## 1. Het inloggen stap voor stap (OAuth2 + PKCE)

Gemairo doet zich voor als de officiële mobiele app van het schoolsysteem: het gebruikt diens `client_id` en
redirect-adres. Een eigen client registreren kan voor zover bekend niet.

1. **Geheime sleutel maken (PKCE).** De app maakt een willekeurige `code_verifier` van 50 tekens en daarvan een
   `code_challenge` = base64url(SHA-256(verifier)) zonder `=`. Daarnaast een willekeurige `state` en `nonce`.

2. **Inlogpagina openen:**

   ```
   https://accounts.magister.net/connect/authorize
     ?client_id=M6LOAPP
     &redirect_uri=m6loapp://oauth2redirect/
     &scope=openid profile offline_access magister.mobile magister.ecs
     &response_type=code id_token
     &state=…&nonce=…
     &code_challenge=…&code_challenge_method=S256
     [&acr_values=tenant:<school>.magister.net&prompt=select_account]   (optioneel: school alvast kiezen)
   ```

3. **De leerling logt in op de echte pagina.** Daar kiest hij zijn school en gaat hij door naar de inlog van de
   school (Microsoft/Entra, Google, ADFS, of een eigen wachtwoord bij het schoolsysteem). De app ziet het
   wachtwoord nooit.

4. **Terugsturen naar de app.** Aan het eind stuurt de server de browser naar
   `m6loapp://oauth2redirect/#code=…&id_token=…&state=…`. De code staat dus achter een `#`.
   Gemairo vangt dat op twee manieren op:
   - **iOS/Android (standaard):** de inlogpagina draait in een WebView *in* de app. Elke navigatie wordt
     bekeken; bevat de URL `#code`, dan blokkeert de app die navigatie en haalt de code eruit.
   - **Terugvaloptie "open in browser":** de app registreert het schema `m6loapp://` (Android
     `intent-filter`, iOS `CFBundleURLTypes`). De gewone browser opent dan de app met die URL.

5. **Code inwisselen voor tokens:**

   ```
   POST https://accounts.magister.net/connect/token
   Content-Type: application/x-www-form-urlencoded

   grant_type=authorization_code&code=…&redirect_uri=m6loapp://oauth2redirect/
   &client_id=M6LOAPP&code_verifier=…
   ```

   Antwoord: `access_token`, `refresh_token`, `id_token`. Gemairo gaat ervan uit dat het access token 1 uur
   geldig is.

6. **Vernieuwen:** `POST /connect/token` met `grant_type=refresh_token&refresh_token=…&client_id=M6LOAPP`.
   Bij de fout `invalid_grant` of `invalid_request` moet de leerling opnieuw inloggen. Een API-antwoord
   `"SecurityToken Expired"` betekent: eerst vernieuwen en dan opnieuw proberen.

7. **Uitloggen:** `GET https://accounts.magister.net/connect/endsession?id_token_hint=<id_token>`, en daarna
   alles lokaal wissen.

## 2. Gegevens ophalen

Alle verzoeken gaan met de header `Authorization: Bearer <access_token>`.

| Wat | Verzoek | Bijzonderheden |
|---|---|---|
| Schoolserver vinden | `GET https://magister.net/.well-known/host-meta.json?rel=magister-api` | `links[0].href` geeft `https://<school>.magister.net/`; alle verzoeken hierna gaan daarheen |
| Account | `GET /api/account` | `Persoon.Id`, `Roepnaam`, `Achternaam`; via `Groep[0].Privileges` zie je of het een ouder of leerling is |
| Rooster | `GET /api/personen/{id}/afspraken?status=1&van=<ISO>&tot=<ISO>` | lijst in `Items` |
| Schooljaren | `GET /api/leerlingen/{id}/aanmeldingen?begin=1970-01-01` | lijst in `items` (kleine letter!), met `groep.omschrijving` en `studie` |
| Perioden | `GET /api/aanmeldingen/{aanmeldingId}/cijfers/perioden` | |
| Cijfers | `GET /api/personen/{id}/aanmeldingen/{aanmeldingId}/cijfers/cijferoverzichtvooraanmelding?actievePerioden=false&alleenBerekendeKolommen=false&alleenPTAKolommen=false&peildatum=<einde schooljaar>` | alleen kolommen met `CijferKolom.KolomSoort == 1` zijn echte cijfers |
| Weging + toetsnaam | `GET /api/personen/{id}/aanmeldingen/{aanmeldingId}/cijfers/extracijferkolominfo/{kolomId}` | **één verzoek per cijfer**; daardoor loop je snel tegen de limiet aan |

**Limiet:** te veel verzoeken geven `429` met `secondsLeft` in het antwoord. Gemairo wacht dan en probeert het
opnieuw, en haalt cijfers één schooljaar tegelijk op. Wij moeten de wegingen bewaren en alleen nieuwe cijfers
opnieuw opvragen.

### Omzetten naar onze typen (`src/api/types.ts`)

- **Afspraak:** `Start`, `Einde`, `LesuurVan`, `Omschrijving`, `Lokalen[].Naam`. Labels:
  - `InfoType` 1 = huiswerk, 2 = proefwerk, 3 = tentamen, 4 = SO, 5 = mondeling;
  - `Status` 4 of 5 = vervallen.
  - "Ingeschreven" en "KWT" moeten we nog uitzoeken met echte gegevens; waarschijnlijk zit dat in het
    afspraaktype.
- **Cijfer:** `CijferStr` (tekst, kan ook "V" of "G" zijn), `DatumIngevoerd`, `Vak.Omschrijving` en
  `Vak.Afkorting`, `TeltMee`, `IsVoldoende`, de weging uit `extracijferkolominfo.Weging`, en de naam uit
  `WerkInformatieOmschrijving` of anders `KolomOmschrijving`.
- **Let op:** ons type heeft `waarde: number`. Voor cijfers als "V" of "G" moet er nog een tekstveld bij.

## 3. Zelf gecontroleerd (27-10-2026)

- `https://accounts.magister.net/.well-known/openid-configuration` bestaat en noemt de endpoints hierboven,
  inclusief `code id_token` als response-type.
- **Token-endpoint:** stuurt geen `Access-Control-Allow-Origin` mee bij een verzoek vanaf een andere website.
  Een browser blokkeert dat verzoek dus.
- **Schoolserver (voorbeeld `ichthus.magister.net`):** de CORS-check (preflight) geeft `204` maar zonder
  `Access-Control-Allow-Origin`. Ook dit blokkeert een browser.
- `magister.net/.well-known/host-meta.json` geeft wel `Access-Control-Allow-Origin: *`. Dat is de enige
  uitzondering.
- **Oude openbare schoolzoeker** (`mijn.magister.net/api/schools`): die bestaat niet meer, de domeinnaam
  bestaat niet eens. Gemairo vraagt daarom niet zelf naar de school; dat doet de inlogpagina van het
  schoolsysteem.

## 4. Waarom het als website (PWA) niet werkt

1. **Redirect-adres.** De server accepteert voor `M6LOAPP` alleen `m6loapp://oauth2redirect/`. Een website kan
   zo'n adres niet ontvangen. Wat overblijft is de leerling de eind-URL laten kopiëren en plakken: lastig, en
   je leert leerlingen een gevaarlijke gewoonte aan.
2. **CORS.** Zelfs met een code blokkeert de browser het inwisselen van de code en elk verzoek aan de
   schoolserver. Dat kan alleen via een eigen proxyserver. Dan is er wél een backend, en gaan de tokens van
   minderjarigen via jouw server.

Conclusie: een PWA kan de echte koppeling niet zonder server. De PWA blijft wel nuttig voor de demo, het
testen en de offline schil.

## 5. Wat Capacitor eraan verandert

- **CORS is weg.** Met `CapacitorHttp` lopen verzoeken via de native HTTP van het toestel, niet via de browser.
  Er is dan geen CORS-controle.
- **De redirect is op te vangen.** Twee manieren, net als bij Gemairo:
  - **In-app browser met URL-controle (aanbevolen):** de inlogpagina openen in een in-app-browser-plugin die
    elke navigatie meldt, en stoppen zodra de URL met `m6loapp://` begint. Botst niet met de officiële app.
    Nog te controleren: of de gekozen plugin (bijvoorbeeld `@capacitor/inappbrowser` of
    `cordova-plugin-inappbrowser` met `loadstart`) een navigatie naar een eigen schema echt meldt.
  - **Systeembrowser + schema registreren (`@capacitor/browser` + `appUrlOpen`):**
    - Nodig voor scholen die met **Google** inloggen, want Google weigert inloggen in een ingebouwde WebView
      (`disallowed_useragent`).
    - Nadeel: de officiële app claimt hetzelfde `m6loapp://`-schema. Op Android krijg je dan een keuzemenu; op
      iOS is niet te bepalen welke app opent.
- **Veilige opslag.** Het refresh token hoort in de Keychain (iOS) of Keystore (Android) via een
  secure-storage-plugin, niet in `localStorage`.
- **Service worker.** Die draait niet in Capacitor, maar is daar ook niet nodig: de app-bestanden zitten in het
  pakket. De offline cache in `src/api/offlineCache.ts` werkt gewoon door.

## 6. Risico's om af te wegen

- **Je gebruikt de identiteit van de officiële app (`M6LOAPP`) zonder toestemming van de leverancier.**
  Gemairo staat al sinds 2020 in de App Store en Play Store, maar de leverancier kan dit op elk moment
  blokkeren of de API veranderen.
- **Ongedocumenteerde API.** Veldnamen verschillen soms (`Items`/`items`, `DatumIngevoerd`/`ingevoerdOp`).
  Gemairo vangt dat op met terugvalopties.
- **Limiet (429):** wegingen bewaren en zuinig opvragen.
- **Privacy:** het gaat om gegevens van minderjarigen. Alles lokaal houden (zoals nu), tokens veilig opslaan en
  een duidelijke privacyverklaring.
- **App Store-review:** benoem in de app duidelijk dat hij onofficieel is (dat doen we al) en dat inloggen via
  de school gaat.

## 7. Gevolg voor ons ontwerp

Het schoolzoekveld op het inlogscherm kan niet meer gevuld worden vanuit een openbare lijst. Mogelijkheden:

- het veld weglaten en de inlogpagina van het schoolsysteem de school laten kiezen (zoals Gemairo); of
- het veld laten staan voor het adres van de school (`jouwschool.magister.net`). De app vult daarmee
  `acr_values=tenant:…` in, zodat de leerling direct bij de juiste school uitkomt.
