// De vorm van de gegevens waar de schermen mee werken.
// Elke bron (demo of de echte koppeling) levert precies deze typen.

/** Elke opgehaalde lijst komt met het moment waarop hij is opgehaald. */
export interface Resultaat<T> {
  data: T;
  /** ISO-tijdstip, voor de regel "Bijgewerkt op …". */
  opgehaaldOp: string;
  /** True als de bron niet bereikbaar was en dit de laatst bewaarde versie is. */
  offline?: boolean;
}

export interface Profiel {
  naam: string;
  initialen: string;
  school: string;
  /** Bijvoorbeeld "4 vwo". */
  klas: string;
  /** Bijvoorbeeld "Periode 1". */
  periode: string;
  /**
   * Alleen bij een ouderaccount. `naam` en `initialen` zijn dan van de ouder;
   * school, klas en periode horen bij het gekozen kind.
   */
  ouder?: { kinderen: Kind[]; gekozen: number };
}

/** Een kind van een ouderaccount. */
export interface Kind {
  id: number;
  naam: string;
  initialen: string;
}

export type Label =
  | 'huiswerk'
  | 'proefwerk'
  | 'tentamen'
  | 'so'
  | 'mondeling'
  | 'informatie'
  | 'ingeschreven'
  | 'eigen'
  | 'kwt'
  | 'vervalt'
  /** Iets aan de les is anders dan normaal: docent, lokaal, tijd. */
  | 'gewijzigd'
  /** Een leermoment uit een leerplan voor een toets (alleen op dit toestel). */
  | 'leren';

export interface Afspraak {
  id: string;
  /** ISO-tijdstippen. */
  start: string;
  einde: string;
  /** Duurt de hele dag; dan tonen we geen tijden. */
  heleDag?: boolean;
  /** Nummer van het lesuur, of null voor afspraken buiten het rooster. */
  lesuur: number | null;
  /** Bijvoorbeeld "NE – DV – 4V2" of "K_WIS". */
  omschrijving: string;
  lokaal: string | null;
  labels: Label[];
  /** Volledige vaknaam, bijvoorbeeld "aardrijkskunde". */
  vak: string | null;
  /** Namen van de docenten, bijvoorbeeld "W.J.J.H. Kennis". */
  docenten: string[];
  /** Wat de docent heeft getypt (huiswerk, toetsstof, informatie), als HTML van de school. */
  inhoudHtml: string | null;
  /** Heeft de leerling het huiswerk afgevinkt? Zelfde vinkje als in de officiële app. */
  afgerond: boolean;
  /** De docent heeft er bestanden bij gezet (te zien op de lespagina). */
  heeftBijlagen?: boolean;
}

/** Wat de leerling invult voor een eigen (persoonlijke) afspraak. */
export interface AfspraakInvoer {
  titel: string;
  heleDag: boolean;
  /** ISO-tijdstippen. Bij een hele dag: begin van de eerste dag tot begin van de dag na de laatste. */
  start: string;
  einde: string;
  locatie: string;
  beschrijving: string;
}

/** Alles van één afspraak, voor het scherm Lesinformatie. */
export interface AfspraakDetail extends Afspraak {
  /** ISO-tijdstippen waarop de docent het huiswerk maakte en voor het laatst aanpaste. */
  aangemaaktOp: string | null;
  gewijzigdOp: string | null;
  /** Klassen of groepen, bijvoorbeeld "h5.ak4". */
  groepen: string[];
  /** Bestanden die de docent bij het huiswerk of de les zette. */
  bijlagen: Bijlage[];
}

/** Eén keer afwezig (of te laat, uit de les gestuurd, enzovoort), zoals de school het registreerde. */
export interface Afwezigheid {
  id: string;
  /** ISO-tijdstippen van de les of periode. */
  start: string;
  einde: string;
  lesuur: number | null;
  /** Vaknaam, of de omschrijving van de les als er geen vak bij staat. */
  vak: string;
  /** De reden, bijvoorbeeld "Ziek", "Te laat" of "Absent". */
  reden: string;
  /** Heeft de school de afwezigheid goedgekeurd? */
  geoorloofd: boolean;
}

