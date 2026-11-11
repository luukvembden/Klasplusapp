// Ruwe antwoorden van de schoolserver → onze eigen typen.
// Veldnamen komen uit de broncode van Gemairo; ze zijn niet officieel gedocumenteerd.
import { nlTijd } from '../../lib/datum';
import { metHoofdletter } from '../../lib/tekst';
import type {
  Afspraak,
  AfspraakDetail,
  AfspraakInvoer,
  Activiteit,
  ActiviteitOnderdeel,
  Afwezigheid,
  Bericht,
  BerichtKort,
  Bijlage,
  BerichtInvoer,
  Cijfer,
  Contact,
  Kind,
  Label,
  Melding,
  Opdracht,
  OpdrachtKort,
  OpdrachtStatus,
  Reden,
  Vak,
} from '../types';

// ---- Ruwe vormen (alleen de velden die we gebruiken) ----

export interface RuwAccount {
  Persoon: {
    Id: number;
    /** Het id waarmee de afwezigheidsmodule deze persoon kent. */
    ExterneId?: string;
    Roepnaam?: string;
    Voorletters?: string;
    Tussenvoegsel?: string;
    Achternaam?: string;
  };
  /** Rollen, bijvoorbeeld "Leerling" of "Ouder". */
  Groep?: { Naam: string }[];
}

/** Uit api/personen/{ouder}/kinderen. */
export interface RuwKind {
  Id: number;
  ExterneId?: string;
  Roepnaam?: string;
  Voorletters?: string;
  Tussenvoegsel?: string;
  Achternaam?: string;
  /** False als de leerling (18+) de ouder geen inzage geeft. */
  ZichtbaarVoorOuder?: boolean;
}

export interface RuweAfspraak {
  Id: number;
  Start: string;
  Einde: string;
  LesuurVan?: number | null;
  DuurtHeleDag?: boolean;
  Omschrijving?: string;
  Lokatie?: string | null;
  Lokalen?: { Naam: string }[];
  /** 1 huiswerk, 2 proefwerk, 3 tentamen, 4 SO, 5 mondeling. */
  InfoType?: number;
  /** 3 gewijzigd, 4 en 5 vervallen/uitgevallen, 9 verplaatst, 10 gewijzigd en verplaatst. */
  Status?: number;
  /** 7: KWT-uur (nog te controleren met echte gegevens). 13 is een gewone les. */
  Type?: number;
  Vakken?: { Id?: number; Naam: string }[];
  Docenten?: { Id?: number; Naam: string; Docentcode?: string }[];
  Groepen?: { Code: string }[];
  /** HTML die de docent typte. */
  Inhoud?: string | null;
  Afgerond?: boolean;
  HeeftBijlagen?: boolean;
  /** Alleen in het detailverzoek; zelfde vorm als bij opdrachten. */
  Bijlagen?: RuweOpdrachtBijlage[] | null;
  /** Alleen in het detailverzoek. */
  TaakAangemaaktOp?: string | null;
  TaakGewijzigdOp?: string | null;
}

export interface RuweAanmelding {
  id: number;
  begin: string;
  einde: string;
  isHoofdAanmelding?: boolean;
  groep?: { code?: string; omschrijving?: string };
  studie?: { code?: string; omschrijving?: string };
}

export interface RuwePeriode {
  id: number;
  /** Bij sommige scholen null. */
  begin: string | null;
  einde: string | null;
  code?: string;
  omschrijving?: string;
  volgnummer?: number;
}

export interface RuwCijfer {
  CijferKolom?: { Id: number; KolomSoort?: number; KolomOmschrijving?: string };
  CijferStr?: string;
  DatumIngevoerd?: string;
  TeltMee?: boolean;
  Vak?: { Id?: number; Afkorting?: string; Omschrijving?: string; Volgnr?: number };
}

export interface RuweKolomInfo {
  Weging?: number;
  KolomOmschrijving?: string;
  WerkInformatieOmschrijving?: string;
}

// ---- Profiel ----

