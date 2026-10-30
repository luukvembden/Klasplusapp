import { useEffect } from 'react';
import { useInstellingen } from '../lib/instellingen';

/** Kleur van de browser- of statusbalk per kleurenset. */
const balkKleur = { groen: '#2E6B5A', blauw: '#2F63A8', donkerblauw: '#1F3A68' } as const;

/**
 * Zet het gekozen thema en de kleurenset op <html>; bij "Systeem" volgt de app de instelling van het toestel.
 * De kleuren zelf staan in styles/tokens.css.
 */
export function useThema() {
  const { thema, kleur } = useInstellingen();

  useEffect(() => {
    const html = document.documentElement;
    if (thema === 'systeem') delete html.dataset.thema;
    else html.dataset.thema = thema;
  }, [thema]);

  useEffect(() => {
    const html = document.documentElement;
    if (kleur === 'groen') delete html.dataset.kleur;
    else html.dataset.kleur = kleur;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', balkKleur[kleur]);
  }, [kleur]);
}
