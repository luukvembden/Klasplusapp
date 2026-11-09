// Nep-data voor de demo. Alle namen zijn verzonnen.
import type { Afwezigheid, Bericht, Cijfer, Contact, Label, Melding, Opdracht, Profiel, Reden, Vak } from '../api/types';
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
    les(2, 'WB – KR – 4V2', '3.12', ['gewijzigd']),
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
    les(3, 'NA – PT – 4V2', 'B.08', ['gewijzigd']),
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
  cijfer(vakken.ne, 'Leesdossier', '2026-09-16', 1, 7.7),
  cijfer(vakken.wb, 'Hoofdstuk 1', '2026-09-18', 2, 5.6),
  cijfer(vakken.bi, 'Hoofdstuk 2', '2026-09-22', 2, 6.9),
  cijfer(vakken.sk, 'Practicum zouten', '2026-09-24', 1, 7.1),
  cijfer(vakken.gs, 'Oudheid', '2026-09-17', 2, 6.2),
  cijfer(vakken.en, 'Schrijfopdracht', '2026-09-11', 1, 6.8),
  cijfer(vakken.fa, 'Grammatica', '2026-09-15', 1, 5.4),
  cijfer(vakken.bi, 'Hoofdstuk 1', '2026-09-09', 2, 7.6),
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

// ---- Berichten en opdrachten (verzonnen; datums ten opzichte van vandaag) ----

const dagenGeleden = (dagen: number, uur = 9, minuut = 0) => {
  const d = new Date();
  d.setDate(d.getDate() - dagen);
  d.setHours(uur, minuut, 0, 0);
  return d.toISOString();
};

const criteria = { id: 'b1', naam: 'Criteria betoog.pdf', grootte: 219_000, bron: '' };

/** Postvak in de demo. "gelezen" is de beginstand; wat je opent wordt op het toestel onthouden. */
export const demoBerichten: Bericht[] = [
  {
    id: 'bericht-1',
    onderwerp: 'Inleveren betoog verschoven',
    afzender: 'D. de Vries',
    aan: ['4V2'],
    verzondenOp: dagenGeleden(0, 9, 12),
    gelezen: false,
    heeftBijlagen: true,
    belangrijk: false,
    inhoudHtml:
      '<p>Beste 4V2,</p><p>De deadline voor het betoog is verplaatst naar <strong>vrijdag</strong>. In de bijlage vinden jullie de beoordelingscriteria nog een keer.</p><p>Groet, mevrouw De Vries</p>',
    ontvangers: ['4V2'],
    bijlagen: [criteria],
  },
  {
    id: 'bericht-2',
    onderwerp: 'Ouderavond donderdag',
    afzender: 'Mentor 4V2',
    aan: ['4V2', 'Ouders 4V2'],
    verzondenOp: dagenGeleden(1, 16, 40),
    gelezen: false,
    heeftBijlagen: false,
    belangrijk: true,
    inhoudHtml:
      '<p>Beste leerlingen,</p><p>Donderdag is de ouderavond. Jullie ouders hebben een uitnodiging gekregen. Neem je planner mee als je ook komt.</p><p>Groeten, je mentor</p>',
    ontvangers: ['4V2', 'Ouders 4V2'],
    bijlagen: [],
  },
  {
    id: 'bericht-3',
    onderwerp: 'Uitwerkingen hoofdstuk 3',
    afzender: 'K. Rietveld',
    aan: ['4V2'],
    verzondenOp: dagenGeleden(2, 13, 5),
    gelezen: false,
    heeftBijlagen: true,
    belangrijk: false,
    inhoudHtml:
      '<p>Bijgevoegd de uitwerkingen van de oefentoets. Kijk vooral naar opgave 4 en 7, daar gingen de meeste punten verloren.</p>',
    ontvangers: ['4V2'],
    bijlagen: [{ id: 'b2', naam: 'Uitwerkingen H3.pdf', grootte: 512_000, bron: '' }],
  },
  {
    id: 'bericht-4',
    onderwerp: 'Wijziging lokaal wiskunde',
    afzender: 'Roosterbureau',
    aan: ['4V2'],
    verzondenOp: dagenGeleden(5, 8, 2),
    gelezen: true,
    heeftBijlagen: false,
    belangrijk: false,
    inhoudHtml: '<p>Het 2e uur wiskunde op maandag is verplaatst naar lokaal 3.12.</p>',
    ontvangers: ['4V2'],
    bijlagen: [],
  },
  {
    id: 'bericht-5',
    onderwerp: 'Leesvaardigheid',
    afzender: 'S. Mulder',
    aan: ['4V2'],
    verzondenOp: dagenGeleden(9, 15, 30),
    gelezen: true,
    heeftBijlagen: false,
    belangrijk: false,
    inhoudHtml: '<p>Goed gedaan vandaag! Voor volgende week lezen jullie tekst 4 en 5 uit het tekstboek.</p>',
    ontvangers: ['4V2'],
    bijlagen: [],
  },
];