/** Een reden die de school voor afwezig melden aanbiedt, bijvoorbeeld "Ziek" of "Tandarts". */
export interface Reden {
  code: string;
  naam: string;
  /** Moet er dan een toelichting bij? */
  toelichtingVerplicht: boolean;
}

/** Wat er voor dit account mogelijk is bij afwezigheidsmeldingen. */
export interface MeldOpties {
  /** Mag dit account zelf melden? Zo niet, dan kun je de meldingen alleen bekijken (zoals een leerling). */
  kanMelden: boolean;
  /** Leeg als de school geen redenen aanbiedt; dan meld je zonder reden. */
  redenen: Reden[];
  /** Oude manier van de school: alleen een hele dag, vandaag of morgen. */
  alleenVandaagOfMorgen: boolean;
  /** Komen alle meldingen van de school (ook uit de officiële app), of alleen die van dit toestel? */
  meldingenVanSchool: boolean;
}

/** Wat je invult om afwezig te melden. */
export interface MeldingInvoer {
  /** De gekozen reden, of null als de school geen redenen aanbiedt. */
  reden: Reden | null;
  heleDag: boolean;
  /** ISO-tijdstippen. Bij een hele dag: begin van de eerste dag tot begin van de dag na de laatste. */
  start: string;
  einde: string;
  opmerking: string;
}

/** Een afwezigheidsmelding, zoals de school hem kent. */
export interface Melding {
  id: string;
  /** Bijvoorbeeld "Ziek"; "Afwezig" als er geen reden is. */
  reden: string;
  heleDag: boolean;
  /** ISO-tijdstippen. Het einde ontbreekt bij een ziekmelding zonder betermelding. */
  start: string;
  einde: string | null;
  opmerking: string;
  /** ISO-tijdstip waarop de melding is gedaan, als dat bekend is. */
  gemeldOp: string | null;
}

export interface Vak {
  code: string;
  naam: string;
  /** Vaste volgorde van vakken, zoals de school die gebruikt. */
  volgnummer: number;
}

export interface Cijfer {
  id: string;
  vak: Vak;
  /** Naam van de toets, bijvoorbeeld "Hoofdstuk 3". */
  omschrijving: string;
  /** ISO-datum waarop het cijfer is ingevoerd. */
  datum: string;
  weging: number;
  /** Het cijfer als getal, of null bij een beoordeling als "V" of "G". */
  waarde: number | null;
  /** Zoals de school het cijfer noteert, bijvoorbeeld "7,4" of "V". */
  weergave: string;
  /** Telt het cijfer mee voor het gemiddelde? */
  teltMee: boolean;
}

// ---- Berichten ----

/** Een leermiddel dat de school voor je klaarzet: een digitale methode, werkboek of licentie. */
export interface Leermiddel {
  id: string;
  /** "Getal & Ruimte 4 vwo deel 1" */
  titel: string;
  /** "Wiskunde B" */
  vak: string | null;
  /** "Noordhoff" */
  uitgever: string | null;
  /** Adres om de methode te openen (soms via de schoolserver, die doorstuurt naar de uitgever). */
  link: string | null;
}

/** Een studiewijzer: de planning die een docent voor een vak en periode maakt. */
export interface StudiewijzerKort {
  id: string;
  titel: string;
  /** ISO-datums van de periode, als bekend. */
  van: string | null;
  tot: string | null;
  /** Vakcodes, bijvoorbeeld ["wisB"]. */
  vakken: string[];
}

/** Eén onderdeel (vaak een week of hoofdstuk) van een studiewijzer. */
export interface StudiewijzerOnderdeel {
  id: string;
  titel: string;
  /** Wat de docent erbij schreef, als HTML van de school. */
  omschrijvingHtml: string | null;
  van: string | null;
  tot: string | null;
  /** Bestanden en links die de docent erbij zette. */
  bronnen: Bijlage[];
}

export interface Studiewijzer extends StudiewijzerKort {
  onderdelen: StudiewijzerOnderdeel[];
}

