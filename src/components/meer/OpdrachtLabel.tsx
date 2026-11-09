import type { OpdrachtKort } from '../../api';
import { beginVanDag } from '../../lib/datum';
import './meer.css';

/** Hele dagen tot de inleverdatum: 0 = vandaag, 1 = morgen. */
function dagenTot(iso: string): number {
  return Math.round((beginVanDag(new Date(iso)).getTime() - beginVanDag(new Date()).getTime()) / 86_400_000);
}

/** Wat er op het label komt, en in welke kleur. */
export function opdrachtLabel(o: OpdrachtKort): { tekst: string; soort: '' | 'bijna' | 'laat' | 'klaar' } {
  if (o.status === 'beoordeeld') return { tekst: o.beoordeling ?? 'Beoordeeld', soort: 'klaar' };
  if (o.status === 'ingeleverd') return { tekst: 'Ingeleverd', soort: 'klaar' };
  if (o.status === 'te-laat') return { tekst: 'Te laat', soort: 'laat' };
  if (!o.inleverenVoor) return { tekst: 'Open', soort: '' };
  const dagen = dagenTot(o.inleverenVoor);
  if (dagen <= 0) return { tekst: 'Vandaag', soort: 'bijna' };
  if (dagen === 1) return { tekst: 'Morgen', soort: 'bijna' };
  return { tekst: `Over ${dagen} dagen`, soort: dagen <= 3 ? 'bijna' : '' };
}

/** Label rechts bij een opdracht: groen als het bijna moet of klaar is, rood als het te laat is. */
export function OpdrachtLabel({ opdracht }: { opdracht: OpdrachtKort }) {
  const { tekst, soort } = opdrachtLabel(opdracht);
  return <span className={`statuslabel${soort ? ` statuslabel--${soort}` : ''}`}>{tekst}</span>;
}
