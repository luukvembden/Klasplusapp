import type { Profiel } from '../api/types';
import type { VakOverzicht } from './cijfers';
import { lees, schrijf } from './opslag';

// Examencheck in het examenjaar: met je SE-cijfers van nu, wat moet je op het centraal examen halen, en
// slaag je volgens de uitslagregel? Gebaseerd op het Uitvoeringsbesluit WVO 2020, art. 3.32 t/m 3.35
// (wetten.overheid.nl, BWBR0045787) en examenblad.nl. Een schatting: Klas+ rekent met de cijfers van dit
// schooljaar, en het examenreglement van de school is leidend (die kan bijvoorbeeld vakken toevoegen aan
// het combinatiecijfer, of een cijfer weglaten om je te laten slagen, art. 3.33 lid 3).

/** Het niveau van het eindexamen. bb/kb/gl/tl zijn de vier leerwegen van het vmbo. */
export type Niveau = 'havo' | 'vwo' | 'bb' | 'kb' | 'gl' | 'tl';

export const NIVEAU_NAAM: Record<Niveau, string> = {
  havo: 'havo',
  vwo: 'vwo',
  bb: 'vmbo basis',
  kb: 'vmbo kader',
  gl: 'vmbo gemengd',
  tl: 'mavo (vmbo-tl)',
};

export const isVmbo = (n: Niveau) => n === 'bb' || n === 'kb' || n === 'gl' || n === 'tl';

/**
 * Het examenjaar herkennen aan de naam van je studie en klas ("6 vwo", "V6", "6V2", "havo 5", "H5a",
 * "4 mavo", "vmbo-tl 4", "4 kader", "BB4", "4KB2" …). Losse letters als "4B" of "4T" tellen bij het vmbo
 * niet mee: dat zijn op veel scholen gewoon parallelklassen. Null als het geen examenjaar is.
 */
export function herkenNiveau(tekst: string | null | undefined): Niveau | null {
  const k = ` ${(tekst ?? '').toLowerCase().replace(/[-_/.]/g, ' ')} `;
  const jaarBij = (niveau: string) => {
    const na = k.match(new RegExp(`(?:^|[^a-z0-9])([1-6])\\s*(?:${niveau})(?![a-z])`));
    const voor = k.match(new RegExp(`(?:^|[^a-z])(?:${niveau})\\s*([1-6])(?![0-9])`));
    return na?.[1] ?? voor?.[1] ?? null;
  };
  // Een los "4" ergens in de tekst, voor als niveau en jaar los van elkaar staan ("vmbo tl, leerjaar 4").
  const losJaar = k.match(/(?:^|[^0-9])([1-6])(?:[^0-9]|$)/)?.[1] ?? null;
  const heeft = (niveau: string) => new RegExp(`(?:^|[^a-z])(?:${niveau})(?![a-z])`).test(k);

  if (jaarBij('vwo|v|atheneum|ath|gymnasium|gym') === '6') return 'vwo';
  if (jaarBij('havo|h') === '5') return 'havo';

  const vmbo: [Niveau, string][] = [
    ['bb', 'bb|bbl|basis|basisberoepsgericht|basisberoepsgerichte'],
    ['kb', 'kb|kbl|kader|kaderberoepsgericht|kaderberoepsgerichte'],
    ['gl', 'gl|gemengd|gemengde'],
    // vmbo-gt (gemengd/theoretisch samen): meestal theoretisch; anders zelf instellen.
    ['tl', 'tl|gt|mavo|theoretisch|theoretische'],
  ];
  for (const [niveau, namen] of vmbo) {
    const jaar = jaarBij(namen) ?? (heeft(namen) ? losJaar : null);
    if (jaar === '4') return niveau;
  }
  // "vmbo t 4" of "vmbo-t 4": de t van theoretisch.
  if (/vmbo\s*t(?![a-z])/.test(k) && (jaarBij('vmbo\\s*t') ?? losJaar) === '4') return 'tl';
  return null;
}