/** Wat de demo-leerling zelf verstuurde. */
export const demoVerzonden: Bericht[] = [
  {
    id: 'verzonden-1',
    onderwerp: 'Vraag over het betoog',
    afzender: 'Vera Lindeman',
    aan: ['D. de Vries'],
    verzondenOp: dagenGeleden(1, 19, 48),
    gelezen: true,
    heeftBijlagen: false,
    belangrijk: false,
    inhoudHtml:
      '<p>Beste mevrouw De Vries,</p><p>Mogen we voor het betoog ook een bron in het Engels gebruiken?</p><p>Groet, Vera</p>',
    ontvangers: ['D. de Vries'],
    bijlagen: [],
  },
  {
    id: 'verzonden-2',
    onderwerp: 'Afwezig bij practicum',
    afzender: 'Vera Lindeman',
    aan: ['V. Bakker', 'Mentor 4V2'],
    verzondenOp: dagenGeleden(4, 7, 55),
    gelezen: true,
    heeftBijlagen: false,
    belangrijk: false,
    inhoudHtml: '<p>Ik ben vandaag bij de tandarts en mis daardoor het practicum. Kan ik het inhalen?</p>',
    ontvangers: ['V. Bakker', 'Mentor 4V2'],
    bijlagen: [],
  },
];

export const demoOpdrachten: Opdracht[] = [
  {
    id: 'opdracht-1',
    titel: 'Betoog over schermtijd',
    vak: 'Nederlands',
    inleverenVoor: dagenGeleden(-4, 23, 59),
    ingeleverdOp: null,
    status: 'open',
    beoordeling: null,
    omschrijvingHtml:
      '<p>Schrijf een betoog van 600 tot 800 woorden over de vraag of schermtijd op school beperkt moet worden. Gebruik minstens twee bronnen.</p>',
    docenten: ['D. de Vries'],
    bijlagen: [criteria],
    feedbackHtml: null,
    feedbackBijlagen: [],
  },
  {
    id: 'opdracht-2',
    titel: 'Bronnenonderzoek Eerste Wereldoorlog',
    vak: 'Geschiedenis',
    inleverenVoor: dagenGeleden(-7, 23, 59),
    ingeleverdOp: null,
    status: 'open',
    beoordeling: null,
    omschrijvingHtml: '<p>Zoek drie bronnen over het leven in de loopgraven en beantwoord de vragen in het werkblad.</p>',
    docenten: ['J. Nijhuis'],
    bijlagen: [],
    feedbackHtml: null,
    feedbackBijlagen: [],
  },
  {
    id: 'opdracht-3',
    titel: 'Practicumverslag cellen',
    vak: 'Biologie',
    inleverenVoor: dagenGeleden(3, 17, 0),
    ingeleverdOp: null,
    status: 'te-laat',
    beoordeling: null,
    omschrijvingHtml: '<p>Maak een verslag van het practicum met de microscoop. Gebruik het sjabloon uit de les.</p>',
    docenten: ['V. Bakker'],
    bijlagen: [],
    feedbackHtml: null,
    feedbackBijlagen: [],
  },
  {
    id: 'opdracht-4',
    titel: 'Luistertoets voorbereiding',
    vak: 'Frans',
    inleverenVoor: dagenGeleden(6, 23, 59),
    ingeleverdOp: dagenGeleden(7, 20, 15),
    status: 'beoordeeld',
    beoordeling: '7,5',
    omschrijvingHtml: '<p>Luister fragment 1 tot en met 3 en maak de vragen.</p>',
    docenten: ['L. Meijer'],
    bijlagen: [],
    feedbackHtml: '<p>Goed gedaan! Let bij fragment 3 nog op de werkwoordstijden.</p>',
    feedbackBijlagen: [],
  },
  {
    id: 'opdracht-5',
    titel: 'Samenvatting hoofdstuk 2',
    vak: 'Scheikunde',
    inleverenVoor: dagenGeleden(10, 23, 59),
    ingeleverdOp: dagenGeleden(11, 19, 2),
    status: 'ingeleverd',
    beoordeling: null,
    omschrijvingHtml: '<p>Maak een samenvatting van hoofdstuk 2 van maximaal een A4.</p>',
    docenten: ['H. Fransen'],
    bijlagen: [],
    feedbackHtml: null,
    feedbackBijlagen: [],
  },
];

/** Mensen die je in de demo als ontvanger kunt kiezen. */
export const demoContacten: Contact[] = [
  { id: 101, naam: 'D. de Vries', soort: 'docent', extra: 'DV' },
  { id: 102, naam: 'K. Rietveld', soort: 'docent', extra: 'KR' },
  { id: 103, naam: 'S. Mulder', soort: 'docent', extra: 'SM' },
  { id: 104, naam: 'V. Bakker', soort: 'docent', extra: 'VB' },
  { id: 105, naam: 'J. Nijhuis', soort: 'docent', extra: 'JN' },
  { id: 106, naam: 'B. Kok', soort: 'docent', extra: 'BK' },
  { id: 107, naam: 'H. Fransen', soort: 'docent', extra: 'HF' },
  { id: 108, naam: 'L. Meijer', soort: 'docent', extra: 'LM' },
  { id: 109, naam: 'P. Terpstra', soort: 'docent', extra: 'PT' },
  { id: 201, naam: 'Sem de Boer', soort: 'leerling', extra: '4V2' },
  { id: 202, naam: 'Noa Visser', soort: 'leerling', extra: '4V2' },
  { id: 203, naam: 'Daan Smit', soort: 'leerling', extra: '4V1' },
];
