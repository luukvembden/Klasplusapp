// Nep-data voor de demo. Alle namen zijn verzonnen.
import type { Afwezigheid, Cijfer, Label, Melding, Profiel, Reden, Vak } from '../api/types';
import { nlMoment } from '../lib/datum';

export const demoProfiel: Profiel = {
  naam: 'Vera Lindeman',
  initialen: 'VL',
  school: 'Lyceum De Linde',
  klas: '4 vwo',
  periode: 'Periode 1',
};

/** Voor de demo als ouder: de ouder en twee kinderen, met per kind de klas. */
export const demoOuder = { naam: 'Marieke Lindeman', initialen: 'ML' };
export const demoKinderen = [
  { id: 1, naam: 'Vera Lindeman', initialen: 'VL', klas: '4 vwo' },
  { id: 2, naam: 'Daan Lindeman', initialen: 'DL', klas: '2 havo' },
];

/** Begin- en eindtijd per lesuur (index 0 = 1e uur). */
export const demoLesuren: [string, string][] = [
  ['08:25', '09:15'],
  ['09:15', '10:05'],
  ['10:20', '11:10'],
  ['11:10', '12:05'],
  ['12:25', '13:15'],
  ['13:15', '14:05'],
  ['14:20', '15:10'],
  ['15:10', '16:00'],
];

export interface DemoLes {
  uur: number;
  omschrijving: string;
  lokaal: string | null;
  labels: Label[];
}

const les = (uur: number, omschrijving: string, lokaal: string | null, labels: Label[] = []): DemoLes => ({
  uur,
  omschrijving,
  lokaal,
  labels,
});

/** Vakcode uit de lesomschrijving → volledige vaknaam. */
export const demoVakken: Record<string, string> = {
  NE: 'nederlands',
  WB: 'wiskunde B',
  EN: 'engels',
  BI: 'biologie',
  GS: 'geschiedenis',
  LO: 'lichamelijke opvoeding',
  SK: 'scheikunde',
  FA: 'frans',
  NA: 'natuurkunde',
  MEN: 'mentoruur',
};

/** Docentcode → naam. */
export const demoDocenten: Record<string, string> = {
  DV: 'D. de Vries',
  KR: 'K. Rietveld',
  SM: 'S. Mulder',
  VB: 'V. Bakker',
  JN: 'J. Nijhuis',
  BK: 'B. Kok',
  HF: 'H. Fransen',
  LM: 'L. Meijer',
  PT: 'P. Terpstra',
};

/** Wat de docent bij een label typte. */
export const demoInhoud: Partial<Record<Label, string>> = {
  huiswerk:
    '<p>Lees paragraaf 2.3 en maak opdracht 12 t/m 18.</p><p>Neem je werkboek mee, we bespreken de antwoorden in de les.</p>',
  proefwerk:
    '<p><strong>Proefwerk hoofdstuk 3</strong></p><ul><li>Alle paragrafen</li><li>Begrippenlijst achterin</li><li>Rekenmachine mag</li></ul><p>Succes met leren!</p>',
  so: '<p>SO over de woordjes van unit 2 (blz. 34–35), beide kanten op.</p>',
  informatie: '<p>Deze les zitten we in het computerlokaal.</p>',
};

/** Lesweek als sjabloon: index 0 = maandag, 6 = zondag. Elke week ziet er in de demo zo uit. */
export const demoWeek: DemoLes[][] = [
  [
    les(1, 'NE – DV – 4V2', '2.14', ['huiswerk']),
    les(2, 'WB – KR – 4V2', '1.08'),
    les(3, 'EN – SM – 4V2', '2.03', ['vervalt']),
    les(4, 'BI – VB – 4V2', 'B.12', ['so']),
    les(5, 'GS – JN – 4V2', '3.01', ['huiswerk']),
    les(6, 'LO – BK – 4V2', 'GYM1'),
  ],
  [
    les(1, 'EN – SM – 4V2', '2.03', ['so']),
    les(2, 'NE – DV – 4V2', '2.14', ['huiswerk']),
    les(3, 'SK – HF – 4V2', 'B.04'),
    les(4, 'WB – KR – 4V2', '1.08', ['proefwerk']),
    les(5, 'FA – LM – 4V2', '2.11', ['so']),
    les(6, 'K_WIS', '1.06', ['ingeschreven', 'huiswerk']),
    les(7, 'K_BIO', 'B.10', ['ingeschreven', 'huiswerk']),
    les(8, 'K_VRIJ', null, ['kwt']),
  ],
  [
    les(1, 'NA – PT – 4V2', 'B.06', ['huiswerk']),
    les(2, 'NE – DV – 4V2', '2.14'),
    les(3, 'MEN – VB – 4V2', 'B.12'),
  ],
  [
    les(2, 'GS – JN – 4V2', '3.01'),
    les(3, 'BI – VB – 4V2', 'B.12', ['proefwerk']),
    les(4, 'EN – SM – 4V2', '2.03', ['huiswerk']),
    les(5, 'WB – KR – 4V2', '1.08'),
    les(6, 'K_NED', '2.14', ['ingeschreven']),
  ],
  [
    les(1, 'SK – HF – 4V2', 'B.04'),
    les(2, 'FA – LM – 4V2', '2.11', ['huiswerk']),
    les(3, 'NA – PT – 4V2', 'B.06'),
  ],
  [],
  [],
];

