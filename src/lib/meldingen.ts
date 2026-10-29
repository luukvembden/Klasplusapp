// Meldingen die vanaf dit toestel zijn verstuurd, per kind. Alleen nodig bij scholen met de oude manier
// van melden: die geven zelf geen lijst van meldingen terug. (De nieuwe afwezigheidsmodule wel.)
import type { Melding, MeldingInvoer } from '../api/types';
import { beginVanDag, isWeekdag, plusDagen } from './datum';
import { lees, schrijf } from './opslag';

const sleutel = (kindId: number) => `meldingen.${kindId}`;

export function meldingenVan(kindId: number): Melding[] {
  return (lees<Melding[]>(sleutel(kindId)) ?? []).sort((a, b) => (b.gemeldOp ?? '').localeCompare(a.gemeldOp ?? ''));
}

export function bewaarMelding(kindId: number, invoer: MeldingInvoer) {
  const melding: Melding = {
    id: `${Date.now()}`,
    reden: invoer.reden?.naam ?? 'Afwezig',
    heleDag: invoer.heleDag,
    start: invoer.start,
    einde: invoer.einde,
    opmerking: invoer.opmerking,
    gemeldOp: new Date().toISOString(),
  };
  schrijf(sleutel(kindId), [melding, ...meldingenVan(kindId)]);
}

/**
 * De oude manier van melden: alleen voor vandaag of morgen, en niet voor een dag in het weekend.
 * Op zaterdag kan het dus helemaal niet.
 */
export function meldbareDagen(nu = new Date()): Date[] {
  return [beginVanDag(nu), beginVanDag(plusDagen(nu, 1))].filter(isWeekdag);
}
