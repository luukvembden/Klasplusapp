import type { ReactNode } from 'react';
import './ui.css';

/**
 * De kop van een pagina (terug-link, titel en eventueel een knop rechtsboven) die bovenaan blijft staan
 * terwijl de rest eronder doorscrolt, net als bij Berichten.
 */
export function VasteKop({ children, tab = false }: { children: ReactNode; tab?: boolean }) {
  // `tab`: op een hoofdpagina (zoals Meer) zonder terug-link, waar de pagina iets meer ruimte boven heeft.
  return <div className={`vastekop${tab ? ' vastekop--tab' : ''}`}>{children}</div>;
}
