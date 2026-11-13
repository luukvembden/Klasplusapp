import { createContext, useContext } from 'react';

// Gedeeld tussen AppLayout (die de pagina's in lagen toont) en de schermen, zonder dat die AppLayout importeren.

/**
 * Voor de terugknop. `terug`: schuift de pagina weg naar de vorige (false als er geen pagina onder ligt).
 * `naar`: naar de pagina die bij de terugknop hoort, ook als je via een omweg hier kwam.
 */
export const LagenContext = createContext<{ terug: () => boolean; naar: (pad: string) => void } | null>(null);
export const useLagen = () => useContext(LagenContext);

/**
 * Hoe vaak de pagina van deze laag bovenaan kwam te liggen. Komt een pagina weer bovenop (je gaat terug
 * vanuit een les), dan verandert dit getal en haalt useLaden de gegevens stil opnieuw op.
 */
export const LaagZichtbaar = createContext(0);
export const useLaagZichtbaar = () => useContext(LaagZichtbaar);