/** Zelf ingesteld (als Klas+ het niet goed herkent): automatisch, een niveau, of "geen examenjaar". */
export type NiveauKeuze = 'auto' | 'geen' | Niveau;
const NIVEAU_SLEUTEL = 'examen.niveau';
export const leesNiveauKeuze = (): NiveauKeuze => lees<NiveauKeuze>(NIVEAU_SLEUTEL) ?? 'auto';
export const bewaarNiveauKeuze = (k: NiveauKeuze) => schrijf(NIVEAU_SLEUTEL, k);

/** De tekst waaraan Klas+ je klas herkent: studie en klas samen. */
export const klasTekst = (p: Pick<Profiel, 'klas' | 'klasInfo'> | null | undefined) =>
  [p?.klas, p?.klasInfo].filter(Boolean).join(' ');

/** Het niveau waarvoor de Examencheck geldt, of null als je (volgens Klas+ of jezelf) niet in je examenjaar zit. */
export function examenNiveau(p: Pick<Profiel, 'klas' | 'klasInfo'> | null | undefined): Niveau | null {
  const keuze = leesNiveauKeuze();
  if (keuze === 'geen') return null;
  if (keuze !== 'auto') return keuze;
  return herkenNiveau(klasTekst(p));
}

/**
 * Hoe een vak meetelt:
 * - ce: met een centraal examen (eindcijfer = gemiddelde van SE en CE)
 * - se: alleen een schoolexamen, eigen eindcijfer (bijvoorbeeld maatschappijleer op het vmbo)
 * - combi: telt mee in het combinatiecijfer
 * - profiel: vmbo gemengd: het profielvak, met centraal examen, zwaar in het combinatiecijfer
 * - niet: telt niet mee in de cijfers (lichamelijke opvoeding, kunstvakken, profielwerkstuk op het vmbo)
 */
export type ExamenSoort = 'ce' | 'se' | 'combi' | 'profiel' | 'niet';

/** Zonder keuze: Klas+ raadt het aan de naam van het vak. */
export function standaardSoort(naam: string, niveau: Niveau): ExamenSoort {
  const n = naam.toLowerCase().trim();
  if (/lichamelijke opvoeding|^lo\b|^gym|mentor|studie(uur|begeleiding)|kwt|keuzewerktijd|rekenen|loopbaan|^lob\b|burgerschap/.test(n))
    return 'niet';
  if (isVmbo(niveau)) {
    // vmbo: kunstvakken (ook CKV) en het profielwerkstuk krijgen voldoende of goed, geen cijfer.
    if (/ckv|culturele en kunstzinnige|kunstvak|profielwerkstuk|^pws\b|sectorwerkstuk/.test(n)) return 'niet';
    if (/maatschappijleer/.test(n)) return 'se';
    if (/keuzevak/.test(n)) return 'combi';
    if (/profielvak/.test(n)) return niveau === 'gl' ? 'profiel' : 'ce';
    return 'ce';
  }
  // havo/vwo: maatschappijleer, CKV en het profielwerkstuk vormen samen het combinatiecijfer.
  if (/maatschappijleer|profielwerkstuk|^pws\b|ckv|culturele en kunstzinnige|^anw\b|algemene natuurwetenschappen|levensbeschouwing/.test(n))
    return 'combi';
  // Vakken met alleen een schoolexamen.
  if (/informatica|wiskunde\s*d\b|natuur,? leven en technologie|^nlt\b|bewegen,? sport|^bsm\b/.test(n)) return 'se';
  return 'ce';
}

const SLEUTEL = 'examen.vakken';
export const leesKeuzes = () => lees<Record<string, ExamenSoort>>(SLEUTEL) ?? {};
export const bewaarKeuzes = (k: Record<string, ExamenSoort>) => schrijf(SLEUTEL, k);
export const soortVan = (v: VakOverzicht, keuzes: Record<string, ExamenSoort>, niveau: Niveau): ExamenSoort => {
  const k = keuzes[v.vak.code];
  // "profiel" bestaat alleen bij vmbo gemengd.
  if (k === 'profiel' && niveau !== 'gl') return 'ce';
  return k ?? standaardSoort(v.vak.naam, niveau);
};