export function volledigeNaam(p: RuwAccount['Persoon']): string {
  return [p.Roepnaam ?? p.Voorletters, p.Tussenvoegsel, p.Achternaam].filter(Boolean).join(' ');
}

export function initialen(p: RuwAccount['Persoon']): string {
  return `${(p.Roepnaam ?? p.Voorletters ?? '').charAt(0)}${(p.Achternaam ?? '').charAt(0)}`.toUpperCase();
}

/** Zo herkent ook de officiële website een ouderaccount. */
export const isOuderAccount = (a: RuwAccount) => (a.Groep ?? []).some((g) => g.Naam === 'Ouder');

export function naarKind(k: RuwKind): Kind {
  return { id: k.Id, naam: volledigeNaam(k), initialen: initialen(k) };
}

/** "https://jouwschool.magister.net/" → "Jouwschool". De naam van het schoolsysteem tonen we niet. */
export function schoolNaam(schoolUrl: string): string {
  const deel = new URL(schoolUrl).hostname.split('.')[0] ?? '';
  return deel.charAt(0).toUpperCase() + deel.slice(1);
}

const nu = () => new Date().toISOString();
const bevatVandaag = (x: { begin: string | null; einde: string | null }) =>
  !!x.begin && !!x.einde && x.begin <= nu() && nu() <= x.einde;

/** Het lopende schooljaar; anders het meest recente. */
export function huidigeAanmelding(lijst: RuweAanmelding[]): RuweAanmelding | undefined {
  return (
    lijst.find((a) => bevatVandaag(a) && a.isHoofdAanmelding !== false) ??
    lijst.find(bevatVandaag) ??
    [...lijst].sort((a, b) => b.einde.localeCompare(a.einde))[0]
  );
}

/** De lopende periode. Zonder datums (komt voor) weten we dat niet zeker en geven we niets terug. */
export function huidigePeriode(lijst: RuwePeriode[]): RuwePeriode | undefined {
  return lijst.find(bevatVandaag);
}

// ---- Afspraken ----

const infoLabels: Record<number, Label> = {
  1: 'huiswerk',
  2: 'proefwerk',
  3: 'tentamen',
  4: 'so',
  5: 'mondeling',
  6: 'informatie',
};

/** Type 1: een persoonlijke afspraak die de leerling zelf maakte (in deze app of de officiële). */
export const PERSOONLIJK = 1;

function labels(a: RuweAfspraak): Label[] {
  const lijst: Label[] = [];
  if (a.Type === PERSOONLIJK) lijst.push('eigen');
  if (a.Type === 7) lijst.push('kwt');
  // Bij een eigen afspraak is het soort alleen nodig voor de notitie; geen label "Info" erbij.
  if (a.Type !== PERSOONLIJK && a.InfoType && infoLabels[a.InfoType]) lijst.push(infoLabels[a.InfoType]);
  if (a.Status === 4 || a.Status === 5) lijst.push('vervalt');
  // Verplaatst (9) of gewijzigd en verplaatst (10): de tijd is anders, dus altijd een wijziging.
  // Status 3 ("gewijzigd") komt ook bij alleen nieuw huiswerk; zie wijzigingen.ts.
  else if (a.Status === 9 || a.Status === 10) lijst.push('gewijzigd');
  return lijst;
}

export function naarAfspraak(a: RuweAfspraak): Afspraak {
  return {
    id: String(a.Id),
    start: a.Start,
    einde: a.Einde,
    heleDag: a.DuurtHeleDag ?? false,
    lesuur: a.LesuurVan || null,
    // De school schrijft "ne - dv - 4v2"; het ontwerp toont "NE – DV – 4V2".
    // Een eigen afspraak houdt precies de titel die de leerling typte.
    omschrijving:
      a.Type === PERSOONLIJK
        ? (a.Omschrijving ?? '')
        : (a.Omschrijving ?? '').replace(/\s+-\s+/g, ' – ').toUpperCase(),
    lokaal: a.Lokalen?.[0]?.Naam ?? a.Lokatie ?? null,
    labels: labels(a),
    vak: a.Vakken?.[0]?.Naam ?? null,
    docenten: (a.Docenten ?? []).map((d) => d.Naam).filter(Boolean),
    inhoudHtml: a.Inhoud?.trim() ? (a.Type === PERSOONLIJK ? tekstAlsHtml(a.Inhoud) : a.Inhoud) : null,
    afgerond: a.Afgerond ?? false,
    heeftBijlagen: a.HeeftBijlagen ?? false,
  };
}

