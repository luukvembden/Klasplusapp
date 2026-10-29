import type {
  Afspraak,
  AfspraakDetail,
  AfspraakInvoer,
  Afwezigheid,
  Cijfer,
  Profiel,
  Resultaat,
  Melding,
  MeldingInvoer,
  MeldOpties,
} from './types';

/**
 * Alles wat de app van de schoolgegevens nodig heeft.
 * In de browser ingevuld door demoApi, in de telefoon-app door liveApi.
 */
export interface SchoolApi {
  /** Eenmalig bij het opstarten: een bewaarde sessie terughalen. */
  start(): Promise<void>;

  /**
   * Opent de officiële inlogpagina; de leerling kiest daar zelf zijn school.
   * Er gaat nooit een wachtwoord door de app. Gooit `InloggenAfgebroken` als de leerling stopt.
   */
  inloggen(): Promise<void>;
  /** Wist de sessie en alle lokaal bewaarde gegevens. */
  uitloggen(): Promise<void>;
  heeftSessie(): boolean;
  /**
   * Ingelogd als ouder? Dan tonen alle schermen de gegevens van het gekozen kind,
   * zonder diens persoonlijke afspraken, en kan huiswerk niet worden afgevinkt.
   */
  isOuder(): boolean;
  /** Alleen voor ouders: wissel naar een ander kind. */
  kiesKind(id: number): Promise<void>;

  profiel(): Promise<Resultaat<Profiel>>;
  /** Afspraken vanaf `van` tot (niet tot en met) `tot`. */
  afspraken(van: Date, tot: Date): Promise<Resultaat<Afspraak[]>>;
  /** Eén afspraak met alle details, zoals het volledige huiswerk. */
  afspraak(id: string): Promise<Resultaat<AfspraakDetail>>;

  /** Eigen afspraken: persoonlijke afspraken die alleen de leerling zelf ziet (label 'eigen'). */
  maakAfspraak(invoer: AfspraakInvoer): Promise<void>;
  wijzigAfspraak(id: string, invoer: AfspraakInvoer): Promise<void>;
  verwijderAfspraak(id: string): Promise<void>;

  /** Huiswerk afvinken of het vinkje weghalen. */
  zetAfgerond(id: string, afgerond: boolean): Promise<void>;
  cijfers(): Promise<Resultaat<Cijfer[]>>;
  /** Afwezigheden van het lopende schooljaar, alleen om te bekijken. */
  afwezigheden(): Promise<Resultaat<Afwezigheid[]>>;

  /**
   * Wat dit account met afwezigheidsmeldingen kan, of null als er niets te zien of te melden is.
   * Per account en per kind opgezocht: de school bepaalt het, net als in de officiële app.
   */
  meldOpties(): Promise<MeldOpties | null>;
  /** Verstuurt een afwezigheidsmelding naar school. */
  meldAfwezig(melding: MeldingInvoer): Promise<void>;
  /** Eerder gedane meldingen, nieuwste eerst. */
  meldingen(): Promise<Resultaat<Melding[]>>;
}

/** De leerling sloot de inlogpagina zelf; geen foutmelding nodig. */
export class InloggenAfgebroken extends Error {
  constructor() {
    super('Inloggen afgebroken');
  }
}

/** Gebeurtenis op `window` als de sessie verlopen is en opnieuw inloggen nodig is. */
export const SESSIE_VERLOPEN = 'schoolkompas:sessie-verlopen';
