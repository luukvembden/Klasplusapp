import { api } from '../api';
import { opMoment } from '../components/les/Invoerrij';
import { beginVanDag, plusDagen } from './datum';
import { KLAS_PLUS_REGEL, lerenTitel, notitieVan, type Leerplan } from './leerplan';

// Leermomenten ook als persoonlijke afspraak in de schoolagenda, zodat ze op de schoolsite en in de
// officiële app staan. Klas+ onthoudt welke afspraken bij het plan horen, om ze later te kunnen
// bijwerken of weghalen.

/** Haalt de afspraken van dit plan weg uit de schoolagenda. Wat al weg is, geeft geen fout. */
export async function haalVanSchool(ids: string[]): Promise<void> {
  for (const id of ids) await api.verwijderAfspraak(id).catch(() => undefined);
}

/**
 * Zet de leermomenten die aan staan als persoonlijke afspraken in de schoolagenda (eerst de oude
 * weg) en geeft de ids van de nieuwe terug. Gooit een fout als de school het weigert.
 */
export async function zetOpSchool(plan: Leerplan, oudeIds: string[]): Promise<string[]> {
  await haalVanSchool(oudeIds);
  const momenten = plan.momenten
    .filter((m) => m.aan)
    .map((m) => ({ start: opMoment(m.datum, m.tijd), notitie: notitieVan(plan, m) }))
    .filter((m) => m.start.getTime() > Date.now());
  if (momenten.length === 0) return [];

  const titel = lerenTitel(plan);
  for (const { start, notitie } of momenten) {
    await api.maakAfspraak({
      titel,
      heleDag: false,
      start: start.toISOString(),
      einde: new Date(start.getTime() + plan.duur * 60_000).toISOString(),
      locatie: '',
      // Bovenaan je eigen notitie, dan een witregel, dan dat het met Klas+ is ingezet.
      beschrijving: notitie ? `${notitie}\n\n${KLAS_PLUS_REGEL}` : KLAS_PLUS_REGEL,
    });
  }

  // De school geeft bij het maken geen id terug; zoek de nieuwe afspraken op titel en begintijd.
  const eerste = beginVanDag(momenten[0].start);
  const laatste = plusDagen(beginVanDag(momenten[momenten.length - 1].start), 1);
  const lijst = (await api.afspraken(eerste, laatste)).data;
  return lijst
    .filter(
      (a) =>
        a.labels.includes('eigen') &&
        a.omschrijving === titel &&
        momenten.some((m) => Math.abs(new Date(a.start).getTime() - m.start.getTime()) < 60_000),
    )
    .map((a) => a.id);
}
