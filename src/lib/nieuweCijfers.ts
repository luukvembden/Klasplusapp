import type { Cijfer } from '../api';
import { naarInvoer } from './datum';
import { lees, schrijf } from './opslag';

// Welke cijfers de app al eens heeft gezien, en op welke dag voor het eerst.
// Een cijfer is "nieuw" op de dag dat het voor het eerst in de app verschijnt, los van de datum
// die de docent erbij zette (door Cijfertijd kan een cijfer van 5 november pas later binnenkomen).
// Alleen op dit toestel; er gaat niets naar een server.

const SLEUTEL = 'cijfers.gezien';

/** Cijfer-id → dag waarop de app het voor het eerst zag ("2026-11-09"), of "" voor de beginvoorraad. */
type Gezien = Record<string, string>;

/**
 * `wie`: "ik" voor een leerling, of het id van het gekozen kind bij een ouder (elk kind apart).
 * Geeft de ids van de cijfers die vandaag binnenkwamen en onthoudt nieuwe cijfers.
 * De allereerste keer (of na uitloggen) telt alles als al gezien, zodat niet ineens elk cijfer "Nieuw" is.
 */
export function nieuwVandaag(cijfers: Cijfer[], wie: string): Set<string> {
  const sleutel = `${SLEUTEL}.${wie}`;
  const vandaag = naarInvoer(new Date());
  const opgeslagen = lees<Gezien>(sleutel);
  const gezien: Gezien = { ...(opgeslagen ?? {}) };
  let gewijzigd = false;

  for (const c of cijfers) {
    if (gezien[c.id] === undefined) {
      gezien[c.id] = opgeslagen ? vandaag : '';
      gewijzigd = true;
    }
  }
  if (gewijzigd || !opgeslagen) schrijf(sleutel, gezien);

  return new Set(cijfers.filter((c) => gezien[c.id] === vandaag).map((c) => c.id));
}
