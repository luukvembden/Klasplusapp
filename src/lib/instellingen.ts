import { useSyncExternalStore } from 'react';

// Voorkeuren van de leerling. Ze blijven op het toestel en gaan nergens heen.

export type Thema = 'licht' | 'donker' | 'systeem';

/** Klassiek: "AK – KNNW – H5.AK4 (S252)" met de tijd eronder. Modern: vaknaam, en "tijd · lokaal · docent". */
export type AgendaWeergave = 'klassiek' | 'modern';

/** Accentkleur van de app; groen is de standaard. */
export const KLEUREN = ['groen', 'blauw', 'roze', 'oranje', 'rood', 'geel'] as const;
export type Kleur = (typeof KLEUREN)[number];

export interface Instellingen {
  thema: Thema;
  agenda: AgendaWeergave;
  kleur: Kleur;
}

const SLEUTEL = 'schoolkompas.instellingen';

const standaard: Instellingen = {
  thema: 'systeem',
  agenda: 'klassiek',
  kleur: 'groen',
};

function lees(): Instellingen {
  try {
    const opgeslagen = localStorage.getItem(SLEUTEL);
    if (opgeslagen) {
      const waarde = JSON.parse(opgeslagen) as Partial<Instellingen>;
      // Een kleur die niet meer bestaat (zoals het vroegere donkerblauw) wordt weer groen.
      const kleur = KLEUREN.includes(waarde.kleur as Kleur) ? (waarde.kleur as Kleur) : standaard.kleur;
      return { ...standaard, ...waarde, kleur };
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

export function useInstellingen(): Instellingen {
  return useSyncExternalStore(abonneer, () => huidig);
}
