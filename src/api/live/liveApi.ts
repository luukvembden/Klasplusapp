// De echte koppeling, voor de telefoon-app (Capacitor).
import { naarInvoer, nlTijd, plusDagen } from '../../lib/datum';
import { lees, schrijf, verwijder } from '../../lib/opslag';
import { bewaarMelding, meldingenVan } from '../../lib/meldingen';
import type { SchoolApi } from '../SchoolApi';
import type { Resultaat } from '../types';
import { afmelden, inloggenBijSchool, leesTokens, wisTokens, bewaarTokens } from './auth';
import {
  huidigeAanmelding,
  huidigePeriode,
  initialen,
  isOuderAccount,
  isToetsCijfer,
  naarAfspraak,
  naarAfspraakDetail,
  naarAfwezigheid,
  naarCijfers,
  naarKind,
  naarMelding,
  naarReden,
  naarRuwePersoonlijke,
  PERSOONLIJK,
  schoolNaam,
  volledigeNaam,
  type RuwAccount,
  type RuweAanmelding,
  type RuweAfwezigheid,
  type RuweAfspraak,
  type RuweKolomInfo,
  type RuwePeriode,
  type RuwCijfer,
  type RuwKind,
  type RuweMelding,
  type RuweMeldMogelijkheden,
  type RuweReden,
} from './omzetten';
import { haal, huidigeSessie, stuur, zetSessie, zoekSchoolUrl } from './verbinding';

/** Niet-geheime sessiegegevens; de tokens zelf staan in de veilige opslag. */
const SESSIE = 'live.sessie';
/** Wegingen veranderen bijna nooit; bewaren scheelt een verzoek per cijfer. Valt onder de cache. */
const wegingenSleutel = (aanmeldingId: number) => `cache.wegingen.${aanmeldingId}`;

interface BewaardeSessie {
  schoolUrl: string;
  persoonId: number;
  /** Alleen bij een ouderaccount: het kind dat de app nu toont. */
  kindId?: number;
}

/** Bij een ouderaccount het gekozen kind; anders undefined. */
let kindId: number | undefined;

/**
 * Waar een afwezigheidsmelding heen moet. De school stuurt dit adres alleen mee (als link "absentiemelding"
 * bij de absenties) als ziek melden voor dit kind mag. Per kind onthouden; null betekent: mag niet.
 */
let meldAdres: { kind: number; href: string | null } | undefined;

type MetLinks = { Links?: { Rel?: string; Href?: string }[] };

function onthoudMeldAdres(antwoord: MetLinks) {
  if (kindId === undefined) return;
  const href = antwoord.Links?.find((l) => l.Rel === 'absentiemelding')?.Href ?? null;
  meldAdres = { kind: kindId, href };
}

/** De nieuwe afwezigheidsmodule van de school; een aparte server, met dezelfde inlog. */
const AFWEZIGHEID = 'https://attendance.magister.net/api/v2';

interface NieuweModule {
  /** Het id waarmee de module de leerling kent. */
  externeId: string;
  kanMelden: boolean;
}

/** Per leerling onthouden of de school de nieuwe module gebruikt; null betekent: nee (of geen toegang). */
let nieuweModule: { voor: number; info: NieuweModule | null } | undefined;

async function externeId(): Promise<string | undefined> {
  if (kindId === undefined) return (await haal<RuwAccount>('api/account')).Persoon.ExterneId;
  return (await kinderen()).find((k) => k.Id === kindId)?.ExterneId;
}

async function zoekNieuweModule(): Promise<NieuweModule | null> {
  const voor = leerlingId();
  if (nieuweModule?.voor === voor) return nieuweModule.info;
  let info: NieuweModule | null = null;
  try {
    const id = await externeId();
    if (id) {
      // Zoals de officiële website: een ouder vraagt het op voor het kind, een leerling voor zichzelf.
      const mogelijk = await haal<RuweMeldMogelijkheden>(
        kindId === undefined ? AFWEZIGHEID : `${AFWEZIGHEID}?studentId=${encodeURIComponent(id)}`,
      );
      if (mogelijk.isMxEnabled) {
        info = { externeId: id, kanMelden: (mogelijk.capabilities ?? []).includes('CanWriteAbsenceNotice') };
      }
    }
  } catch {
    // Geen toegang (bijvoorbeeld ingelogd vóór deze versie) of de school gebruikt de module niet.
    // Niet onthouden, zodat het de volgende keer opnieuw wordt geprobeerd.
    return null;
  }
  nieuweModule = { voor, info };
  return info;
}

