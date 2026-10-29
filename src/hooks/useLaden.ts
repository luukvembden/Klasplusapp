import { useCallback, useEffect, useRef, useState, type DependencyList } from 'react';
import { useLaagZichtbaar } from '../lib/laag';

interface Toestand<T> {
  data?: T;
  fout?: string;
  laden: boolean;
}

const foutTekst = (e: unknown) =>
  navigator.onLine
    ? // De technische reden tussen haakjes helpt bij het oplossen van problemen.
      `Kon de gegevens niet ophalen. (${e instanceof Error ? e.message : String(e)})`
    : 'Je bent offline en er zijn nog geen gegevens bewaard.';

/**
 * Laadt gegevens via de datalaag. Oude gegevens blijven staan tot de nieuwe binnen zijn.
 * Komt het toestel weer online, dan wordt opnieuw geladen. `vernieuw()` haalt alles opnieuw op
 * (voor omlaag vegen) en is klaar zodra de nieuwe gegevens er zijn. Kom je terug op deze pagina
 * (bijvoorbeeld na het afvinken van huiswerk), dan wordt ook stil opnieuw geladen.
 */
export function useLaden<T>(laad: () => Promise<T>, deps: DependencyList): Toestand<T> & { vernieuw: () => Promise<void> } {
  const [toestand, setToestand] = useState<Toestand<T>>({ laden: true });
  const [poging, setPoging] = useState(0);
  const zichtbaar = useLaagZichtbaar();
  const laadRef = useRef(laad);
  laadRef.current = laad;

  useEffect(() => {
    const weerOnline = () => setPoging((p) => p + 1);
    window.addEventListener('online', weerOnline);
    return () => window.removeEventListener('online', weerOnline);
  }, []);

  useEffect(() => {
    let actief = true;
    setToestand((t) => ({ data: t.data, laden: true }));
    laad().then(
      (data) => actief && setToestand({ data, laden: false }),
      (e: unknown) => actief && setToestand((t) => ({ data: t.data, fout: foutTekst(e), laden: false })),
    );
    return () => {
      actief = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, poging, zichtbaar]);

  const vernieuw = useCallback(async () => {
    try {
      const data = await laadRef.current();
      setToestand({ data, laden: false });
    } catch (e) {
      setToestand((t) => ({ data: t.data, fout: foutTekst(e), laden: false }));
    }
  }, []);

  return { ...toestand, vernieuw };
}