export function naarAfspraakDetail(a: RuweAfspraak): AfspraakDetail {
  return {
    ...naarAfspraak(a),
    aangemaaktOp: a.TaakAangemaaktOp ?? null,
    gewijzigdOp: a.TaakGewijzigdOp ?? null,
    groepen: (a.Groepen ?? []).map((g) => g.Code).filter(Boolean),
    bijlagen: (a.Bijlagen ?? []).map(naarOpdrachtBijlage),
  };
}

/** De tekst van een eigen afspraak: gewone tekst (nieuw) of al HTML (oud); regeleinden blijven staan. */
const tekstAlsHtml = (inhoud: string) => (/<[a-z][\s\S]*>/i.test(inhoud) ? inhoud : alsHtml(inhoud));

/** Tekst veilig in HTML zetten; regeleinden blijven zichtbaar. */
const alsHtml = (tekst: string) =>
  tekst
    ? `<p>${tekst.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')}</p>`
    : null;

/**
 * Een persoonlijke afspraak zoals de officiële app die opslaat (zelfde Type, Subtype en Status
 * als een afspraak die daar is gemaakt). Bij wijzigen gaan de overige velden ongewijzigd mee.
 */
export function naarRuwePersoonlijke(invoer: AfspraakInvoer, bestaand?: Record<string, unknown>) {
  return {
    ...(bestaand ?? {
      LesuurVan: null,
      LesuurTotMet: null,
      Status: 2,
      Type: PERSOONLIJK,
      Subtype: 1,
      IsOnlineDeelname: false,
      WeergaveType: 0,
      Opmerking: null,
      InfoType: 0,
      Aantekening: null,
      Afgerond: false,
      HerhaalStatus: 0,
      Herhaling: null,
      Vakken: [],
      Docenten: [],
      Lokalen: [],
      Groepen: [],
      OpdrachtId: 0,
      Bijlagen: [],
    }),
    Start: invoer.start,
    Einde: invoer.einde,
    DuurtHeleDag: invoer.heleDag,
    Omschrijving: invoer.titel,
    Lokatie: invoer.locatie || null,
    // Gewone tekst met regeleinden, zoals de schoolsite die bij een eigen afspraak toont (HTML zou je
    // daar letterlijk zien staan, met <p> en <br>).
    Inhoud: invoer.beschrijving || null,
    // Met tekst wil de school een soort weten (anders: "ongeldig infotype"); 6 is informatie.
    InfoType: invoer.beschrijving ? 6 : 0,
  };
}

// ---- Afwezigheid ----

export interface RuweAfwezigheid {
  Id: number;
  Start: string;
  Eind: string;
  Lesuur?: number | null;
  Geoorloofd?: boolean;
  /** Bijvoorbeeld "Ziek" of "Te laat"; door de school ingevuld. */
  Omschrijving?: string | null;
  /** 1 absent, 2 te laat, 3 ziek, 4 uit de les, 6 vrijstelling, 7 materiaal vergeten, 8 huiswerk vergeten. */
  Verantwoordingtype?: number;
  Code?: string | null;
  Afspraak?: RuweAfspraak | null;
}

const redenen: Record<number, string> = {
  1: 'Absent',
  2: 'Te laat',
  3: 'Ziek',
  4: 'Uit de les',
  6: 'Vrijstelling',
  7: 'Materiaal vergeten',
  8: 'Huiswerk vergeten',
};

