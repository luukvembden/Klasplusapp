import type { VakOverzicht } from './cijfers';
import { lees, schrijf } from './opslag';

// de Examencheck in het examenjaar (5 havo, 6 vwo): met je SE-cijfers van nu, wat moet je op het centraal
// examen halen, en slaag je volgens de landelijke slaag-zakregeling? Een schatting: Klas+ rekent met de
// cijfers van dit schooljaar, en het examenreglement van de school is leidend. vmbo komt later (de regels
// verschillen per leerweg).

/** Zit deze klas in het examenjaar van havo of vwo? Herkent o.a. "6 vwo", "V6", "6V2", "havo 5", "H5a". */
export function isExamenjaar(klas: string | null | undefined): boolean {
  const k = (klas ?? '').toLowerCase();
  const vwo = '(?:vwo|v|atheneum|ath|gymnasium|gym)';
  const havo = '(?:havo|h)';
  const na = (niveau: string) => new RegExp(`(?:^|[^a-z0-9])([1-6])\\s*${niveau}(?![a-z])`);
  const voor = (niveau: string) => new RegExp(`(?:^|[^a-z])${niveau}\\s*([1-6])(?![0-9])`);
  const jaar = (niveau: string) => k.match(na(niveau))?.[1] ?? k.match(voor(niveau))?.[1];
  return jaar(vwo) === '6' || jaar(havo) === '5';
}

/** Hoe een vak meetelt: met een centraal examen, in het combinatiecijfer, of helemaal niet. */
export type ExamenSoort = 'ce' | 'combi' | 'niet';

/** Zonder keuze: Klas+ raadt het aan de naam van het vak. */
export function standaardSoort(naam: string): ExamenSoort {
  const n = naam.toLowerCase().trim();
  if (/lichamelijke opvoeding|^lo\b|^gym|mentor|studie(uur|begeleiding)|kwt|keuzewerktijd|rekenen|loopbaan|^lob\b|burgerschap/.test(n))
    return 'niet';
  if (/maatschappijleer|profielwerkstuk|^pws\b|ckv|culturele en kunstzinnige|^anw\b|algemene natuurwetenschappen|levensbeschouwing/.test(n))
    return 'combi';
  return 'ce';
}

const SLEUTEL = 'examen.vakken';
export const leesKeuzes = () => lees<Record<string, ExamenSoort>>(SLEUTEL) ?? {};
export const bewaarKeuzes = (k: Record<string, ExamenSoort>) => schrijf(SLEUTEL, k);
export const soortVan = (v: VakOverzicht, keuzes: Record<string, ExamenSoort>): ExamenSoort =>
  keuzes[v.vak.code] ?? standaardSoort(v.vak.naam);

/** Nederlands, Engels en wiskunde (A, B of C): daarvoor geldt de kernvakkenregel. */
const isKernvak = (naam: string) => /^nederlands|^engels|^wiskunde(\s*[abc])?$/.test(naam.toLowerCase().trim());

/** Afronden zoals bij examens: x,5 gaat omhoog. */
const heel = (n: number) => Math.floor(n + 0.5 + 1e-9);
const opTiende = (n: number) => Math.round(n * 10 + 1e-9) / 10;

export interface ExamenVak {
  naam: string;
  code: string;
  /** SE-cijfer, op één decimaal. */
  se: number;
  /** Wat je minimaal op het CE nodig hebt voor een 6 als eindcijfer; null als dat niet meer kan. */
  ceNodig: number | null;
  /** Eindcijfer als je op het CE hetzelfde haalt als je SE. */
  eind: number;
}

export interface SlaagUitslag {
  /** Vakken met een centraal examen. */
  vakken: ExamenVak[];
  /** Het combinatiecijfer (gemiddelde van de vakken zonder CE), als die er zijn. */
  combi: { se: number; eind: number; delen: string[] } | null;
  stand: 'goed' | 'letop' | 'niet';
  kop: string;
  /** Uitleg bij "let op", of de redenen waarom je nu nog niet slaagt. */
  tekst: string[];
  /** Gemiddelde van de eindcijfers (zoals de regeling het telt). */
  gemiddelde: number | null;
  /** Als je overal precies het minimum haalt: zoveel is dan je CE-gemiddelde. */
  minimumGemiddelde: number | null;
}

const opsomming = (namen: string[]) =>
  namen.length <= 1 ? namen.join('') : `${namen.slice(0, -1).join(', ')} en ${namen[namen.length - 1]}`;

/**
 * Rekent uit hoe je ervoor staat, met als schatting dat je op elk centraal examen hetzelfde haalt als je SE.
 * Eindcijfer = gemiddelde van SE en CE, afgerond op een heel cijfer.
 */
