import { beginVanDag, korteDatumMetJaar } from './datum';
import { lees, schrijf } from './opslag';

interface MetInschrijfperiode {
  inschrijvenVan: string | null;
  inschrijvenTot: string | null;
}

export interface InschrijfStand {
  /** Kun je je nu inschrijven? */
  open: boolean;
  /** "Inschrijven tot 15 nov", "Inschrijving gesloten op 2 okt" */
  tekst: string;
  label?: { tekst: string; soort: '' | 'laat' };
  /** De periode is voorbij. */
  gesloten?: boolean;
}

const dagenTot = (iso: string) =>
  Math.round((beginVanDag(new Date(iso)).getTime() - beginVanDag(new Date()).getTime()) / 86_400_000);

/** Waar de inschrijving staat: nog niet open, open (en hoe lang nog), of gesloten. */
export function inschrijfStand(a: MetInschrijfperiode, nu = new Date()): InschrijfStand {
  if (a.inschrijvenVan && new Date(a.inschrijvenVan) > nu)
    return { open: false, tekst: `Inschrijven vanaf ${korteDatumMetJaar(a.inschrijvenVan)}` };
  if (a.inschrijvenTot && new Date(a.inschrijvenTot) < nu)
    return {
      open: false,
      tekst: `Inschrijving gesloten op ${korteDatumMetJaar(a.inschrijvenTot)}`,
      gesloten: true,
    };
  if (!a.inschrijvenTot) return { open: true, tekst: 'Inschrijven kan nu', label: { tekst: 'Open', soort: '' } };
  const dagen = dagenTot(a.inschrijvenTot);
  const tekst = `Inschrijven tot ${korteDatumMetJaar(a.inschrijvenTot)}`;
  if (dagen <= 0) return { open: true, tekst, label: { tekst: 'Laatste dag', soort: 'laat' } };
  // Alleen de laatste dag valt op (rood); verder grijs, zodat groen voor "Ingeschreven" blijft.
  if (dagen === 1) return { open: true, tekst, label: { tekst: 'Nog 1 dag', soort: '' } };
  return { open: true, tekst, label: { tekst: `Nog ${dagen} dagen`, soort: '' } };
}

// ---- Hoeveel onderdelen je mag kiezen ----

const GELEERD = 'activiteiten.max';

/**
 * Het maximum aantal keuzes: wat school meestuurt, of wat we leerden toen school een extra
 * inschrijving weigerde terwijl je al ergens was ingeschreven.
 */
export function maxKeuzes(a: { id: string; maxKeuzes?: number | null } | undefined): number | null {
  if (!a) return null;
  return a.maxKeuzes ?? lees<Record<string, number>>(GELEERD)?.[a.id] ?? null;
}

/** School weigerde een extra inschrijving: dan is dit kennelijk het maximum. */
export function onthoudMaxKeuzes(activiteitId: string, aantal: number) {
  if (aantal < 1) return;
  schrijf(GELEERD, { ...(lees<Record<string, number>>(GELEERD) ?? {}), [activiteitId]: aantal });
}

/** "één onderdeel", "2 onderdelen" */
export const aantalOnderdelen = (n: number) => (n === 1 ? 'één onderdeel' : `${n} onderdelen`);
