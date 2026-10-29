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
  | 'vervalt';

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