export function naarAfwezigheid(a: RuweAfwezigheid): Afwezigheid {
  const reden = a.Omschrijving?.trim() || redenen[a.Verantwoordingtype ?? 0] || a.Code || 'Afwezig';
  // De vaknaam; zonder vak de lesomschrijving zoals in de Agenda ("EN – SM – 4V2").
  const vaknaam = a.Afspraak?.Vakken?.[0]?.Naam;
  const vak = vaknaam
    ? vaknaam.charAt(0).toUpperCase() + vaknaam.slice(1)
    : (a.Afspraak?.Omschrijving ?? '').replace(/\s+-\s+/g, ' – ').toUpperCase() || 'Les';
  return {
    id: String(a.Id),
    start: a.Start,
    einde: a.Eind,
    lesuur: a.Lesuur || a.Afspraak?.LesuurVan || null,
    vak,
    reden: reden.charAt(0).toUpperCase() + reden.slice(1),
    geoorloofd: a.Geoorloofd ?? false,
  };
}

// ---- Cijfers ----

/** Alleen echte toetscijfers, geen berekende gemiddelden of kopjes. */
export const isToetsCijfer = (c: RuwCijfer) => c.CijferKolom?.KolomSoort === 1 && (c.CijferKolom.Id ?? 0) > 0;

export function naarCijfers(ruw: RuwCijfer[], info: Record<number, RuweKolomInfo>): Cijfer[] {
  const vakken = new Map<string, Vak>();

  return ruw.filter(isToetsCijfer).map((c) => {
    const kolom = c.CijferKolom!;
    const extra = info[kolom.Id] ?? {};
    const code = c.Vak?.Afkorting ?? String(c.Vak?.Id ?? '?');
    if (!vakken.has(code)) {
      const naam = c.Vak?.Omschrijving ?? code;
      vakken.set(code, {
        code,
        naam: naam.charAt(0).toUpperCase() + naam.slice(1),
        // De volgorde van de school zelf; anders de volgorde waarin het vak voor het eerst voorkomt.
        volgnummer: c.Vak?.Volgnr ?? vakken.size,
      });
    }
    const weergave = (c.CijferStr ?? '').trim();
    const getal = Number(weergave.replace(',', '.'));

    return {
      id: String(kolom.Id),
      vak: vakken.get(code)!,
      omschrijving: extra.WerkInformatieOmschrijving || extra.KolomOmschrijving || kolom.KolomOmschrijving || '',
      datum: c.DatumIngevoerd ?? '1970-01-01T00:00:00Z',
      weging: extra.Weging ?? 0,
      waarde: weergave !== '' && Number.isFinite(getal) ? getal : null,
      weergave,
      teltMee: c.TeltMee ?? true,
    };
  });
}

// ---- Afwezig melden (de nieuwe afwezigheidsmodule) ----

/** Antwoord op /api/v2: wat deze school en dit account kunnen. */
export interface RuweMeldMogelijkheden {
  isMxEnabled?: boolean;
  capabilities?: string[];
}

export interface RuweReden {
  code: string;
  description?: string;
  commentMandatory?: boolean;
}

export interface RuweMelding {
  id: string | number;
  attendanceTypeCode?: string;
  /** De naam van de reden zoals de school die instelde, bijvoorbeeld "tandarts / orthodontist". */
  attendanceTypeDesc?: string;
  attendanceTypeDescription?: string;
  startDateTime: string;
  endDateTime?: string | null;
  /** Bij ziek: wanneer de ouder verwacht dat het kind weer beter is. */
  expectedEndDatetime?: string | null;
  comment?: string | null;
  createdDateTime?: string | null;
  lastModified?: string | null;
}

export function naarReden(r: RuweReden): Reden {
  return { code: r.code, naam: metHoofdletter(r.description?.trim() || r.code), toelichtingVerplicht: !!r.commentMandatory };
}

/** Een hele dag loopt bij de school van 00:00 tot 23:59. */
const isMiddernacht = (d: Date) => nlTijd(d).uur === 0 && nlTijd(d).minuut === 0;
const isLaatsteMinuut = (d: Date) => nlTijd(d).uur === 23 && nlTijd(d).minuut === 59;