export function berekenSlagen(overzicht: VakOverzicht[], keuzes: Record<string, ExamenSoort>): SlaagUitslag {
  const metCijfer = overzicht.filter((v) => v.gemiddelde !== null);
  const vakken: ExamenVak[] = metCijfer
    .filter((v) => soortVan(v, keuzes) === 'ce')
    .map((v) => {
      const se = opTiende(v.gemiddelde!);
      const nodig = Math.max(1, Math.ceil((11 - se) * 10 - 1e-9) / 10);
      return { naam: v.vak.naam, code: v.vak.code, se, ceNodig: nodig > 10 ? null : nodig, eind: heel(se) };
    });

  const combiVakken = metCijfer.filter((v) => soortVan(v, keuzes) === 'combi');
  const combiDelen = combiVakken.map((v) => ({ naam: v.vak.naam, eind: heel(opTiende(v.gemiddelde!)) }));
  const combi = combiDelen.length
    ? {
        se: opTiende(combiDelen.reduce((s, d) => s + d.eind, 0) / combiDelen.length),
        eind: heel(combiDelen.reduce((s, d) => s + d.eind, 0) / combiDelen.length),
        delen: combiDelen.map((d) => d.naam),
      }
    : null;

  const eindcijfers = [...vakken.map((v) => ({ naam: v.naam, eind: v.eind })), ...(combi ? [{ naam: 'het combinatiecijfer', eind: combi.eind }] : [])];
  if (eindcijfers.length === 0) {
    return { vakken, combi, stand: 'niet', kop: 'Nog geen cijfers', tekst: [], gemiddelde: null, minimumGemiddelde: null };
  }

  const gemiddelde = eindcijfers.reduce((s, e) => s + e.eind, 0) / eindcijfers.length;
  const vijven = eindcijfers.filter((e) => e.eind === 5);
  const vieren = eindcijfers.filter((e) => e.eind === 4);
  const teLaag = eindcijfers.filter((e) => e.eind < 4);
  const ceGemiddelde = vakken.length ? vakken.reduce((s, v) => s + v.se, 0) / vakken.length : null;
  const minimumGemiddelde = vakken.length ? vakken.reduce((s, v) => s + (v.ceNodig ?? 10), 0) / vakken.length : null;

  const redenen: string[] = [];
  if (teLaag.length) redenen.push(`${opsomming(teLaag.map((e) => e.naam))} ${teLaag.length === 1 ? 'staat' : 'staan'} lager dan een 4; dan zak je altijd.`);
  for (const d of combiDelen.filter((d) => d.eind < 4)) redenen.push(`${d.naam} staat lager dan een 4; dat mag niet in het combinatiecijfer.`);
  const regelOk =
    (vieren.length === 0 && vijven.length <= 1) ||
    (gemiddelde >= 6 && ((vieren.length === 1 && vijven.length <= 1) || (vieren.length === 0 && vijven.length === 2)));
  if (!teLaag.length && !regelOk) {
    const onv = [...vieren, ...vijven];
    redenen.push(
      onv.length > 2 || vieren.length > 1
        ? `${opsomming(onv.map((e) => e.naam))} ${onv.length === 1 ? 'staat' : 'staan'} onvoldoende; dat zijn er te veel.`
        : `${opsomming(onv.map((e) => e.naam))} staan onvoldoende. Dan heb je een gemiddelde van minstens 6,0 nodig; je zit op ${opTiende(gemiddelde).toFixed(1).replace('.', ',')}.`,
    );
  }
  const kern = vakken.filter((v) => isKernvak(v.naam));
  const kernLaag = kern.filter((v) => v.eind < 5);
  const kernVijf = kern.filter((v) => v.eind === 5);
  if (kernLaag.length) redenen.push(`Voor Nederlands, Engels en wiskunde mag je geen 4 of lager hebben (${opsomming(kernLaag.map((v) => v.naam))}).`);
  else if (kernVijf.length > 1) redenen.push(`Van Nederlands, Engels en wiskunde mag er hooguit één een 5 zijn (${opsomming(kernVijf.map((v) => v.naam))}).`);
  if (ceGemiddelde !== null && ceGemiddelde < 5.5)
    redenen.push(`Je centraal examens moeten gemiddeld minstens een 5,5 zijn; met je SE als schatting kom je op ${opTiende(ceGemiddelde).toFixed(1).replace('.', ',')}.`);

  if (redenen.length) return { vakken, combi, stand: 'niet', kop: 'Zo slaag je nog niet', tekst: redenen, gemiddelde, minimumGemiddelde };

  const onv = [...vieren, ...vijven];
  if (onv.length === 0)
    return {
      vakken, combi, stand: 'goed', kop: 'Je ligt op koers',
      tekst: ['Haal je op het centraal examen hetzelfde als je SE, dan slaag je.'], gemiddelde, minimumGemiddelde,
    };
  const tekst =
    onv.length === 1 && vieren.length === 0
      ? `${onv[0].naam} staat op een 5. Met één vijf slaag je nog, maar er mag niet nog een onvoldoende bij.`
      : `${opsomming(onv.map((e) => e.naam))} staan onvoldoende. Daarmee slaag je alleen met een gemiddelde van minstens 6,0. Je zit nu op ${opTiende(gemiddelde).toFixed(1).replace('.', ',')}.`;
  return {
    vakken, combi, stand: 'letop',
    kop: onv.length === 1 ? 'Let op bij één vak' : `Let op bij ${onv.length} vakken`,
    tekst: [tekst], gemiddelde, minimumGemiddelde,
  };
}