/** Een lijst uit de module: soms los, soms in "items". */
const alsLijst = <T>(x: T[] | { items?: T[] }): T[] => (Array.isArray(x) ? x : (x.items ?? []));

async function zoekMeldAdres(): Promise<string | null> {
  // Net als de officiële website: alleen een ouder kan ziek melden.
  if (kindId === undefined) return null;
  if (meldAdres?.kind !== kindId) {
    const van = naarInvoer(new Date());
    const tot = naarInvoer(plusDagen(new Date(), 1));
    onthoudMeldAdres(await haal<MetLinks>(`api/personen/${kindId}/absenties?van=${van}&tot=${tot}`));
  }
  return meldAdres!.href;
}

/** Afspraken maken en huiswerk afvinken doet alleen de leerling zelf. */
function alleenLeerling() {
  if (kindId !== undefined) throw new Error('Dit kan alleen de leerling zelf');
}

const resultaat = <T>(data: T): Resultaat<T> => ({ data, opgehaaldOp: new Date().toISOString() });

function persoonId() {
  const s = huidigeSessie();
  if (!s) throw new Error('Geen sessie');
  return s.persoonId;
}

/** Van wie de gegevens zijn: de leerling zelf, of bij een ouder het gekozen kind. */
const leerlingId = () => kindId ?? persoonId();

async function kinderen(): Promise<RuwKind[]> {
  const antwoord = await haal<{ Items?: RuwKind[] }>(`api/personen/${persoonId()}/kinderen`);
  return antwoord.Items ?? [];
}

function bewaarSessie() {
  const s = huidigeSessie()!;
  schrijf(SESSIE, { schoolUrl: s.schoolUrl, persoonId: s.persoonId, kindId } satisfies BewaardeSessie);
}

async function aanmelding(): Promise<RuweAanmelding> {
  const lijst = await haal<{ items: RuweAanmelding[] }>(`api/leerlingen/${leerlingId()}/aanmeldingen?begin=1970-01-01`);
  const huidig = huidigeAanmelding(lijst.items ?? []);
  if (!huidig) throw new Error('Geen schooljaar gevonden');
  return huidig;
}

/** Haalt weging en toetsnaam op voor cijfers die we nog niet kennen, één voor één (limiet). */
async function kolomInfo(aanmeldingId: number, kolomIds: number[]): Promise<Record<number, RuweKolomInfo>> {
  const bekend = lees<Record<number, RuweKolomInfo>>(wegingenSleutel(aanmeldingId)) ?? {};
  for (const id of kolomIds.filter((k) => !(k in bekend))) {
    bekend[id] = await haal<RuweKolomInfo>(
      `api/personen/${leerlingId()}/aanmeldingen/${aanmeldingId}/cijfers/extracijferkolominfo/${id}`,
    );
    schrijf(wegingenSleutel(aanmeldingId), bekend);
  }
  return bekend;
}