/** `namen`: redencode → naam zoals de school die instelde, bijvoorbeeld "TA" → "Tandarts / orthodontist". */
export function naarMelding(m: RuweMelding, namen = new Map<string, string>()): Melding {
  const start = new Date(m.startDateTime);
  const ruwEinde = m.endDateTime ?? m.expectedEndDatetime ?? null;
  const einde = ruwEinde ? new Date(ruwEinde) : null;
  const heleDag = isMiddernacht(start) && (!einde || isLaatsteMinuut(einde) || isMiddernacht(einde));
  return {
    id: String(m.id),
    reden: metHoofdletter(
      m.attendanceTypeDesc?.trim() ||
        m.attendanceTypeDescription?.trim() ||
        (m.attendanceTypeCode && namen.get(m.attendanceTypeCode)) ||
        m.attendanceTypeCode ||
        'Afwezig',
    ),
    heleDag,
    start: start.toISOString(),
    // Intern rekenen we een hele dag tot middernacht erna, net als bij afspraken.
    einde: einde ? (heleDag && isLaatsteMinuut(einde) ? new Date(einde.getTime() + 60_000) : einde).toISOString() : null,
    opmerking: m.comment?.trim() ?? '',
    gemeldOp: m.createdDateTime ?? m.lastModified ?? null,
  };
}

// ---- Berichten (module api/berichten, kleine letters) ----
// Veldnamen uit de broncode van MagisterAPIKt (Tiebe) en magistergo; niet officieel gedocumenteerd.

type RuweLink = { href?: string };

export interface RuweBerichtMap {
  id: number;
  naam?: string;
  aantalOngelezen?: number;
  links?: { berichten?: RuweLink };
}

export interface RuwBericht {
  id: number;
  onderwerp?: string;
  afzender?: { id?: number; naam?: string };
  verzondenOp?: string;
  isGelezen?: boolean;
  heeftBijlagen?: boolean;
  heeftPrioriteit?: boolean;
  /** Alleen bij één bericht. */
  inhoud?: string | null;
  ontvangers?: { weergavenaam?: string }[];
  kopieOntvangers?: { weergavenaam?: string }[];
  links?: { bijlagen?: RuweLink };
}

export interface RuweBerichtBijlage {
  id: number;
  naam?: string;
  grootte?: number;
  links?: { download?: RuweLink; self?: RuweLink };
}

/** Het postvak: de map die zo heet, anders de eerste map met berichten. */
export function postvakIn(mappen: RuweBerichtMap[]): RuweBerichtMap | undefined {
  return (
    mappen.find((m) => (m.naam ?? '').toLowerCase().replace(/\s+/g, '') === 'postvakin') ??
    mappen.find((m) => m.links?.berichten?.href)
  );
}

/** De verzonden berichten: de map die zo heet. */
export function verzondenMap(mappen: RuweBerichtMap[]): RuweBerichtMap | undefined {
  return mappen.find((m) => (m.naam ?? '').toLowerCase().startsWith('verzonden'));
}

export function naarBerichtKort(b: RuwBericht): BerichtKort {
  return {
    id: String(b.id),
    onderwerp: b.onderwerp?.trim() || '(geen onderwerp)',
    afzender: b.afzender?.naam?.trim() || 'Onbekend',
    aan: (b.ontvangers ?? []).map((o) => o.weergavenaam?.trim()).filter((n): n is string => !!n),
    verzondenOp: b.verzondenOp ?? new Date(0).toISOString(),
    gelezen: b.isGelezen ?? true,
    heeftBijlagen: b.heeftBijlagen ?? false,
    belangrijk: b.heeftPrioriteit ?? false,
  };
}

export function naarBerichtBijlage(b: RuweBerichtBijlage): Bijlage {
  return {
    id: String(b.id),
    naam: b.naam ?? 'Bijlage',
    grootte: b.grootte ?? null,
    bron: b.links?.download?.href ?? b.links?.self?.href ?? '',
  };
}

export function naarBericht(b: RuwBericht, bijlagen: RuweBerichtBijlage[]): Bericht {
  const namen = [...(b.ontvangers ?? []), ...(b.kopieOntvangers ?? [])]
    .map((o) => o.weergavenaam?.trim())
    .filter((n): n is string => !!n);
  return {
    ...naarBerichtKort(b),
    inhoudHtml: b.inhoud?.trim() ? b.inhoud : null,
    ontvangers: namen,
    bijlagen: bijlagen.map(naarBerichtBijlage),
    afzenderContact: b.afzender?.id
      ? { id: b.afzender.id, naam: b.afzender.naam?.trim() || 'Afzender', soort: 'anders', extra: null }
      : null,
  };
}