/** Een bijlage bij een bericht of opdracht. */
export interface Bijlage {
  id: string;
  naam: string;
  /** In bytes, als bekend. */
  grootte: number | null;
  /** Waar de bijlage te downloaden is; alleen voor de koppeling, niet om te tonen. */
  bron: string;
}

/** Welke map: wat je kreeg, of wat je zelf verstuurde. */
export type BerichtMap = 'postvak' | 'verzonden';

/** Een bericht in het postvak, zoals in de lijst. */
export interface BerichtKort {
  id: string;
  onderwerp: string;
  afzender: string;
  /** Aan wie het ging; vooral voor verzonden berichten. */
  aan: string[];
  /** ISO-tijdstip. */
  verzondenOp: string;
  gelezen: boolean;
  heeftBijlagen: boolean;
  belangrijk: boolean;
}

/** Een geopend bericht. */
export interface Bericht extends BerichtKort {
  /** De tekst zoals de afzender die typte (HTML); wij tonen hem als gewone tekst. */
  inhoudHtml: string | null;
  /** Ontvangers en kopie-ontvangers samen. */
  ontvangers: string[];
  bijlagen: Bijlage[];
  /** De afzender als ontvanger voor een antwoord, als school die meestuurt. */
  afzenderContact?: Contact | null;
}

/** Iemand aan wie je een bericht kunt sturen. */
export interface Contact {
  id: number;
  naam: string;
  soort: 'docent' | 'leerling' | 'anders';
  /** Docentcode of klas, om mensen met dezelfde naam uit elkaar te houden. */
  extra: string | null;
}

/** Wat je invult voor een nieuw bericht. */
export interface BerichtInvoer {
  aan: Contact[];
  onderwerp: string;
  /** Gewone tekst; regeleinden blijven staan. */
  tekst: string;
}

// ---- Opdrachten ----

/** Open: nog in te leveren. Te laat: datum voorbij en niets ingeleverd. */
export type OpdrachtStatus = 'open' | 'te-laat' | 'ingeleverd' | 'beoordeeld';

export interface OpdrachtKort {
  id: string;
  titel: string;
  vak: string;
  /** ISO-tijdstip, of null als er geen inleverdatum is. */
  inleverenVoor: string | null;
  ingeleverdOp: string | null;
  status: OpdrachtStatus;
  /** Bijvoorbeeld "7,5" of "Goed", als de docent heeft beoordeeld. */
  beoordeling: string | null;
}

export interface Opdracht extends OpdrachtKort {
  omschrijvingHtml: string | null;
  docenten: string[];
  bijlagen: Bijlage[];
  /** Wat de docent bij de laatste versie terugschreef. */
  feedbackHtml: string | null;
  feedbackBijlagen: Bijlage[];
}

// ---- Activiteiten ----

/** Een activiteit van school waarvoor je je kunt inschrijven, zoals een excursie of keuzemiddag. */
export interface Activiteit {
  id: string;
  titel: string;
  detailsHtml: string | null;
  /** ISO-tijdstippen waartussen je je kunt inschrijven; null als de school ze niet invulde. */
  inschrijvenVan: string | null;
  inschrijvenTot: string | null;
  /** Ben je voor minstens één onderdeel ingeschreven? Null als dat niet op te halen was. */
  ingeschreven: boolean | null;
  /** Voor hoeveel onderdelen je je hoogstens mag inschrijven, als school dat heeft ingesteld. */
  maxKeuzes?: number | null;
}

/** Een keuze binnen een activiteit (bijvoorbeeld "Museum" of "Sporthal"). */
export interface ActiviteitOnderdeel extends Omit<Activiteit, 'ingeschreven' | 'maxKeuzes'> {
  activiteitId: string;
  maxDeelnemers: number | null;
  /** Hoeveel plekken er nog vrij zijn, als de school dat bijhoudt. */
  plekkenVrij: number | null;
  ingeschreven: boolean;
  /** Mag je je nu inschrijven (of uitschrijven)? */
  kanInschrijven: boolean;
  /** Door school ingeschreven; uitschrijven kan dan niet. */
  verplicht: boolean;
  bijlagen: Bijlage[];
}
