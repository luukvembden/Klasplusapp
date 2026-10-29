import { naarInvoer } from '../lib/datum';
import { lees, schrijf, sleutels, verwijder } from '../lib/opslag';
import type { SchoolApi } from './SchoolApi';
import type { Resultaat } from './types';

const CACHE = 'cache.';
/** Zoveel weken rooster en losse lessen blijven bewaard; de oudst opgehaalde gaan eerst weg. */
const MAX_WEKEN = 26;
const MAX_LESSEN = 300;

/**
 * Probeert eerst de bron. Lukt dat, dan wordt het resultaat bewaard.
 * Lukt het niet (bijvoorbeeld offline), dan komt het laatst bewaarde resultaat terug.
 */
async function metCache<T>(sleutel: string, haal: () => Promise<Resultaat<T>>): Promise<Resultaat<T>> {
  try {
    const vers = await haal();
    schrijf(CACHE + sleutel, vers);
    return vers;
  } catch (fout) {
    const bewaard = lees<Resultaat<T>>(CACHE + sleutel);
    if (bewaard) return { ...bewaard, offline: true };
    throw fout;
  }
}

function ruimOp(soort: string, maximaal: number) {
  sleutels(CACHE + soort)
    .map((sleutel) => ({ sleutel, op: lees<Resultaat<unknown>>(sleutel)?.opgehaaldOp ?? '' }))
    .sort((a, b) => b.op.localeCompare(a.op))
    .slice(maximaal)
    .forEach((w) => verwijder(w.sleutel));
}

export function wisCache() {
  sleutels(CACHE).forEach(verwijder);
}

/** Zet een offline cache om elke SchoolApi heen; de vorm van de gegevens blijft gelijk. */
export function metOfflineCache(bron: SchoolApi): SchoolApi {
  return {
    ...bron,

    async uitloggen() {
      wisCache();
      await bron.uitloggen();
    },

    async kiesKind(id) {
      await bron.kiesKind(id);
      // De bewaarde gegevens horen bij het vorige kind.
      wisCache();
    },

    profiel: () => metCache('profiel', () => bron.profiel()),

    async afspraken(van, tot) {
      const resultaat = await metCache(`afspraken.${naarInvoer(van)}.${naarInvoer(tot)}`, () =>
        bron.afspraken(van, tot),
      );
      if (!resultaat.offline) ruimOp('afspraken.', MAX_WEKEN);
      return resultaat;
    },

    async afspraak(id) {
      const resultaat = await metCache(`afspraak.${id}`, () => bron.afspraak(id));
      if (!resultaat.offline) ruimOp('afspraak.', MAX_LESSEN);
      return resultaat;
    },

    cijfers: () => metCache('cijfers', () => bron.cijfers()),

    afwezigheden: () => metCache('afwezigheden', () => bron.afwezigheden()),

    meldingen: () => metCache('meldingen', () => bron.meldingen()),
  };
}