// ---- Opdrachten (api/personen/{id}/opdrachten, hoofdletters) ----

type RuweHoofdLink = { Rel?: string; Href?: string };

export interface RuweOpdrachtBijlage {
  Id: number;
  Naam?: string;
  Grootte?: number;
  /** Bij een link in plaats van een bestand. */
  Url?: string | null;
  Links?: RuweHoofdLink[];
}

export interface RuweOpdracht {
  Id: number;
  Titel?: string;
  Vak?: string;
  Omschrijving?: string | null;
  InleverenVoor?: string | null;
  IngeleverdOp?: string | null;
  Afgesloten?: boolean;
  Beoordeling?: string | null;
  Docenten?: { Naam?: string }[];
  Bijlagen?: RuweOpdrachtBijlage[];
  Links?: RuweHoofdLink[];
  VersieNavigatieItems?: { Id: number; Links?: RuweHoofdLink[] }[];
}

export interface RuweOpdrachtVersie {
  Beoordeling?: string | null;
  DocentOpmerking?: string | null;
  IngeleverdOp?: string | null;
  FeedbackBijlagen?: RuweOpdrachtBijlage[];
}

export function naarOpdrachtBijlage(b: RuweOpdrachtBijlage): Bijlage {
  const link = b.Links?.find((l) => l.Rel === 'Contents') ?? b.Links?.find((l) => l.Rel === 'Self');
  return { id: String(b.Id), naam: b.Naam ?? 'Bijlage', grootte: b.Grootte ?? null, bron: b.Url || link?.Href || '' };
}

function opdrachtStatus(o: { IngeleverdOp?: string | null; Beoordeling?: string | null; InleverenVoor?: string | null }): OpdrachtStatus {
  if (o.Beoordeling?.trim()) return 'beoordeeld';
  if (o.IngeleverdOp) return 'ingeleverd';
  if (o.InleverenVoor && new Date(o.InleverenVoor).getTime() < Date.now()) return 'te-laat';
  return 'open';
}

export function naarOpdrachtKort(o: RuweOpdracht): OpdrachtKort {
  return {
    id: String(o.Id),
    titel: o.Titel?.trim() || 'Opdracht',
    vak: o.Vak?.trim() || '',
    inleverenVoor: o.InleverenVoor ?? null,
    ingeleverdOp: o.IngeleverdOp ?? null,
    status: opdrachtStatus(o),
    beoordeling: o.Beoordeling?.trim() || null,
  };
}

export function naarOpdracht(o: RuweOpdracht, versie: RuweOpdrachtVersie | null): Opdracht {
  const samen = { ...o, IngeleverdOp: o.IngeleverdOp ?? versie?.IngeleverdOp, Beoordeling: o.Beoordeling ?? versie?.Beoordeling };
  return {
    ...naarOpdrachtKort(samen),
    omschrijvingHtml: o.Omschrijving?.trim() ? o.Omschrijving : null,
    docenten: (o.Docenten ?? []).map((d) => d.Naam?.trim()).filter((n): n is string => !!n),
    bijlagen: (o.Bijlagen ?? []).map(naarOpdrachtBijlage),
    feedbackHtml: versie?.DocentOpmerking?.trim() ? versie.DocentOpmerking : null,
    feedbackBijlagen: (versie?.FeedbackBijlagen ?? []).map(naarOpdrachtBijlage),
  };
}

// ---- Contacten en versturen ----

export interface RuwContact {
  id: number;
  roepnaam?: string | null;
  voorletters?: string | null;
  tussenvoegsel?: string | null;
  achternaam?: string | null;
  code?: string | null;
  /** "medewerker" of "leerling". */
  type?: string | null;
  klas?: string | null;
}

