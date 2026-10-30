import { useCallback, useEffect, useRef, useState, type DependencyList } from 'react';
import { useLaagZichtbaar } from '../lib/laag';

interface Toestand<T> {
  data?: T;
  fout?: string;
  laden: boolean;
}

/**
 * Laatst geladen gegevens per verzoek, zolang de app open is. Kom je terug op een tabblad, dan staat
 * de lijst (en de balk "Bijgewerkt op") er meteen weer, terwijl op de achtergrond opnieuw geladen wordt.
 */
const geheugen = new Map<string, unknown>();
const MAX_ONTHOUDEN = 60;

/** Bij uitloggen of een ander kind kiezen: niets van het vorige account laten zien. */
export function vergeetGeladen() {
  geheugen.clear();
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
  // Zelfde verzoek (zelfde code en zelfde waarden) = zelfde plek in het geheugen.
  const sleutel = `${laad.toString()}|${JSON.stringify(deps)}`;
  const sleutelRef = useRef(sleutel);
  sleutelRef.current = sleutel;
  const [toestand, setToestand] = useState<Toestand<T>>(() => ({ data: geheugen.get(sleutel) as T | undefined, laden: true }));
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
    const bekend = geheugen.get(sleutel) as T | undefined;
    setToestand((t) => ({ data: bekend ?? t.data, laden: true }));
    laad().then(
      (data) => {
        onthoud(sleutel, data);
        if (actief) setToestand({ data, laden: false });
      },
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
      onthoud(sleutelRef.current, data);
      setToestand({ data, laden: false });
    } catch (e) {
      setToestand((t) => ({ data: t.data, fout: foutTekst(e), laden: false }));
    }
  }, []);

  return { ...toestand, vernieuw };
}

function onthoud(sleutel: string, data: unknown) {
  geheugen.delete(sleutel);
  geheugen.set(sleutel, data);
  // Het oudste eerst weg.
  if (geheugen.size > MAX_ONTHOUDEN) geheugen.delete(geheugen.keys().next().value!);
}
