import { useSyncExternalStore } from 'react';

// Voorkeuren van de leerling. Ze blijven op het toestel en gaan nergens heen.

export type Thema = 'licht' | 'donker' | 'systeem';

/** Klassiek: "AK – KNNW – H5.AK4 (S252)" met de tijd eronder. Modern: vaknaam, en "tijd · lokaal · docent". */
export type AgendaWeergave = 'klassiek' | 'modern';

/** Dag: de lessen van één dag onder elkaar. Week: de hele week in één rooster. */
export type AgendaIndeling = 'dag' | 'week';

/** Accentkleur van de app; groen is de standaard. */
export const KLEUREN = ['groen', 'blauw', 'roze'] as const;
export type Kleur = (typeof KLEUREN)[number];

/** Welke meldingen de leerling wil. Standaard alles uit: pas aan na toestemming van de telefoon. */
export interface Notificaties {
  cijfers: boolean;
  /** Een uur vervalt of wijzigt (ander lokaal, andere docent, verplaatst). */
  rooster: boolean;
  huiswerk: boolean;
  /** Tijdstip van de huiswerkherinnering op de avond ervoor, "19:00". */
  huiswerkTijd: string;
}

export interface Instellingen {
  thema: Thema;
  agenda: AgendaWeergave;
  indeling: AgendaIndeling;
  kleur: Kleur;
  notificaties: Notificaties;
}

const SLEUTEL = 'schoolkompas.instellingen';

const standaard: Instellingen = {
  thema: 'systeem',
  // Nieuw in Klas+: Modern (vaknaam, en tijd · lokaal · docent). Wie al iets koos, houdt dat.
  agenda: 'modern',
  indeling: 'dag',
  kleur: 'groen',
  notificaties: { cijfers: false, rooster: false, huiswerk: false, huiswerkTijd: '19:00' },
};

function lees(): Instellingen {
  try {
    const opgeslagen = localStorage.getItem(SLEUTEL);
    if (opgeslagen) {
      const waarde = JSON.parse(opgeslagen) as Partial<Instellingen>;
      // Een kleur die niet meer bestaat (zoals het vroegere oranje of geel) wordt weer groen.
      const kleur = KLEUREN.includes(waarde.kleur as Kleur) ? (waarde.kleur as Kleur) : standaard.kleur;
      return { ...standaard, ...waarde, kleur, notificaties: { ...standaard.notificaties, ...waarde.notificaties } };
    }
  } catch {
    // Geen opslag of kapotte waarde: val terug op de standaard.
  }
  return standaard;
}

let huidig = lees();
const luisteraars = new Set<() => void>();

export function wijzigInstellingen(wijziging: Partial<Instellingen>) {
  huidig = { ...huidig, ...wijziging };
  try {
    localStorage.setItem(SLEUTEL, JSON.stringify(huidig));
  } catch {
    // Blijft dan alleen deze sessie bewaard.
  }
  luisteraars.forEach((l) => l());
}

/** Bij uitloggen: terug naar de standaardvoorkeuren, ook op het scherm. */
export function herstelInstellingen() {
  huidig = standaard;
  try {
    localStorage.removeItem(SLEUTEL);
  } catch {
    // Niets te wissen.
  }
  luisteraars.forEach((l) => l());
}

function abonneer(luisteraar: () => void) {
  luisteraars.add(luisteraar);
  return () => luisteraars.delete(luisteraar);
}

/** Voor code buiten React (zoals de achtergrondcontrole). */
export const leesInstellingen = () => huidig;

export function useInstellingen(): Instellingen {
  return useSyncExternalStore(abonneer, () => huidig);
}