/** Nederlands, Engels en wiskunde (A, B of C): de kernvakken van havo en vwo. */
const isKernvak = (naam: string) => /^nederlands|^engels|^wiskunde(\s*[abc])?$/.test(naam.toLowerCase().trim());
const isNederlands = (naam: string) => /^nederlands/.test(naam.toLowerCase().trim());

/**
 * Afronden zoals de wet het zegt (art. 3.32 lid 2): eerst naar beneden op één decimaal, en is die decimaal
 * 5 of hoger, dan naar boven. Komt neer op: x,5 en hoger gaat omhoog.
 */
const heel = (n: number) => {
  const tiende = Math.floor(n * 10 + 1e-9) / 10;
  return Math.floor(tiende + 0.5 + 1e-9);
};
const opTiende = (n: number) => Math.round(n * 10 + 1e-9) / 10;
const komma = (n: number) => opTiende(n).toFixed(1).replace('.', ',');

export interface ExamenVak {
  naam: string;
  code: string;
  soort: 'ce' | 'se' | 'profiel';
  /** SE-cijfer, op één decimaal. */
  se: number;
  /** Bij een vak met CE: wat je minimaal op het CE nodig hebt voor een 6 als eindcijfer; null als dat niet meer kan. */
  ceNodig: number | null;
  /** Eindcijfer als je op het CE hetzelfde haalt als je SE (zonder CE: je SE, afgerond). */
  eind: number;
}

export interface SlaagUitslag {
  niveau: Niveau;
  /** Vakken met een eigen eindcijfer (met of zonder CE), plus het profielvak bij vmbo gemengd. */
  vakken: ExamenVak[];
  /** Het combinatiecijfer, als dat er is. */
  combi: { se: number; eind: number; delen: string[] } | null;
  stand: 'goed' | 'letop' | 'niet';
  kop: string;
  /** Uitleg bij "let op", of de redenen waarom je nu nog niet slaagt. */
  tekst: string[];
  /** Als je bij elk vak met CE precies het minimum haalt: zoveel is dan je CE-gemiddelde. */
  minimumGemiddelde: number | null;
  /** Wat niet in cijfers te vangen is en je zelf moet regelen (lichamelijke opvoeding, kunstvakken …). */
  ookNodig: string;
}

const opsomming = (namen: string[]) =>
  namen.length <= 1 ? namen.join('') : `${namen.slice(0, -1).join(', ')} en ${namen[namen.length - 1]}`;

/**
 * Rekent uit hoe je ervoor staat, met als schatting dat je op elk centraal examen hetzelfde haalt als je SE.
 * Eindcijfer = gemiddelde van SE en CE, afgerond op een heel cijfer (art. 3.32).
 */
