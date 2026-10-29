import { useCallback } from 'react';
import { api } from '../api';
import { useLaden } from './useLaden';

/**
 * Cijfers, en apart het profiel voor de regel "Periode 1 · 4 vwo".
 * Los geladen: als het profiel mislukt, verschijnen de cijfers toch.
 */
export function useCijfers() {
  const cijfers = useLaden(() => api.cijfers(), []);
  const profiel = useLaden(() => api.profiel(), []);
  const p = profiel.data?.data;
  const { vernieuw: vernieuwCijfers } = cijfers;
  const { vernieuw: vernieuwProfiel } = profiel;

  return {
    profiel: p,
    cijfers: cijfers.data?.data,
    /** Het cijferresultaat zelf, voor de offline-melding. */
    resultaat: cijfers.data,
    sub: [p?.periode, p?.klas].filter(Boolean).join(' · ') || ' ',
    fout: cijfers.fout,
    laden: cijfers.laden,
    vernieuw: useCallback(
      () => Promise.all([vernieuwCijfers(), vernieuwProfiel()]).then(() => undefined),
      [vernieuwCijfers, vernieuwProfiel],
    ),
  };
}
