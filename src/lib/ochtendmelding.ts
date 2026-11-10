import type { Afspraak } from '../api';
import { tijd } from './datum';
import { metHoofdletter } from './tekst';

const vakVan = (a: Afspraak) => metHoofdletter(a.vak ?? a.omschrijving);
const welkUur = (a: Afspraak) => (a.lesuur ? `${a.lesuur}e uur` : tijd(new Date(a.start)));

/**
 * De ochtendmelding voor één dag: je eerste les (vak, uur, tijd, lokaal) en welke lessen die dag
 * vervallen of gewijzigd zijn. Null als er die dag geen lessen zijn.
 */
export function ochtendMelding(lessen: Afspraak[]): { titel: string; tekst: string } | null {
  const rooster = lessen
    .filter((a) => !a.heleDag && !a.labels.includes('eigen'))
    .sort((a, b) => a.start.localeCompare(b.start));
  if (rooster.length === 0) return null;

  const vervallen = rooster.filter((a) => a.labels.includes('vervalt'));
  const gewijzigd = rooster.filter((a) => !a.labels.includes('vervalt') && a.labels.includes('gewijzigd'));
  const eerste = rooster.find((a) => !a.labels.includes('vervalt'));

  const zinnen: string[] = [];
  if (eerste) {
    const uur = eerste.lesuur ? `${eerste.lesuur}e uur, om` : 'Om';
    zinnen.push(`${uur} ${tijd(new Date(eerste.start))}${eerste.lokaal ? ` in ${eerste.lokaal}` : ''}.`);
  }
  for (const a of vervallen) zinnen.push(`${vakVan(a)} (${welkUur(a)}) is vervallen.`);
  for (const a of gewijzigd) zinnen.push(`${vakVan(a)} (${welkUur(a)}) is gewijzigd${a.lokaal ? `, nu in ${a.lokaal}` : ''}.`);

  return {
    titel: eerste ? `Eerste les: ${vakVan(eerste)}` : 'Al je lessen vervallen vandaag',
    tekst: zinnen.join(' '),
  };
}
