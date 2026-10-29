// Ruwe antwoorden van de schoolserver → onze eigen typen.
// Veldnamen komen uit de broncode van Gemairo; ze zijn niet officieel gedocumenteerd.
import { nlTijd } from '../../lib/datum';
import { metHoofdletter } from '../../lib/tekst';
import type { Afspraak, AfspraakDetail, AfspraakInvoer, Afwezigheid, Cijfer, Kind, Label, Melding, Reden, Vak } from '../types';

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
  /** 4 en 5: vervallen/uitgevallen. */
  Status?: number;
  /** 7: KWT-uur (nog te controleren met echte gegevens). 13 is een gewone les. */
  Type?: number;
  Vakken?: { Id?: number; Naam: string }[];
  Docenten?: { Id?: number; Naam: string; Docentcode?: string }[];
  Groepen?: { Code: string }[];
  /** HTML die de docent typte. */
  Inhoud?: string | null;
  Afgerond?: boolean;
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
  if (a.InfoType && infoLabels[a.InfoType]) lijst.push(infoLabels[a.InfoType]);
  if (a.Status === 4 || a.Status === 5) lijst.push('vervalt');
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
    inhoudHtml: a.Inhoud?.trim() ? a.Inhoud : null,
    afgerond: a.Afgerond ?? false,
  };
}

export function naarAfspraakDetail(a: RuweAfspraak): AfspraakDetail {
  return {
    ...naarAfspraak(a),
    aangemaaktOp: a.TaakAangemaaktOp ?? null,
    gewijzigdOp: a.TaakGewijzigdOp ?? null,
    groepen: (a.Groepen ?? []).map((g) => g.Code).filter(Boolean),
  };
}

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
    Inhoud: alsHtml(invoer.beschrijving),
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
