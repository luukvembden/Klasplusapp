import { useEffect } from 'react';
import { useInstellingen } from '../lib/instellingen';

/** Zet het gekozen thema op <html>; bij "Systeem" volgt de app de instelling van het toestel. */
export function useThema() {
  const { thema } = useInstellingen();

  useEffect(() => {
    const html = document.documentElement;
    if (thema === 'systeem') delete html.dataset.thema;
    else html.dataset.thema = thema;
  }, [thema]);
}
