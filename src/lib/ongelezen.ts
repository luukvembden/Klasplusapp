import { useSyncExternalStore } from 'react';
import { api } from '../api';

// Het aantal ongelezen berichten, voor het rode getal op de tab Meer en bij Berichten.
// Eén plek, zodat het getal overal gelijk loopt en direct zakt als je een bericht opent.

let aantal = 0;
const luisteraars = new Set<() => void>();
const meld = () => luisteraars.forEach((l) => l());

export function zetOngelezen(nieuw: number) {
  if (nieuw === aantal) return;
  aantal = nieuw;
  meld();
}

/** Haalt het aantal opnieuw op; zonder sessie of verbinding blijft het zoals het was. */
export async function verversOngelezen() {
  if (!api.heeftSessie()) return zetOngelezen(0);
  zetOngelezen(await api.ongelezen().catch(() => aantal));
}

export function useOngelezen(): number {
  return useSyncExternalStore(
    (l) => {
      luisteraars.add(l);
      return () => luisteraars.delete(l);
    },
    () => aantal,
  );
}
