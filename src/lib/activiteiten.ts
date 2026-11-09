import { beginVanDag, korteDatumMetJaar } from './datum';

interface MetInschrijfperiode {
  inschrijvenVan: string | null;
  inschrijvenTot: string | null;
}

export interface InschrijfStand {
  /** Kun je je nu inschrijven? */
  open: boolean;
  /** "Inschrijven tot 15 nov", "Inschrijving gesloten op 2 okt" */
  tekst: string;
  label?: { tekst: string; soort: '' | 'bijna' | 'laat' };
}

const dagenTot = (iso: string) =>
  Math.round((beginVanDag(new Date(iso)).getTime() - beginVanDag(new Date()).getTime()) / 86_400_000);

/** Waar de inschrijving staat: nog niet open, open (en hoe lang nog), of gesloten. */
export function inschrijfStand(a: MetInschrijfperiode, nu = new Date()): InschrijfStand {
  if (a.inschrijvenVan && new Date(a.inschrijvenVan) > nu)
    return { open: false, tekst: `Inschrijven vanaf ${korteDatumMetJaar(a.inschrijvenVan)}` };
  if (a.inschrijvenTot && new Date(a.inschrijvenTot) < nu)
    return { open: false, tekst: `Inschrijving gesloten op ${korteDatumMetJaar(a.inschrijvenTot)}` };
  if (!a.inschrijvenTot) return { open: true, tekst: 'Inschrijven kan nu', label: { tekst: 'Open', soort: '' } };
  const dagen = dagenTot(a.inschrijvenTot);
  const tekst = `Inschrijven tot ${korteDatumMetJaar(a.inschrijvenTot)}`;
  if (dagen <= 0) return { open: true, tekst, label: { tekst: 'Laatste dag', soort: 'laat' } };
  if (dagen === 1) return { open: true, tekst, label: { tekst: 'Nog 1 dag', soort: 'bijna' } };
  return { open: true, tekst, label: { tekst: `Nog ${dagen} dagen`, soort: dagen <= 3 ? 'bijna' : '' } };
}
