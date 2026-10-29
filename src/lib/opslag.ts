// Kleine laag over de opslag op het toestel. Nu localStorage; in Capacitor kan hier
// een native opslag achter, zonder dat de rest van de app verandert.

const VOORVOEGSEL = 'schoolkompas.';

export function lees<T>(sleutel: string): T | null {
  try {
    const waarde = localStorage.getItem(VOORVOEGSEL + sleutel);
    return waarde === null ? null : (JSON.parse(waarde) as T);
  } catch {
    return null;
  }
}

export function schrijf(sleutel: string, waarde: unknown): void {
  try {
    localStorage.setItem(VOORVOEGSEL + sleutel, JSON.stringify(waarde));
  } catch {
    // Opslag vol of geblokkeerd: de app werkt dan gewoon zonder cache.
  }
}

export function verwijder(sleutel: string): void {
  try {
    localStorage.removeItem(VOORVOEGSEL + sleutel);
  } catch {
    // Niets te wissen.
  }
}

/** Bij uitloggen: alles wat de app op dit toestel bewaarde (gegevens, cache en voorkeuren). */
export function wisAlles(): void {
  sleutels().forEach(verwijder);
}

/** Alle sleutels die met `begin` starten (zonder het app-voorvoegsel). */
export function sleutels(begin = ''): string[] {
  try {
    return Object.keys(localStorage)
      .filter((k) => k.startsWith(VOORVOEGSEL + begin))
      .map((k) => k.slice(VOORVOEGSEL.length));
  } catch {
    return [];
  }
}