export const liveApi: SchoolApi = {
  async start() {
    const bewaard = lees<BewaardeSessie>(SESSIE);
    const tokens = bewaard ? await leesTokens() : null;
    zetSessie(bewaard && tokens ? { ...bewaard, tokens } : null);
    kindId = bewaard && tokens ? bewaard.kindId : undefined;
  },

  async inloggen() {
    const tokens = await inloggenBijSchool();
    const schoolUrl = await zoekSchoolUrl(tokens.accessToken);
    zetSessie({ tokens, schoolUrl, persoonId: 0 });
    const account = await haal<RuwAccount>('api/account');
    zetSessie({ tokens, schoolUrl, persoonId: account.Persoon.Id });
    kindId = undefined;
    if (isOuderAccount(account)) {
      // Net als de officiële website: begin bij het eerste kind dat de ouder mag inzien.
      const lijst = await kinderen();
      const eerste = lijst.find((k) => k.ZichtbaarVoorOuder !== false) ?? lijst[0];
      if (!eerste) {
        zetSessie(null);
        throw new Error('Geen kinderen gevonden bij dit ouderaccount');
      }
      kindId = eerste.Id;
    }
    await bewaarTokens(tokens);
    bewaarSessie();
  },

  async uitloggen() {
    const s = huidigeSessie();
    zetSessie(null);
    kindId = undefined;
    meldAdres = undefined;
    nieuweModule = undefined;
    verwijder(SESSIE);
    await wisTokens();
    await afmelden(s?.tokens ?? null);
  },

  heeftSessie: () => huidigeSessie() !== null,

  isOuder: () => kindId !== undefined,

  async kiesKind(id) {
    if (kindId === undefined) throw new Error('Alleen ouders kunnen een kind kiezen');
    kindId = id;
    bewaarSessie();
  },

  async profiel() {
    const [account, huidig, lijst] = await Promise.all([
      haal<RuwAccount>('api/account'),
      aanmelding(),
      kindId === undefined ? Promise.resolve([]) : kinderen(),
    ]);
    const perioden = await haal<{ items: RuwePeriode[] }>(`api/aanmeldingen/${huidig.id}/cijfers/perioden`).catch(
      () => ({ items: [] as RuwePeriode[] }),
    );
    const periode = huidigePeriode(perioden.items ?? []);
    return resultaat({
      naam: volledigeNaam(account.Persoon),
      initialen: initialen(account.Persoon),
      school: schoolNaam(huidigeSessie()!.schoolUrl),
      klas: huidig.studie?.omschrijving || huidig.groep?.omschrijving || '',
      periode: periode?.omschrijving || periode?.code || '',
      ouder: kindId === undefined ? undefined : { kinderen: lijst.map(naarKind), gekozen: kindId },
    });
  },

  async afspraken(van, tot) {
    const antwoord = await haal<{ Items: RuweAfspraak[] }>(
      // Bewust zonder status=1: dat filter laat vervallen lessen weg, en die willen we juist tonen.
      `api/personen/${leerlingId()}/afspraken?van=${naarInvoer(van)}&tot=${naarInvoer(tot)}`,
    );
    const lijst = (antwoord.Items ?? [])
      // Persoonlijke afspraken van het kind zijn niet voor de ouder bedoeld.
      .filter((r) => kindId === undefined || r.Type !== PERSOONLIJK)
      .map(naarAfspraak)
      .filter((a) => new Date(a.start) >= van && new Date(a.start) < tot);
    return resultaat(lijst);
  },

  async afspraak(id) {
    const ruw = await haal<RuweAfspraak>(`api/personen/${leerlingId()}/afspraken/${encodeURIComponent(id)}`);
    return resultaat(naarAfspraakDetail(ruw));
  },

  async maakAfspraak(invoer) {
    alleenLeerling();
    await stuur('POST', `api/personen/${leerlingId()}/afspraken`, naarRuwePersoonlijke(invoer));
  },

  async wijzigAfspraak(id, invoer) {
    alleenLeerling();
    // Eerst de huidige versie ophalen, zodat velden die wij niet kennen bewaard blijven.
    const pad = `api/personen/${leerlingId()}/afspraken/${encodeURIComponent(id)}`;
    const huidig = await haal<Record<string, unknown> & RuweAfspraak>(pad);
    if (huidig.Type !== PERSOONLIJK) throw new Error('Alleen eigen afspraken kun je wijzigen');
    await stuur('PUT', pad, naarRuwePersoonlijke(invoer, huidig));
  },

  async zetAfgerond(id, afgerond) {
    alleenLeerling();
    // Net als de officiële website: de les ophalen en met alleen Afgerond aangepast terugsturen.
    const pad = `api/personen/${leerlingId()}/afspraken/${encodeURIComponent(id)}`;
    const huidig = await haal<Record<string, unknown>>(pad);
    await stuur('PUT', pad, { ...huidig, Afgerond: afgerond });
  },

  async verwijderAfspraak(id) {
    alleenLeerling();
    await stuur('DELETE', `api/personen/${leerlingId()}/afspraken/${encodeURIComponent(id)}`);
  },

  async afwezigheden() {
    // Vanaf het begin van het schooljaar tot en met vandaag.
    const huidig = await aanmelding();
    const van = naarInvoer(new Date(huidig.begin));
    const tot = naarInvoer(new Date(Date.now() + 86_400_000));
    const antwoord = await haal<{ Items: RuweAfwezigheid[] } & MetLinks>(
      `api/personen/${leerlingId()}/absenties?van=${van}&tot=${tot}`,
    );
    onthoudMeldAdres(antwoord);
    return resultaat((antwoord.Items ?? []).map(naarAfwezigheid));
  },

  async meldOpties() {
    const module = await zoekNieuweModule();
    if (module) {
      // Zonder recht om te melden kun je de meldingen nog wel bekijken, net als in de officiële app.
      if (!module.kanMelden) {
        return { kanMelden: false, redenen: [], alleenVandaagOfMorgen: false, meldingenVanSchool: true };
      }
      const redenen = await haal<RuweReden[] | { items?: RuweReden[] }>(
        `${AFWEZIGHEID}/student/${encodeURIComponent(module.externeId)}/attendance-types?active=true`,
      );
      return {
        kanMelden: true,
        redenen: alsLijst(redenen).map(naarReden).sort((x, y) => x.naam.localeCompare(y.naam)),
        alleenVandaagOfMorgen: false,
        meldingenVanSchool: true,
      };
    }
    // Oude manier: alleen een ouder, als de school de link meestuurt.
    const adres = await zoekMeldAdres().catch(() => null);
    return adres ? { kanMelden: true, redenen: [], alleenVandaagOfMorgen: true, meldingenVanSchool: false } : null;
  },

  async meldAfwezig(melding) {
    const module = await zoekNieuweModule();
    if (module?.kanMelden) {
      const start = new Date(melding.start);
      let einde = new Date(melding.einde);
      // Net als de officiële website: een einde om middernacht wordt 23:59 van de dag ervoor.
      if (nlTijd(einde).uur === 0 && nlTijd(einde).minuut === 0) einde = new Date(einde.getTime() - 60_000);
      await stuur('POST', `${AFWEZIGHEID}/student/${encodeURIComponent(module.externeId)}/absence-notices`, {
        studentId: module.externeId,
        attendanceTypeCode: melding.reden?.code,
        attendanceTypeDesc: melding.reden?.naam,
        startDateTime: start.toISOString(),
        endDateTime: einde.toISOString(),
        comment: melding.opmerking,
      });
      return;
    }
    const href = await zoekMeldAdres();
    if (!href || kindId === undefined) throw new Error('Afwezig melden kan niet voor dit account');
    // Oude manier, zelfde velden als de officiële website: begin, einde en een opmerking.
    await stuur('POST', href.replace(/^\//, ''), {
      begin: melding.start,
      einde: melding.einde,
      opmerking: melding.opmerking,
    });
    bewaarMelding(kindId, melding);
  },

  async meldingen() {
    const module = await zoekNieuweModule();
    if (module) {
      // Alle meldingen van de school, dus ook die via de officiële app of website.
      const student = encodeURIComponent(module.externeId);
      const [lijst, redenen] = await Promise.all([
        haal<RuweMelding[] | { items?: RuweMelding[] }>(
          `${AFWEZIGHEID}/student/${student}/absence-notices?top=50&orderColumn=startDateTime&orderBy=desc`,
        ),
        // Een melding bevat vaak alleen de code ("TA"); de naam die de school koos staat in de redenlijst.
        // Ook oude redenen (active=false), net als de officiële app.
        haal<RuweReden[] | { items?: RuweReden[] }>(`${AFWEZIGHEID}/student/${student}/attendance-types?active=false`).catch(
          () => [] as RuweReden[],
        ),
      ]);
      const namen = new Map(alsLijst(redenen).map((r) => [r.code, naarReden(r).naam]));
      return resultaat(
        alsLijst(lijst)
          .map((m) => naarMelding(m, namen))
          .sort((x, y) => y.start.localeCompare(x.start)),
      );
    }
    return resultaat(kindId === undefined ? [] : meldingenVan(kindId));
  },

  async cijfers() {
    const huidig = await aanmelding();
    const peildatum = encodeURIComponent(huidig.einde);
    const antwoord = await haal<{ Items: RuwCijfer[] }>(
      `api/personen/${leerlingId()}/aanmeldingen/${huidig.id}/cijfers/cijferoverzichtvooraanmelding` +
        `?actievePerioden=false&alleenBerekendeKolommen=false&alleenPTAKolommen=false&peildatum=${peildatum}`,
    );
    const ruw = antwoord.Items ?? [];
    const info = await kolomInfo(
      huidig.id,
      ruw.filter(isToetsCijfer).map((c) => c.CijferKolom!.Id),
    );
    return resultaat(naarCijfers(ruw, info));
  },
};
