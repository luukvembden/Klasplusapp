import { createContext, useContext } from 'react';

// Gedeeld tussen AppLayout (die de pagina's in lagen toont) en de schermen, zonder dat die AppLayout importeren.

/** Voor de terugknop: schuift de pagina weg en gaat terug. False als er geen pagina onder ligt. */
export const LagenContext = createContext<{ terug: () => boolean } | null>(null);
export const useLagen = () => useContext(LagenContext);

/**
 * Hoe vaak de pagina van deze laag bovenaan kwam te liggen. Komt een pagina weer bovenop (je gaat terug
 * vanuit een les), dan verandert dit getal en haalt useLaden de gegevens stil opnieuw op.
 */
export const LaagZichtbaar = createContext(0);
export const useLaagZichtbaar = () => useContext(LaagZichtbaar);