const vakken = {
  ne: { code: 'ne', naam: 'Nederlands', volgnummer: 1 },
  en: { code: 'en', naam: 'Engels', volgnummer: 2 },
  wb: { code: 'wisb', naam: 'Wiskunde B', volgnummer: 3 },
  bi: { code: 'biol', naam: 'Biologie', volgnummer: 4 },
  gs: { code: 'gs', naam: 'Geschiedenis', volgnummer: 5 },
  sk: { code: 'sk', naam: 'Scheikunde', volgnummer: 6 },
  fa: { code: 'fa', naam: 'Frans', volgnummer: 7 },
} satisfies Record<string, Vak>;

const cijfer = (vak: Vak, omschrijving: string, datum: string, weging: number, waarde: number): Cijfer => ({
  id: `${vak.code}-${datum}`,
  vak,
  omschrijving,
  datum: `${datum}T12:00:00`,
  weging,
  waarde,
  weergave: waarde.toFixed(1).replace('.', ','),
  teltMee: true,
});

export const demoCijfers: Cijfer[] = [
  cijfer(vakken.ne, 'Spelling', '2026-09-30', 1, 6.8),
  cijfer(vakken.ne, 'Betoog', '2026-10-14', 2, 7.2),
  cijfer(vakken.en, 'Woordjes unit 1', '2026-09-25', 1, 6.1),
  cijfer(vakken.en, 'Leesvaardigheid', '2026-10-09', 1, 5.2),
  cijfer(vakken.en, 'Grammatica', '2026-10-23', 1, 4.9),
  cijfer(vakken.wb, 'Hoofdstuk 2', '2026-10-02', 2, 6.3),
  cijfer(vakken.wb, 'Hoofdstuk 3', '2026-10-26', 2, 7.4),
  cijfer(vakken.bi, 'Hoofdstuk 3', '2026-10-07', 2, 7.0),
  cijfer(vakken.bi, 'Practicum cellen', '2026-10-22', 1, 8.1),
  cijfer(vakken.gs, 'Middeleeuwen', '2026-10-01', 2, 6.6),
  cijfer(vakken.gs, 'Bronnenopdracht', '2026-10-16', 1, 7.5),
  cijfer(vakken.sk, 'Hoofdstuk 1', '2026-10-06', 2, 5.8),
  cijfer(vakken.fa, 'Woordjes', '2026-09-29', 1, 7.9),
  cijfer(vakken.fa, 'Luistertoets', '2026-10-20', 1, 6.4),
];

/** Afwezigheden in de demo: [datum, lesuur, vak, reden, geoorloofd]. */
const afwezig = (datum: string, uur: number, vak: string, reden: string, geoorloofd: boolean): Afwezigheid => {
  const [start, einde] = demoLesuren[uur - 1];
  return {
    id: `${datum}-${uur}`,
    start: `${datum}T${start}:00`,
    einde: `${datum}T${einde}:00`,
    lesuur: uur,
    vak,
    reden,
    geoorloofd,
  };
};

export const demoAfwezigheden: Afwezigheid[] = [
  afwezig('2026-10-20', 1, 'Engels', 'Te laat', false),
  afwezig('2026-10-14', 3, 'Scheikunde', 'Ziek', true),
  afwezig('2026-10-14', 4, 'Wiskunde B', 'Ziek', true),
  afwezig('2026-10-02', 2, 'Nederlands', 'Huiswerk vergeten', false),
  afwezig('2026-09-23', 5, 'Frans', 'Tandarts', true),
  afwezig('2026-09-08', 1, 'Biologie', 'Te laat', true),
];

/** Redenen om afwezig te melden, zoals een school ze kan instellen. */
export const demoRedenen: Reden[] = [
  { code: 'ZK', naam: 'Ziek', toelichtingVerplicht: false },
  { code: 'TA', naam: 'Tandarts/orthodontist', toelichtingVerplicht: false },
  { code: 'HA', naam: 'Huisarts/ziekenhuis', toelichtingVerplicht: false },
  { code: 'BO', naam: 'Bijzondere omstandigheden', toelichtingVerplicht: true },
  { code: 'RF', naam: 'Religieuze feestdag', toelichtingVerplicht: false },
];

/** Eerdere meldingen, alsof een ouder ze via de officiële app deed. */
export const demoMeldingen: Melding[] = [
  {
    id: 'demo-1',
    reden: 'Ziek',
    heleDag: true,
    start: nlMoment(2026, 9, 14).toISOString(),
    einde: nlMoment(2026, 9, 15).toISOString(),
    opmerking: 'Koorts',
    gemeldOp: nlMoment(2026, 9, 14, 7, 42).toISOString(),
  },
  {
    id: 'demo-2',
    reden: 'Tandarts/orthodontist',
    heleDag: false,
    start: nlMoment(2026, 8, 23, 11, 0).toISOString(),
    einde: nlMoment(2026, 8, 23, 12, 30).toISOString(),
    opmerking: '',
    gemeldOp: nlMoment(2026, 8, 21, 19, 5).toISOString(),
  },
];
