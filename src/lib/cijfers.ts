import type { Cijfer, Vak } from '../api/types';

const opEenDecimaal = (n: number) => Math.round(n * 10) / 10;

/** 7.4 → "7,4" */
export function formatCijfer(n: number): string {
  return opEenDecimaal(n).toFixed(1).replace('.', ',');
}

/** Zoals het cijfer getoond wordt: als getal met komma, of de letter (V, G) van de school. */
export function toonCijfer(c: Cijfer): string {
  return c.waarde === null ? c.weergave : formatCijfer(c.waarde);
}

/** Kijkt naar het afgeronde getal, zodat een getoonde 5,5 nooit rood is. Letters zijn nooit rood. */
export function isOnvoldoende(n: number | null): boolean {
  return n !== null && opEenDecimaal(n) < 5.5;
}

/** Alleen cijfers die meetellen, een getal zijn en een weging hebben. Null als er niets te middelen valt. */
export function gewogenGemiddelde(cijfers: Cijfer[]): number | null {
  const tellend = cijfers.filter((c) => c.teltMee && c.waarde !== null && c.weging > 0);
  const wegingen = tellend.reduce((som, c) => som + c.weging, 0);
  if (wegingen === 0) return null;
  return tellend.reduce((som, c) => som + c.waarde! * c.weging, 0) / wegingen;
}

/** Som (cijfer × weging) en totale weging van de meetellende cijfers: de bouwstenen van het gemiddelde. */
export function somEnWeging(cijfers: Cijfer[]): { som: number; weging: number } {
  return cijfers
    .filter((c) => c.teltMee && c.waarde !== null && c.weging > 0)
    .reduce((a, c) => ({ som: a.som + c.waarde! * c.weging, weging: a.weging + c.weging }), { som: 0, weging: 0 });
}

export function meestRecent(cijfers: Cijfer[], aantal: number): Cijfer[] {
  return [...cijfers].sort((a, b) => b.datum.localeCompare(a.datum)).slice(0, aantal);
}

export interface VakOverzicht {
  vak: Vak;
  /** Oudste cijfer eerst. */
  cijfers: Cijfer[];
  gemiddelde: number | null;
}

export function perVak(cijfers: Cijfer[]): VakOverzicht[] {
  const groepen = new Map<string, Cijfer[]>();
  for (const c of cijfers) groepen.set(c.vak.code, [...(groepen.get(c.vak.code) ?? []), c]);
  return [...groepen.values()]
    .map((lijst) => {
      const opDatum = [...lijst].sort((a, b) => a.datum.localeCompare(b.datum));
      return { vak: lijst[0].vak, cijfers: opDatum, gemiddelde: gewogenGemiddelde(opDatum) };
    })
    .sort((a, b) => a.vak.volgnummer - b.vak.volgnummer);
}
