import { nlTijd, tijd } from '../../lib/datum';
import type { Afspraak } from '../types';

// Magister zet een les op "gewijzigd" (status 3) bij elke aanpassing, ook als de docent alleen
// huiswerk toevoegt. Voor de leerling is dat geen wijziging. Magister zegt niet wat er veranderd is,
// dus vergelijken we zelf: dezelfde les (vak, weekdag, uur) in een andere week. Is de docent of het
// lokaal daar anders, dan is het een echte wijziging. Zonder zo'n les om mee te vergelijken: geen label.

/** Welke afspraken status 3 hadden; alleen tijdens het omzetten bijgehouden. */
export type MetStatus = { afspraak: Afspraak; status3: boolean };

const zelfdeLesSleutel = (a: Afspraak) => {
  const n = nlTijd(new Date(a.start));
  // Zonder lesuur (bijvoorbeeld een les buiten het rooster) telt de begintijd.
  return `${a.vak ?? a.omschrijving.split(' – ')[0]}|${n.weekdag}|${a.lesuur ?? tijd(new Date(a.start))}`;
};

const docentenVan = (a: Afspraak) => [...a.docenten].sort().join(',');

/**
 * Zet het label "gewijzigd" bij status-3-lessen waarvan docent of lokaal anders is dan dezelfde
 * les in een andere week. Lessen die al "gewijzigd" hebben (verplaatst) blijven zo.
 */
export function markeerEchteWijzigingen(lijst: MetStatus[]): Afspraak[] {
  // Per les de gewone versies: zonder status 3, niet vervallen, en in een andere week.
  const gewoon = new Map<string, Afspraak[]>();
  for (const { afspraak, status3 } of lijst) {
    if (status3 || afspraak.labels.includes('vervalt')) continue;
    const sleutel = zelfdeLesSleutel(afspraak);
    gewoon.set(sleutel, [...(gewoon.get(sleutel) ?? []), afspraak]);
  }

  return lijst.map(({ afspraak, status3 }) => {
    if (!status3 || afspraak.labels.includes('gewijzigd') || afspraak.labels.includes('vervalt')) return afspraak;
    const andere = (gewoon.get(zelfdeLesSleutel(afspraak)) ?? []).filter((g) => g.id !== afspraak.id);
    if (andere.length === 0) return afspraak;
    // Gewijzigd als hij afwijkt van álle andere weken; zo telt een vaste wisseling (om de week) niet.
    const anders = andere.every(
      (g) => (g.lokaal ?? '') !== (afspraak.lokaal ?? '') || docentenVan(g) !== docentenVan(afspraak),
    );
    return anders ? { ...afspraak, labels: [...afspraak.labels, 'gewijzigd'] } : afspraak;
  });
}