export function berekenSlagen(overzicht: VakOverzicht[], keuzes: Record<string, ExamenSoort>, niveau: Niveau): SlaagUitslag {
  const vmbo = isVmbo(niveau);
  const metCijfer = overzicht.filter((v) => v.gemiddelde !== null);
  const soort = (v: VakOverzicht) => soortVan(v, keuzes, niveau);

  const vakken: ExamenVak[] = metCijfer
    .filter((v) => ['ce', 'se', 'profiel'].includes(soort(v)))
    .map((v) => {
      const s = soort(v) as 'ce' | 'se' | 'profiel';
      const se = opTiende(v.gemiddelde!);
      if (s === 'se') return { naam: v.vak.naam, code: v.vak.code, soort: s, se, ceNodig: null, eind: heel(se) };
      // Voor een 6 moet (SE + CE) / 2 minstens 5,5 zijn, dus CE ≥ 11 − SE (CE heeft één decimaal).
      const nodig = Math.max(1, Math.ceil((11 - se) * 10 - 1e-9) / 10);
      return { naam: v.vak.naam, code: v.vak.code, soort: s, se, ceNodig: nodig > 10 ? null : nodig, eind: heel(se) };
    });

  // Combinatiecijfer.
  // havo/vwo (art. 3.34 lid 2): gemiddelde van de eindcijfers van maatschappijleer, CKV, profielwerkstuk enz.
  // vmbo bb/kb (art. 3.35 lid 3): gemiddelde van de beroepsgerichte keuzevakken.
  // vmbo gl (art. 3.35 lid 4): profielvak en keuzevakken; het profielvak telt zo vaak mee als er keuzevakken zijn.
  const combiDelen = metCijfer.filter((v) => soort(v) === 'combi').map((v) => ({ naam: v.vak.naam, eind: heel(opTiende(v.gemiddelde!)) }));
  const profielvak = niveau === 'gl' ? vakken.find((v) => v.soort === 'profiel') : undefined;
  let combi: SlaagUitslag['combi'] = null;
  if (combiDelen.length || profielvak) {
    const keer = Math.max(1, combiDelen.length);
    const som = combiDelen.reduce((s, d) => s + d.eind, 0) + (profielvak ? profielvak.eind * keer : 0);
    const aantal = combiDelen.length + (profielvak ? keer : 0);
    combi = {
      se: opTiende(som / aantal),
      eind: heel(som / aantal),
      delen: [...(profielvak ? [`${profielvak.naam} (profielvak)`] : []), ...combiDelen.map((d) => d.naam)],
    };
  }

  // De eindcijfers waar de uitslagregel mee rekent: elk vak met een eigen eindcijfer, plus het combinatiecijfer.
  // Bij vmbo gemengd zit het profielvak in het combinatiecijfer en telt het niet los mee.
  const eindcijfers = [
    ...vakken.filter((v) => v.soort !== 'profiel').map((v) => ({ naam: v.naam, eind: v.eind })),
    ...(combi ? [{ naam: 'het combinatiecijfer', eind: combi.eind }] : []),
  ];
  const ookNodig = vmbo
    ? niveau === 'gl' || niveau === 'tl'
      ? 'Daarnaast heb je een voldoende of goed nodig voor lichamelijke opvoeding, de kunstvakken (CKV) en je profielwerkstuk.'
      : 'Daarnaast heb je een voldoende of goed nodig voor lichamelijke opvoeding en de kunstvakken (CKV).'
    : 'Daarnaast heb je een voldoende of goed nodig voor lichamelijke opvoeding.';

  const ceVakken = vakken.filter((v) => v.soort !== 'se');
  const minimumGemiddelde = ceVakken.length ? ceVakken.reduce((s, v) => s + (v.ceNodig ?? 10), 0) / ceVakken.length : null;
  if (eindcijfers.length === 0) {
    return { niveau, vakken, combi, stand: 'niet', kop: 'Nog geen cijfers', tekst: [], minimumGemiddelde, ookNodig };
  }

  const gemiddelde = eindcijfers.reduce((s, e) => s + e.eind, 0) / eindcijfers.length;
  const vijven = eindcijfers.filter((e) => e.eind === 5);
  const vieren = eindcijfers.filter((e) => e.eind === 4);
  const teLaag = eindcijfers.filter((e) => e.eind < 4);
  const onv = [...vieren, ...vijven];
  const zevenOfHoger = eindcijfers.some((e) => e.eind >= 7);
  const ceGemiddelde = ceVakken.length ? ceVakken.reduce((s, v) => s + v.se, 0) / ceVakken.length : null;

  const redenen: string[] = [];
  // Geen eindcijfer, en geen onderdeel van het combinatiecijfer, lager dan een 4.
  if (teLaag.length)
    redenen.push(`${opsomming(teLaag.map((e) => e.naam))} ${teLaag.length === 1 ? 'staat' : 'staan'} lager dan een 4; dan slaag je niet.`);
  const combiTeLaag = [...combiDelen.filter((d) => d.eind < 4).map((d) => d.naam), ...(profielvak && profielvak.eind < 4 ? [profielvak.naam] : [])];
  if (combiTeLaag.length) redenen.push(`${opsomming(combiTeLaag)} in je combinatiecijfer ${combiTeLaag.length === 1 ? 'staat' : 'staan'} lager dan een 4; dat mag niet.`);

  // Compenseren (art. 3.34 lid 1c voor havo/vwo, 3.35 lid 1c voor vmbo).
  let regelOk: boolean;
  let waarom = '';
  if (onv.length === 0 || (onv.length === 1 && vijven.length === 1)) regelOk = true;
  else if (vmbo) {
    // vmbo: één 4, of twee 5'en, en de rest 6 of hoger met minstens één 7.
    const toegestaan = (vieren.length === 1 && vijven.length === 0) || (vieren.length === 0 && vijven.length === 2);
    regelOk = toegestaan && zevenOfHoger;
    waarom = toegestaan
      ? `Daarmee slaag je alleen als je ook minstens één 7 of hoger hebt${zevenOfHoger ? ', en die heb je.' : '; die heb je nu niet.'}`
      : 'Dat zijn er te veel: op het vmbo mag je hooguit één 4 of twee 5\'en hebben.';
  } else {
    // havo/vwo: één 4, twee 5'en, of een 4 en een 5, en de rest 6 of hoger met een gemiddelde van minstens 6,0.
    const toegestaan = vieren.length + vijven.length <= 2 && vieren.length <= 1;
    regelOk = toegestaan && gemiddelde >= 6;
    waarom = toegestaan
      ? `Daarmee slaag je alleen met een gemiddelde van minstens 6,0. Je zit nu op ${komma(gemiddelde)}.`
      : 'Dat zijn er te veel: je mag hooguit twee onvoldoendes hebben, en maar één 4.';
  }
  if (!teLaag.length && !regelOk)
    redenen.push(`${opsomming(onv.map((e) => e.naam))} ${onv.length === 1 ? 'staat' : 'staan'} onvoldoende. ${waarom}`);

  // Speciale vakken.
  if (vmbo) {
    const ned = vakken.find((v) => isNederlands(v.naam));
    if (ned && ned.eind < 5) redenen.push(`Voor Nederlands heb je minstens een 5 als eindcijfer nodig; je staat op een ${ned.eind}.`);
  } else {
    const kern = vakken.filter((v) => isKernvak(v.naam));
    const kernLaag = kern.filter((v) => v.eind < 5);
    const kernVijf = kern.filter((v) => v.eind === 5);
    if (kernLaag.length) redenen.push(`Voor Nederlands, Engels en wiskunde mag je geen 4 of lager hebben (${opsomming(kernLaag.map((v) => v.naam))}).`);
    else if (kernVijf.length > 1)
      redenen.push(`Van Nederlands, Engels en wiskunde mag er hooguit één een 5 zijn (${opsomming(kernVijf.map((v) => v.naam))}).`);
  }
  if (ceGemiddelde !== null && ceGemiddelde < 5.5)
    redenen.push(`Je centraal examens moeten gemiddeld minstens een 5,5 zijn; met je SE als schatting kom je op ${komma(ceGemiddelde)}.`);

  if (redenen.length) return { niveau, vakken, combi, stand: 'niet', kop: 'Zo slaag je nog niet', tekst: redenen, minimumGemiddelde, ookNodig };

  if (onv.length === 0)
    return {
      niveau, vakken, combi, stand: 'goed', kop: 'Je ligt op koers',
      tekst: ['Haal je op het centraal examen hetzelfde als je SE, dan slaag je.'], minimumGemiddelde, ookNodig,
    };
  const tekst =
    onv.length === 1 && vijven.length === 1
      ? `${onv[0].naam} staat op een 5. Met één vijf slaag je nog, maar er mag niet nog een onvoldoende bij.`
      : `${opsomming(onv.map((e) => e.naam))} ${onv.length === 1 ? 'staat' : 'staan'} onvoldoende. ${waarom}`;
  return {
    niveau, vakken, combi, stand: 'letop',
    kop: onv.length === 1 ? 'Let op bij één vak' : `Let op bij ${onv.length} vakken`,
    tekst: [tekst], minimumGemiddelde, ookNodig,
  };
}