export function naarContact(c: RuwContact): Contact {
  const voornaam = c.roepnaam?.trim() || c.voorletters?.trim();
  const naam = [voornaam, c.tussenvoegsel?.trim(), c.achternaam?.trim()].filter(Boolean).join(' ') || c.code || 'Onbekend';
  const soort = c.type === 'medewerker' ? 'docent' : c.type === 'leerling' ? 'leerling' : 'anders';
  return { id: c.id, naam, soort, extra: (soort === 'docent' ? c.code : c.klas)?.trim() || null };
}

/** Tekst → HTML zoals de officiële app verstuurt: veilig gemaakt, regeleinden als <br>. */
function tekstNaarHtml(tekst: string): string {
  const veilig = tekst.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return veilig
    .split(/\n{2,}/)
    .map((alinea) => `<p>${alinea.replace(/\n/g, '<br>')}</p>`)
    .join('');
}

/** Zoals MagisterAPIKt: ontvangers als personen, geen kopie, geen bijlagen. */
export function naarRuwBericht(b: BerichtInvoer) {
  return {
    ontvangers: b.aan.map((c) => ({ id: c.id, type: 'persoon' })),
    kopieOntvangers: [],
    blindeKopieOntvangers: [],
    heeftPrioriteit: false,
    inhoud: tekstNaarHtml(b.tekst.trim()),
    onderwerp: b.onderwerp.trim(),
    verzendOptie: 'standaard',
    bijlagen: [],
  };
}

// ---- Activiteiten ----

export interface RuweActiviteit {
  Id: number | string;
  Titel?: string | null;
  Details?: string | null;
  StartInschrijfdatum?: string | null;
  EindeInschrijfdatum?: string | null;
}

export interface RuwOnderdeel extends RuweActiviteit {
  MaxAantalDeelnemers?: number | null;
  AantalPlaatsenBeschikbaar?: number | null;
  IsIngeschreven?: boolean;
  IsOpInTeSchrijven?: boolean;
  IsVerplichtIngeschreven?: boolean;
  Bijlagen?: RuweOpdrachtBijlage[] | null;
}

export function naarActiviteit(a: RuweActiviteit): Activiteit {
  return {
    id: String(a.Id),
    titel: a.Titel?.trim() || 'Activiteit',
    detailsHtml: a.Details?.trim() || null,
    inschrijvenVan: a.StartInschrijfdatum ?? null,
    inschrijvenTot: a.EindeInschrijfdatum ?? null,
    ingeschreven: null,
    maxKeuzes: maxKeuzesUit(a as unknown as Record<string, unknown>),
  };
}

/**
 * Hoeveel onderdelen je mag kiezen. School kan dit per activiteit instellen; de precieze veldnaam
 * is niet gedocumenteerd, dus zoeken we een getal als "MaxAantalOnderdelen" of "MaxAantalInschrijvingen"
 * (en niet het maximum aantal deelnemers, dat bij een onderdeel hoort).
 */
function maxKeuzesUit(ruw: Record<string, unknown>): number | null {
  for (const [sleutel, waarde] of Object.entries(ruw)) {
    if (
      typeof waarde === 'number' &&
      waarde > 0 &&
      /^max/i.test(sleutel) &&
      /onderde|inschrijving|keuze/i.test(sleutel) &&
      !/deelnemer|plaats/i.test(sleutel)
    )
      return waarde;
  }
  return null;
}

export function naarOnderdeel(o: RuwOnderdeel, activiteitId: string): ActiviteitOnderdeel {
  const { ingeschreven: _, maxKeuzes: __, ...basis } = naarActiviteit(o);
  return {
    ...basis,
    titel: o.Titel?.trim() || 'Onderdeel',
    activiteitId,
    maxDeelnemers: o.MaxAantalDeelnemers || null,
    plekkenVrij: o.AantalPlaatsenBeschikbaar ?? null,
    ingeschreven: !!o.IsIngeschreven,
    kanInschrijven: !!o.IsOpInTeSchrijven,
    verplicht: !!o.IsVerplichtIngeschreven,
    bijlagen: (o.Bijlagen ?? []).map(naarOpdrachtBijlage),
  };
}
