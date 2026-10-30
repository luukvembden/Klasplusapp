import { useEffect } from 'react';
import { useInstellingen, type Kleur } from '../lib/instellingen';

/** Kleur van de browser- of statusbalk per kleurenset. */
const balkKleur: Record<Kleur, string> = {
  groen: '#2E6B5A',
  blauw: '#2F63A8',
  roze: '#C2417F',
  oranje: '#B85A17',
  rood: '#B8322F',
  geel: '#E7B416',
};

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
