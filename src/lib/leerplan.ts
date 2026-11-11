import { useSyncExternalStore } from 'react';
import type { Afspraak } from '../api';
import { opMoment } from '../components/les/Invoerrij';
import { lees, schrijf, verwijder } from './opslag';

// Leerplannen voor toetsen. Alleen op dit toestel: ze gaan niet naar de schoolsite.

/** Eén keer leren: op deze dag, om deze tijd. Staat `aan` uit, dan sla je die dag over. */
export interface Leermoment {
  /** "2026-11-14" */
  datum: string;
  /** "19:00" */
  tijd: string;
  aan: boolean;
}

export interface Leerplan {
  /** Id van de les waarbij de toets staat. */
  toetsId: string;
  /** "Wiskunde B" */
  vak: string;
  /** "Proefwerk", "SO" … */
  soort: string;
  /** Begin van de les met de toets (ISO). */
  toetsStart: string;
  /** Hoeveel dagen van tevoren je begint. */
  dagen: number;
  /** Minuten per keer. */
  duur: number;
  momenten: Leermoment[];
  /** Melding op het tijdstip van elk leermoment. */
  herinnering: boolean;
  /** Ook als persoonlijke afspraak in de schoolagenda. */
  opSchool?: boolean;
  /** De ids van die afspraken op school, om ze later bij te werken of weg te halen. */
  schoolIds?: string[];
}

const SLEUTEL = 'leerplannen';

let plannen: Record<string, Leerplan> = lees<Record<string, Leerplan>>(SLEUTEL) ?? {};
const luisteraars = new Set<() => void>();

function bewaar(nieuw: Record<string, Leerplan>) {
  plannen = nieuw;
  schrijf(SLEUTEL, plannen);
  luisteraars.forEach((l) => l());
}

export const alleLeerplannen = () => plannen;
export const leerplanVoor = (toetsId: string): Leerplan | undefined => plannen[toetsId];
export const bewaarLeerplan = (p: Leerplan) => bewaar({ ...plannen, [p.toetsId]: p });

export function verwijderLeerplan(toetsId: string) {
  const { [toetsId]: _weg, ...rest } = plannen;
  bewaar(rest);
}

/** Bij uitloggen: alle plannen van dit toestel weg. */
export function wisLeerplannen() {
  plannen = {};
  verwijder(SLEUTEL);
  luisteraars.forEach((l) => l());
}

/** Alle plannen; het scherm tekent opnieuw als er een bijkomt of verandert. */
export function useLeerplannen(): Record<string, Leerplan> {
  return useSyncExternalStore(
    (l) => {
      luisteraars.add(l);
      return () => luisteraars.delete(l);
    },
    () => plannen,
  );
}

const SCHEIDING = '|';

/** Het id van een leermoment in de Agenda: "leren|<toetsId>|<datum>". */
const lerenId = (toetsId: string, datum: string) => ['leren', toetsId, datum].join(SCHEIDING);

/** Hoort deze afspraak bij een leerplan? Dan het id van de toets. */
export function toetsIdVan(a: Afspraak): string | null {
  if (!a.labels.includes('leren')) return null;
  return a.id.split(SCHEIDING)[1] ?? null;
}

/** Waar een rij in de Agenda naartoe gaat: de les, of bij een leermoment het plan. */
export function lesLink(a: Afspraak): string {
  const toets = toetsIdVan(a);
  return toets ? `/leren/${encodeURIComponent(toets)}` : `/agenda/${encodeURIComponent(a.id)}`;
}

/** "Leren voor proefwerk Wiskunde B" */
export const lerenTitel = (p: Pick<Leerplan, 'soort' | 'vak'>) =>
  `${LEREN_VOORVOEGSEL}${p.soort === 'SO' ? 'SO' : p.soort.toLowerCase()} ${p.vak}`;

/** Titels van leermomenten beginnen zo; zo herkent Klas+ ze ook als ze van de schoolsite komen. */
export const LEREN_VOORVOEGSEL = 'Leren voor ';

/**
 * De afspraken van school, klaar voor de Agenda: een leermoment dat Klas+ zelf al toont (zelfde titel en
 * begintijd, of een bekend id) valt weg, zodat het niet dubbel staat. Een ander leermoment van de
 * schoolsite (bijvoorbeeld van een ander toestel) houdt het label Leren in plaats van Persoonlijk.
 */
export function metLeermomenten(vanSchool: Afspraak[], alle: Record<string, Leerplan>): Afspraak[] {
  const eigen = leerAfspraken(alle);
  const ids = schoolIdsVan(alle);
  const dubbel = (a: Afspraak) =>
    ids.has(a.id) ||
    eigen.some((l) => l.omschrijving === a.omschrijving && Math.abs(new Date(l.start).getTime() - new Date(a.start).getTime()) < 60_000);
  const school = vanSchool
    .filter((a) => !(a.labels.includes('eigen') && a.omschrijving.startsWith(LEREN_VOORVOEGSEL) && dubbel(a)) && !ids.has(a.id))
    .map((a) =>
      a.labels.includes('eigen') && a.omschrijving.startsWith(LEREN_VOORVOEGSEL)
        ? { ...a, labels: ['leren' as const] }
        : a,
    );
  return [...school, ...eigen];
}

/** Afspraken op school die bij een leerplan horen; die toont de Agenda niet dubbel. */
export const schoolIdsVan = (alle: Record<string, Leerplan>) =>
  new Set(Object.values(alle).flatMap((p) => p.schoolIds ?? []));

/** De leermomenten van alle plannen als afspraken, zodat de Agenda ze tussen de lessen kan zetten. */
export function leerAfspraken(alle: Record<string, Leerplan>): Afspraak[] {
  const uit: Afspraak[] = [];
  for (const p of Object.values(alle)) {
    for (const m of p.momenten) {
      if (!m.aan) continue;
      const start = opMoment(m.datum, m.tijd);
      uit.push({
        id: lerenId(p.toetsId, m.datum),
        start: start.toISOString(),
        einde: new Date(start.getTime() + p.duur * 60_000).toISOString(),
        lesuur: null,
        omschrijving: lerenTitel(p),
        lokaal: null,
        labels: ['leren'],
        vak: null,
        docenten: [],
        inhoudHtml: null,
        afgerond: false,
      });
    }
  }
  return uit;
}
